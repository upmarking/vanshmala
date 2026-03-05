-- Migration to create app_review_offers table and wallet credit trigger

CREATE TABLE public.app_review_offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  screenshot_url TEXT NOT NULL,
  consent_given BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.app_review_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own offer submission"
  ON public.app_review_offers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own offer submission"
  ON public.app_review_offers
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create Storage Bucket for App Reviews
INSERT INTO storage.buckets (id, name, public)
VALUES ('app_reviews', 'app_reviews', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'app_reviews' bucket
CREATE POLICY "Authenticated users can upload app reviews"
  ON storage.objects FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'app_reviews' AND auth.role() = 'authenticated'
  );

CREATE POLICY "Public can read app reviews"
  ON storage.objects FOR SELECT TO public USING (
    bucket_id = 'app_reviews'
  );

-- trigger to credit wallet
CREATE OR REPLACE FUNCTION public.credit_wallet_on_app_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_wallet_id UUID;
BEGIN
  -- Get user's wallet
  SELECT id INTO v_wallet_id FROM public.wallets WHERE user_id = NEW.user_id;
  
  IF v_wallet_id IS NOT NULL THEN
    -- Add 500 to balance
    UPDATE public.wallets SET balance = balance + 500 WHERE id = v_wallet_id;
    
    -- Insert transaction
    INSERT INTO public.wallet_transactions (
      wallet_id, 
      user_id, 
      type, 
      amount, 
      description, 
      description_hi, 
      reference_type, 
      reference_id
    )
    VALUES (
      v_wallet_id,
      NEW.user_id,
      'credit',
      500,
      'App Store Review Offer Reward (Jai Shree Ram)',
      'ऐप स्टोर रिव्यू ऑफर इनाम (जय श्री राम)',
      'offer',
      NEW.id::text
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER credit_wallet_on_app_review_trigger
  AFTER INSERT ON public.app_review_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.credit_wallet_on_app_review();
