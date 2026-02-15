-- Redefine handle_new_user to include all necessary logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Create Profile with Vanshmala ID and Referral Code
  INSERT INTO public.profiles (user_id, full_name, avatar_url, email, vanshmala_id, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email,
    public.generate_vanshmala_id(),
    'REF-' || UPPER(substr(md5(NEW.id::text), 1, 6))
  );

  -- 2. Assign Default Role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  -- 3. Create Wallet
  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, 0.00);

  -- 4. Process Referral (if applicable)
  IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL THEN
    DECLARE
      v_referrer_id UUID;
      v_wallet_id UUID;
    BEGIN
      -- Find referrer
      SELECT user_id INTO v_referrer_id
      FROM public.profiles
      WHERE referral_code = NEW.raw_user_meta_data->>'referral_code';

      IF v_referrer_id IS NOT NULL THEN
        -- Create referral record
        INSERT INTO public.referrals (referrer_id, referred_user_id, referral_code, referred_reward_given)
        VALUES (v_referrer_id, NEW.id, NEW.raw_user_meta_data->>'referral_code', true);

        -- Credit ₹11 to new user's wallet
        SELECT id INTO v_wallet_id FROM public.wallets WHERE user_id = NEW.id;
        UPDATE public.wallets SET balance = balance + 11 WHERE user_id = NEW.id;

        INSERT INTO public.wallet_transactions (wallet_id, user_id, type, amount, description, description_hi, reference_type, reference_id)
        VALUES (v_wallet_id, NEW.id, 'credit', 11.00, 'Referral welcome bonus', 'रेफरल स्वागत बोनस', 'referral', v_referrer_id::text);
      END IF;
    END;
  END IF;

  RETURN NEW;
END;
$$;
