-- Enable public access to family_members that have a username set
-- This allows the Public Profile page to fetch member details without authentication

CREATE POLICY "Public profiles are viewable by everyone" 
ON public.family_members 
FOR SELECT 
TO anon, authenticated
USING (username IS NOT NULL);
