
-- Add is_verified column to profiles (true if user ever paid/had a debit transaction)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;

-- Backfill: mark users as verified if they have any debit wallet transaction
UPDATE public.profiles p
SET is_verified = true
WHERE EXISTS (
  SELECT 1 FROM public.wallet_transactions wt
  WHERE wt.user_id = p.user_id AND wt.type = 'debit'
);

-- Create a trigger to auto-set is_verified on new debit transactions
CREATE OR REPLACE FUNCTION public.auto_verify_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.type = 'debit' THEN
    UPDATE public.profiles SET is_verified = true WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_verify_on_payment
  AFTER INSERT ON public.wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_verify_on_payment();
