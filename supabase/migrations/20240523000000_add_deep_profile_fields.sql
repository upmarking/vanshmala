-- Add new columns for Deep Personal Profile
ALTER TABLE family_members
ADD COLUMN IF NOT EXISTS username text UNIQUE,
ADD COLUMN IF NOT EXISTS place_of_birth text,
ADD COLUMN IF NOT EXISTS blood_group text,
ADD COLUMN IF NOT EXISTS marriage_date date,
ADD COLUMN IF NOT EXISTS education jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS career jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS achievements text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS awards text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS migration_info jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS privacy_settings jsonb DEFAULT '{}'::jsonb;

-- Add comment to privacy_settings to explain structure
COMMENT ON COLUMN family_members.privacy_settings IS 'Stores privacy levels (public, family, private) for each field key.';

-- Create index for username for faster lookups
CREATE INDEX IF NOT EXISTS idx_family_members_username ON family_members(username);
