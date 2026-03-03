-- Update function to handle wallet transfers gracefully by creating the recipient wallet
-- if they have never visited the wallet page before.
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
  -- Check if recipient wallet exists
  SELECT id INTO v_recipient_wallet_id FROM public.wallets WHERE user_id = p_recipient_user_id;
  
  -- If not, create it dynamically
  IF v_recipient_wallet_id IS NULL THEN
    INSERT INTO public.wallets (user_id, balance) 
    VALUES (p_recipient_user_id, 0)
    RETURNING id INTO v_recipient_wallet_id;
  END IF;
  
  -- Add amount to recipient's wallet
  UPDATE public.wallets SET balance = balance + p_amount WHERE id = v_recipient_wallet_id;
  
  -- Insert transaction record
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
