-- Create Storage Bucket for Avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'avatars' bucket
-- Allow authenticated users to upload their own avatar
CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'avatars' AND auth.role() = 'authenticated'
  );

-- Allow public to read avatars (since profile photos are public)
CREATE POLICY "Public can read avatars"
  ON storage.objects FOR SELECT TO public USING (
    bucket_id = 'avatars'
  );

-- Allow users to update their own avatar
CREATE POLICY "Users can update own avatars"
  ON storage.objects FOR UPDATE TO authenticated USING (
    bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete own avatars"
  ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
  );
