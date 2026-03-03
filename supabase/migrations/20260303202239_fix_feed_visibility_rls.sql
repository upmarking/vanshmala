-- Fix: the feed_posts table user_id references profiles.id, not auth.users.id
-- So we must lookup the auth.users UUID before passing to check_feed_visibility

DROP POLICY IF EXISTS "Users can view feed posts based on visibility" ON public.feed_posts;

CREATE POLICY "Users can view feed posts based on visibility" ON public.feed_posts
  FOR SELECT TO authenticated USING (
    public.check_feed_visibility(
      auth.uid(), 
      (SELECT user_id FROM public.profiles WHERE id = feed_posts.user_id), 
      visibility
    )
  );
