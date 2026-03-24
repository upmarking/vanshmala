-- Update function to securely handle wallet transfers
-- The deduction is now enforced server-side instead of relying on client updates.
CREATE OR REPLACE FUNCTION public.process_wallet_transfer(
  p_recipient_user_id UUID,
  p_amount NUMERIC,
  p_sender_name TEXT,
  p_sender_vanshmala_id TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_recipient_wallet_id UUID;
  v_sender_wallet_id UUID;
  v_sender_user_id UUID;
  v_sender_balance NUMERIC;
  v_recipient_name TEXT;
  v_recipient_vanshmala_id TEXT;
BEGIN
  v_sender_user_id := auth.uid();

  -- Disallow transferring to yourself
  IF v_sender_user_id = p_recipient_user_id THEN
    RAISE EXCEPTION 'Cannot transfer to yourself';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be positive';
  END IF;

  -- Lock sender wallet for update to prevent concurrent double-spend
  SELECT id, balance INTO v_sender_wallet_id, v_sender_balance
  FROM public.wallets
  WHERE user_id = v_sender_user_id
  FOR UPDATE;

  IF v_sender_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Sender wallet not found';
  END IF;

  IF v_sender_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Deduct from sender's wallet
  UPDATE public.wallets
  SET balance = balance - p_amount
  WHERE id = v_sender_wallet_id;

  -- Get recipient details for sender's transaction record
  SELECT full_name, vanshmala_id
  INTO v_recipient_name, v_recipient_vanshmala_id
  FROM public.profiles
  WHERE user_id = p_recipient_user_id;

  -- Insert debit transaction for sender
  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, amount,
    description,
    description_hi,
    reference_type, reference_id
  ) VALUES (
    v_sender_wallet_id, v_sender_user_id, 'debit', p_amount,
    'Transfer to ' || v_recipient_name || ' (' || v_recipient_vanshmala_id || ')',
    v_recipient_name || ' (' || v_recipient_vanshmala_id || ') को भेजे',
    'transfer', p_recipient_user_id::text
  );

  -- Check if recipient wallet exists, locking it if it does
  SELECT id INTO v_recipient_wallet_id
  FROM public.wallets
  WHERE user_id = p_recipient_user_id
  FOR UPDATE;

  -- If not, create it dynamically
  IF v_recipient_wallet_id IS NULL THEN
    INSERT INTO public.wallets (user_id, balance)
    VALUES (p_recipient_user_id, 0)
    RETURNING id INTO v_recipient_wallet_id;
  END IF;

  -- Add amount to recipient's wallet
  UPDATE public.wallets
  SET balance = balance + p_amount
  WHERE id = v_recipient_wallet_id;

  -- Insert credit transaction record for recipient
  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, amount,
    description,
    description_hi,
    reference_type, reference_id
  ) VALUES (
    v_recipient_wallet_id, p_recipient_user_id, 'credit', p_amount,
    'Received from ' || p_sender_name || ' (' || p_sender_vanshmala_id || ')',
    p_sender_name || ' (' || p_sender_vanshmala_id || ') से प्राप्त',
    'transfer', p_sender_vanshmala_id
  );
END;
$function$;


-- We need to update process_post_contribution because it calls process_wallet_transfer.
-- process_wallet_transfer now requires auth.uid() to be the sender, and deducts from them.
-- But post contributions are already deducted in this function, so we must manually credit the author.
CREATE OR REPLACE FUNCTION public.process_post_contribution(
  p_post_id uuid,
  p_contributor_profile_id uuid,
  p_reward_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_amount numeric;
  v_contributor_user_id uuid;
  v_post_author_profile_id uuid;
  v_post_author_user_id uuid;
  v_contributor_name text;
  v_contributor_vmid text;
  v_recipient_wallet_id uuid;
BEGIN
  -- Map reward type to amount
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

  -- Get contributor's user_id, name, vanshmala_id
  SELECT user_id, full_name, vanshmala_id
  INTO v_contributor_user_id, v_contributor_name, v_contributor_vmid
  FROM public.profiles
  WHERE id = p_contributor_profile_id;

  IF v_contributor_user_id IS NULL THEN
    RAISE EXCEPTION 'Contributor profile not found';
  END IF;

  -- Get post author's profile_id and user_id
  SELECT fp.user_id, p.user_id
  INTO v_post_author_profile_id, v_post_author_user_id
  FROM public.feed_posts fp
  JOIN public.profiles p ON p.id = fp.user_id
  WHERE fp.id = p_post_id;

  IF v_post_author_user_id IS NULL THEN
    RAISE EXCEPTION 'Post or post author not found';
  END IF;

  -- Prevent self-contribution
  IF v_contributor_user_id = v_post_author_user_id THEN
    RAISE EXCEPTION 'Cannot contribute to your own post';
  END IF;

  -- Deduct from contributor's wallet
  IF NOT public.deduct_wallet_balance(
    v_contributor_user_id,
    v_amount,
    'Anshdaan: ' || p_reward_type || ' gift on post',
    'अंशदान: पोस्ट पर ' || p_reward_type || ' उपहार',
    'anshdaan',
    p_post_id::text
  ) THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  -- Credit to post author's wallet directly
  SELECT id INTO v_recipient_wallet_id
  FROM public.wallets
  WHERE user_id = v_post_author_user_id
  FOR UPDATE;

  -- If not, create it dynamically
  IF v_recipient_wallet_id IS NULL THEN
    INSERT INTO public.wallets (user_id, balance)
    VALUES (v_post_author_user_id, 0)
    RETURNING id INTO v_recipient_wallet_id;
  END IF;

  UPDATE public.wallets
  SET balance = balance + v_amount
  WHERE id = v_recipient_wallet_id;

  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, amount,
    description, description_hi,
    reference_type, reference_id
  ) VALUES (
    v_recipient_wallet_id, v_post_author_user_id, 'credit', v_amount,
    'Received from ' || v_contributor_name || ' (' || v_contributor_vmid || ')',
    v_contributor_name || ' (' || v_contributor_vmid || ') से प्राप्त',
    'transfer', v_contributor_vmid
  );

  -- Record the contribution
  INSERT INTO public.post_contributions (post_id, contributor_profile_id, reward_type, amount)
  VALUES (p_post_id, p_contributor_profile_id, p_reward_type, v_amount);
END;
$$;
