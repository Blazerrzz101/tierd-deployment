-- Drop the public views and functions first
DROP VIEW IF EXISTS public.reddit_threads_view;
DROP FUNCTION IF EXISTS public.fetch_reddit_threads;
DROP TYPE IF EXISTS public.reddit_thread_tag;

-- Drop the reddit_integration schema and all its objects
DROP SCHEMA IF EXISTS reddit_integration CASCADE; 