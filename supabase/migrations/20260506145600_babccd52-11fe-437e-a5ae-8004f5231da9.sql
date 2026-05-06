
-- 1. deduct_wallet_balance: enforce caller == p_user_id
CREATE OR REPLACE FUNCTION public.deduct_wallet_balance(p_user_id uuid, p_amount numeric, p_description text, p_description_hi text, p_reference_type text, p_reference_id text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_wallet RECORD;
BEGIN
  -- Only allow the caller to deduct from their own wallet (unless invoked from another SECURITY DEFINER function)
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: cannot deduct from another user''s wallet';
  END IF;

  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id;

  IF v_wallet.id IS NULL OR v_wallet.balance < p_amount THEN
    RETURN false;
  END IF;

  UPDATE public.wallets SET balance = balance - p_amount WHERE id = v_wallet.id;

  INSERT INTO public.wallet_transactions (wallet_id, user_id, type, amount, description, description_hi, reference_type, reference_id)
  VALUES (v_wallet.id, p_user_id, 'debit', p_amount, p_description, p_description_hi, p_reference_type, p_reference_id);

  RETURN true;
END;
$function$;

-- 2. process_wallet_transfer: lock down to internal use only (revoke EXECUTE from clients)
REVOKE EXECUTE ON FUNCTION public.process_wallet_transfer(uuid, numeric, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.deduct_wallet_balance(uuid, numeric, text, text, text, text) FROM PUBLIC, anon, authenticated;

-- 3. New atomic transfer RPC that verifies the caller is the sender
CREATE OR REPLACE FUNCTION public.transfer_wallet_funds(p_recipient_user_id uuid, p_amount numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_sender_id uuid := auth.uid();
  v_sender_wallet RECORD;
  v_sender_profile RECORD;
BEGIN
  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: not authenticated';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;
  IF p_recipient_user_id = v_sender_id THEN
    RAISE EXCEPTION 'Cannot transfer to yourself';
  END IF;

  SELECT * INTO v_sender_wallet FROM public.wallets WHERE user_id = v_sender_id FOR UPDATE;
  IF v_sender_wallet.id IS NULL OR v_sender_wallet.balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  SELECT full_name, vanshmala_id INTO v_sender_profile
  FROM public.profiles WHERE user_id = v_sender_id;

  -- Debit sender
  UPDATE public.wallets SET balance = balance - p_amount WHERE id = v_sender_wallet.id;
  INSERT INTO public.wallet_transactions (wallet_id, user_id, type, amount, description, description_hi, reference_type, reference_id)
  VALUES (v_sender_wallet.id, v_sender_id, 'debit', p_amount,
    'Transfer to ' || COALESCE(v_sender_profile.full_name, ''),
    COALESCE(v_sender_profile.full_name, '') || ' को भेजे',
    'transfer', p_recipient_user_id::text);

  -- Credit recipient using existing helper (runs under definer privileges)
  PERFORM public.process_wallet_transfer(
    p_recipient_user_id,
    p_amount,
    COALESCE(v_sender_profile.full_name, 'User'),
    COALESCE(v_sender_profile.vanshmala_id, '')
  );

  RETURN jsonb_build_object('success', true, 'amount', p_amount);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.transfer_wallet_funds(uuid, numeric) TO authenticated;

-- 4. process_post_contribution: verify the caller owns the contributor_profile_id
CREATE OR REPLACE FUNCTION public.process_post_contribution(p_post_id uuid, p_contributor_profile_id uuid, p_reward_type text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_amount numeric;
  v_contributor_user_id uuid;
  v_post_author_profile_id uuid;
  v_post_author_user_id uuid;
  v_contributor_name text;
  v_contributor_vmid text;
BEGIN
  v_amount := CASE p_reward_type
    WHEN 'leaf' THEN 11
    WHEN 'rose' THEN 101
    WHEN 'diamond' THEN 501
    WHEN 'star' THEN 1111
    ELSE NULL
  END;
  IF v_amount IS NULL THEN
    RAISE EXCEPTION 'Invalid reward type: %', p_reward_type;
  END IF;

  SELECT user_id, full_name, vanshmala_id
  INTO v_contributor_user_id, v_contributor_name, v_contributor_vmid
  FROM public.profiles WHERE id = p_contributor_profile_id;

  IF v_contributor_user_id IS NULL THEN
    RAISE EXCEPTION 'Contributor profile not found';
  END IF;

  -- Enforce: caller must own the contributor profile
  IF v_contributor_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: profile does not belong to caller';
  END IF;

  SELECT fp.user_id, p.user_id
  INTO v_post_author_profile_id, v_post_author_user_id
  FROM public.feed_posts fp
  JOIN public.profiles p ON p.id = fp.user_id
  WHERE fp.id = p_post_id;

  IF v_post_author_user_id IS NULL THEN
    RAISE EXCEPTION 'Post or post author not found';
  END IF;

  IF v_contributor_user_id = v_post_author_user_id THEN
    RAISE EXCEPTION 'Cannot contribute to your own post';
  END IF;

  IF NOT public.deduct_wallet_balance(
    v_contributor_user_id, v_amount,
    'Anshdaan: ' || p_reward_type || ' gift on post',
    'अंशदान: पोस्ट पर ' || p_reward_type || ' उपहार',
    'anshdaan', p_post_id::text
  ) THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  PERFORM public.process_wallet_transfer(
    v_post_author_user_id, v_amount, v_contributor_name, v_contributor_vmid
  );

  INSERT INTO public.post_contributions (post_id, contributor_profile_id, reward_type, amount)
  VALUES (p_post_id, p_contributor_profile_id, p_reward_type, v_amount);
END;
$function$;

-- 5. wallets UPDATE policy: prevent client-side balance writes
DROP POLICY IF EXISTS "Users can update own wallet" ON public.wallets;
CREATE POLICY "Users can update own wallet metadata"
ON public.wallets
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND balance = (SELECT w.balance FROM public.wallets w WHERE w.id = wallets.id));

-- 6. gift_cards UPDATE policy: only allow claiming for self
DROP POLICY IF EXISTS "Users can update gift cards for redemption" ON public.gift_cards;
-- Redemption goes through redeem_gift_card SECURITY DEFINER RPC; no direct client update needed.

-- 7. post_contributions: remove permissive direct INSERT (handled by process_post_contribution definer)
DROP POLICY IF EXISTS "Users can insert own contributions" ON public.post_contributions;
CREATE POLICY "Users can insert own contributions"
ON public.post_contributions
FOR INSERT
TO authenticated
WITH CHECK (
  contributor_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- 8. storage.objects: restrict documents bucket SELECT to tree members
DROP POLICY IF EXISTS "Authenticated users can read documents" ON storage.objects;
CREATE POLICY "Tree members can read documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.file_path = storage.objects.name
      AND public.is_tree_member(auth.uid(), d.tree_id)
  )
);
