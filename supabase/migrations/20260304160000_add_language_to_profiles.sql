-- Add language column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

-- Update the sync_profile_to_family_member function if needed (though language might not be needed in family_members)
-- For now, we only need it in profiles for UI settings.
