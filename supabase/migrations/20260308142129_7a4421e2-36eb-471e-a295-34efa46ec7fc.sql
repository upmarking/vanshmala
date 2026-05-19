ALTER TABLE public.feed_posts ADD COLUMN event_date date DEFAULT NULL;
ALTER TABLE public.feed_posts ADD COLUMN event_time time DEFAULT NULL;