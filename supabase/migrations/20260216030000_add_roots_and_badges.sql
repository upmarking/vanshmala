-- Add Ancestral Roots columns to profiles and family_members
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS mool_niwas TEXT,
ADD COLUMN IF NOT EXISTS kuldevi TEXT,
ADD COLUMN IF NOT EXISTS kuldevta TEXT;

ALTER TABLE public.family_members
ADD COLUMN IF NOT EXISTS mool_niwas TEXT,
ADD COLUMN IF NOT EXISTS kuldevi TEXT,
ADD COLUMN IF NOT EXISTS kuldevta TEXT;

-- Update sync_profile_to_family_member function to include new fields
CREATE OR REPLACE FUNCTION public.sync_profile_to_family_member()
RETURNS TRIGGER AS $$
BEGIN
    -- Update family_members where user_id matches the profile being updated
    UPDATE public.family_members
    SET 
        full_name = NEW.full_name,
        full_name_hi = NEW.full_name_hi,
        avatar_url = NEW.avatar_url,
        bio = NEW.bio,
        date_of_birth = NEW.date_of_birth,
        phone = NEW.phone,
        gender = NEW.gender,
        gotra = NEW.gotra,
        mool_niwas = NEW.mool_niwas,
        kuldevi = NEW.kuldevi,
        kuldevta = NEW.kuldevta,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update sync_member_from_profile function to include new fields
CREATE OR REPLACE FUNCTION public.sync_member_from_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- If user_id is linked, fetch authoritative data from profiles and overwrite the member data
    IF NEW.user_id IS NOT NULL THEN
        SELECT 
            full_name, full_name_hi, avatar_url, bio, date_of_birth, phone, gender, gotra, mool_niwas, kuldevi, kuldevta
        INTO 
            NEW.full_name, NEW.full_name_hi, NEW.avatar_url, NEW.bio, NEW.date_of_birth, NEW.phone, NEW.gender, NEW.gotra, NEW.mool_niwas, NEW.kuldevi, NEW.kuldevta
        FROM public.profiles
        WHERE user_id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check for "Verified Vansh" status (3+ generations)
CREATE OR REPLACE FUNCTION public.get_profile_verification_status(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    is_verified BOOLEAN;
BEGIN
    -- Check if the user is a member of any tree that has at least 3 generations
    SELECT EXISTS (
        SELECT 1
        FROM public.tree_memberships tm
        JOIN public.family_members fm ON tm.tree_id = fm.tree_id
        WHERE tm.user_id = check_user_id
        GROUP BY tm.tree_id
        HAVING MAX(fm.generation_level) - MIN(fm.generation_level) + 1 >= 3
    ) INTO is_verified;

    RETURN COALESCE(is_verified, false);
END;
$$;
