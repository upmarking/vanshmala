
-- =============================================
-- WALLET (DHAN) SYSTEM
-- =============================================

-- Wallets table
CREATE TABLE public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet" ON public.wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet" ON public.wallets
  FOR UPDATE USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- TRANSACTIONS TABLE
-- =============================================

CREATE TABLE public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id),
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'credit' or 'debit'
  amount NUMERIC(10, 2) NOT NULL,
  description TEXT NOT NULL,
  description_hi TEXT,
  reference_type TEXT, -- 'razorpay', 'transfer', 'panjikaran', 'referral', 'add_member'
  reference_id TEXT, -- razorpay payment id, transfer target, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.wallet_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- REFERRALS TABLE
-- =============================================

CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL, -- user who referred
  referred_user_id UUID NOT NULL, -- user who was referred
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed'
  referred_reward_given BOOLEAN NOT NULL DEFAULT false,
  referrer_reward_given BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(referrer_id, referred_user_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals as referrer" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view own referrals as referred" ON public.referrals
  FOR SELECT USING (auth.uid() = referred_user_id);

CREATE POLICY "Users can insert referrals" ON public.referrals
  FOR INSERT WITH CHECK (auth.uid() = referred_user_id);

CREATE POLICY "System can update referrals" ON public.referrals
  FOR UPDATE USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

-- =============================================
-- ADD referral_code TO profiles
-- =============================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Generate referral codes for existing profiles
UPDATE public.profiles 
SET referral_code = 'REF-' || UPPER(substr(md5(random()::text), 1, 6))
WHERE referral_code IS NULL;

-- Set default for new profiles
ALTER TABLE public.profiles 
  ALTER COLUMN referral_code SET DEFAULT 'REF-' || UPPER(substr(md5(random()::text), 1, 6));

-- =============================================
-- AUTO-CREATE WALLET ON SIGNUP
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name, avatar_url, email, referral_code)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    'REF-' || UPPER(substr(md5(new.id::text), 1, 6))
  );
  
  -- Add default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  -- Create wallet
  INSERT INTO public.wallets (user_id, balance)
  VALUES (new.id, 0.00);
  
  -- Handle referral: give ₹11 to new user if referred
  IF new.raw_user_meta_data->>'referral_code' IS NOT NULL THEN
    DECLARE
      v_referrer_id UUID;
      v_wallet_id UUID;
    BEGIN
      -- Find referrer
      SELECT user_id INTO v_referrer_id 
      FROM public.profiles 
      WHERE referral_code = new.raw_user_meta_data->>'referral_code';
      
      IF v_referrer_id IS NOT NULL THEN
        -- Create referral record
        INSERT INTO public.referrals (referrer_id, referred_user_id, referral_code, referred_reward_given)
        VALUES (v_referrer_id, new.id, new.raw_user_meta_data->>'referral_code', true);
        
        -- Credit ₹11 to new user's wallet
        SELECT id INTO v_wallet_id FROM public.wallets WHERE user_id = new.id;
        UPDATE public.wallets SET balance = balance + 11 WHERE user_id = new.id;
        
        INSERT INTO public.wallet_transactions (wallet_id, user_id, type, amount, description, description_hi, reference_type, reference_id)
        VALUES (v_wallet_id, new.id, 'credit', 11.00, 'Referral welcome bonus', 'रेफरल स्वागत बोनस', 'referral', v_referrer_id::text);
      END IF;
    END;
  END IF;
  
  RETURN new;
END;
$function$;

-- =============================================
-- FUNCTION: Process referrer reward (called when user creates/joins family)
-- =============================================

CREATE OR REPLACE FUNCTION public.process_referrer_reward(p_user_id UUID)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_referral RECORD;
  v_referrer_wallet_id UUID;
BEGIN
  -- Find pending referral for this user
  SELECT * INTO v_referral 
  FROM public.referrals 
  WHERE referred_user_id = p_user_id 
    AND status = 'pending' 
    AND referrer_reward_given = false
  LIMIT 1;
  
  IF v_referral.id IS NOT NULL THEN
    -- Get referrer's wallet
    SELECT id INTO v_referrer_wallet_id FROM public.wallets WHERE user_id = v_referral.referrer_id;
    
    -- Credit ₹11 to referrer
    UPDATE public.wallets SET balance = balance + 11 WHERE user_id = v_referral.referrer_id;
    
    INSERT INTO public.wallet_transactions (wallet_id, user_id, type, amount, description, description_hi, reference_type, reference_id)
    VALUES (v_referrer_wallet_id, v_referral.referrer_id, 'credit', 11.00, 'Referral reward', 'रेफरल इनाम', 'referral', p_user_id::text);
    
    -- Mark referral as completed
    UPDATE public.referrals 
    SET status = 'completed', referrer_reward_given = true, completed_at = now()
    WHERE id = v_referral.id;
  END IF;
END;
$function$;
