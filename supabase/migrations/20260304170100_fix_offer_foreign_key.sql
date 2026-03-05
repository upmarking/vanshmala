-- Fix foreign key constraint for app_review_offers
-- It was incorrectly referencing profiles(id) instead of profiles(user_id)

ALTER TABLE public.app_review_offers 
DROP CONSTRAINT app_review_offers_user_id_fkey;

ALTER TABLE public.app_review_offers
ADD CONSTRAINT app_review_offers_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
