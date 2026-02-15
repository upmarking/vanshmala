-- Drop redundant lineage columns from profiles as we use family_relationships
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS father_id,
DROP COLUMN IF EXISTS mother_id;

-- Function to sync profile changes to family_members (on Profile UPDATE)
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
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for Profile UPDATE
DROP TRIGGER IF EXISTS on_profile_update_sync_member ON public.profiles;
CREATE TRIGGER on_profile_update_sync_member
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_to_family_member();

-- Function to sync member data from profile (on Member INSERT)
CREATE OR REPLACE FUNCTION public.sync_member_from_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- If user_id is linked, fetch authoritative data from profiles and overwrite the member data
    IF NEW.user_id IS NOT NULL THEN
        SELECT 
            full_name, full_name_hi, avatar_url, bio, date_of_birth, phone, gender, gotra
        INTO 
            NEW.full_name, NEW.full_name_hi, NEW.avatar_url, NEW.bio, NEW.date_of_birth, NEW.phone, NEW.gender, NEW.gotra
        FROM public.profiles
        WHERE user_id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for Member INSERT
DROP TRIGGER IF EXISTS on_member_insert_sync_profile ON public.family_members;
CREATE TRIGGER on_member_insert_sync_profile
BEFORE INSERT ON public.family_members
FOR EACH ROW
EXECUTE FUNCTION public.sync_member_from_profile();
