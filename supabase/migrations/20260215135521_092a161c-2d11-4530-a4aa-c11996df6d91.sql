
-- Gift Cards table
CREATE TABLE public.gift_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL,
  created_by UUID NOT NULL,
  redeemed_by UUID,
  is_redeemed BOOLEAN NOT NULL DEFAULT false,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own created gift cards" ON public.gift_cards FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can view redeemed gift cards" ON public.gift_cards FOR SELECT USING (auth.uid() = redeemed_by);
CREATE POLICY "Users can create gift cards" ON public.gift_cards FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update gift cards for redemption" ON public.gift_cards FOR UPDATE USING (is_redeemed = false);

-- Discount Codes table
CREATE TABLE public.discount_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  description_hi TEXT,
  discount_percentage NUMERIC NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  max_discount NUMERIC NOT NULL,
  min_transaction_value NUMERIC NOT NULL DEFAULT 0,
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view active discount codes (to validate them)
CREATE POLICY "Authenticated users can view active discount codes" ON public.discount_codes FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

-- Discount code usage tracking
CREATE TABLE public.discount_code_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discount_code_id UUID NOT NULL REFERENCES public.discount_codes(id),
  user_id UUID NOT NULL,
  amount_added NUMERIC NOT NULL,
  discount_amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.discount_code_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage" ON public.discount_code_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage" ON public.discount_code_usage FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to redeem a gift card
CREATE OR REPLACE FUNCTION public.redeem_gift_card(p_code TEXT, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_gift_card RECORD;
  v_wallet RECORD;
BEGIN
  SELECT * INTO v_gift_card FROM public.gift_cards WHERE code = p_code AND is_redeemed = false;
  
  IF v_gift_card.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or already redeemed gift card');
  END IF;

  IF v_gift_card.expires_at IS NOT NULL AND v_gift_card.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Gift card has expired');
  END IF;

  IF v_gift_card.created_by = p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot redeem your own gift card');
  END IF;

  -- Mark as redeemed
  UPDATE public.gift_cards SET is_redeemed = true, redeemed_by = p_user_id, redeemed_at = now() WHERE id = v_gift_card.id;

  -- Credit wallet
  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id;
  IF v_wallet.id IS NULL THEN
    INSERT INTO public.wallets (user_id, balance) VALUES (p_user_id, 0) RETURNING * INTO v_wallet;
  END IF;

  UPDATE public.wallets SET balance = balance + v_gift_card.amount WHERE id = v_wallet.id;

  INSERT INTO public.wallet_transactions (wallet_id, user_id, type, amount, description, description_hi, reference_type, reference_id)
  VALUES (v_wallet.id, p_user_id, 'credit', v_gift_card.amount, 
    'Gift card redeemed: ' || p_code, 'गिफ्ट कार्ड भुनाया: ' || p_code, 'gift_card', v_gift_card.id::text);

  RETURN jsonb_build_object('success', true, 'amount', v_gift_card.amount);
END;
$$;

-- Function to validate and apply discount code
CREATE OR REPLACE FUNCTION public.validate_discount_code(p_code TEXT, p_amount NUMERIC, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_discount RECORD;
  v_user_used BOOLEAN;
  v_discount_amount NUMERIC;
BEGIN
  SELECT * INTO v_discount FROM public.discount_codes WHERE code = p_code AND is_active = true;

  IF v_discount.id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid discount code');
  END IF;

  IF v_discount.valid_until IS NOT NULL AND v_discount.valid_until < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Discount code has expired');
  END IF;

  IF v_discount.valid_from > now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Discount code is not yet active');
  END IF;

  IF v_discount.max_uses IS NOT NULL AND v_discount.current_uses >= v_discount.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Discount code usage limit reached');
  END IF;

  IF p_amount < v_discount.min_transaction_value THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Minimum transaction value is ₹' || v_discount.min_transaction_value);
  END IF;

  -- Check if user already used this code
  SELECT EXISTS(SELECT 1 FROM public.discount_code_usage WHERE discount_code_id = v_discount.id AND user_id = p_user_id) INTO v_user_used;
  IF v_user_used THEN
    RETURN jsonb_build_object('valid', false, 'error', 'You have already used this discount code');
  END IF;

  v_discount_amount := LEAST(p_amount * v_discount.discount_percentage / 100, v_discount.max_discount);

  RETURN jsonb_build_object('valid', true, 'discount_amount', v_discount_amount, 'discount_id', v_discount.id, 'percentage', v_discount.discount_percentage);
END;
$$;
