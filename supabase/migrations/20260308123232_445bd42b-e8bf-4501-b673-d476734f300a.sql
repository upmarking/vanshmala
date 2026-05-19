
-- post_contributions table
CREATE TABLE public.post_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  contributor_profile_id uuid NOT NULL,
  reward_type text NOT NULL CHECK (reward_type IN ('leaf', 'rose', 'diamond', 'star')),
  amount numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.post_contributions ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can see contributions (to show counts)
CREATE POLICY "Anyone can view contributions"
  ON public.post_contributions FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert own contributions (enforced by RPC but needed for completeness)
CREATE POLICY "Users can insert own contributions"
  ON public.post_contributions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RPC: process_post_contribution
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

  -- Credit to post author's wallet
  PERFORM public.process_wallet_transfer(
    v_post_author_user_id,
    v_amount,
    v_contributor_name,
    v_contributor_vmid
  );

  -- Record the contribution
  INSERT INTO public.post_contributions (post_id, contributor_profile_id, reward_type, amount)
  VALUES (p_post_id, p_contributor_profile_id, p_reward_type, v_amount);
END;
$$;
