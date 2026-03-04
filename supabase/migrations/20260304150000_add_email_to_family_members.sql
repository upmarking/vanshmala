-- Add email column to family_members table
ALTER TABLE public.family_members 
ADD COLUMN IF NOT EXISTS email text;

-- Create index for email search on family_members
CREATE INDEX IF NOT EXISTS idx_family_members_email ON public.family_members(email);
