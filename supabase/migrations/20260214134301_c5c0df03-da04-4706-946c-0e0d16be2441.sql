
-- Function to handle wallet transfers (bypasses RLS via security definer)
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
BEGIN
  SELECT id INTO v_recipient_wallet_id FROM public.wallets WHERE user_id = p_recipient_user_id;
  
  IF v_recipient_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Recipient wallet not found';
  END IF;
  
  UPDATE public.wallets SET balance = balance + p_amount WHERE id = v_recipient_wallet_id;
  
  INSERT INTO public.wallet_transactions (wallet_id, user_id, type, amount, description, description_hi, reference_type, reference_id)
  VALUES (
    v_recipient_wallet_id,
    p_recipient_user_id,
    'credit',
    p_amount,
    'Received from ' || p_sender_name || ' (' || p_sender_vanshmala_id || ')',
    p_sender_name || ' (' || p_sender_vanshmala_id || ') से प्राप्त',
    'transfer',
    p_sender_vanshmala_id
  );
END;
$function$;

-- Function to deduct wallet balance (for panjikaran fees)
CREATE OR REPLACE FUNCTION public.deduct_wallet_balance(
  p_user_id UUID,
  p_amount NUMERIC,
  p_description TEXT,
  p_description_hi TEXT,
  p_reference_type TEXT,
  p_reference_id TEXT
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_wallet RECORD;
BEGIN
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
