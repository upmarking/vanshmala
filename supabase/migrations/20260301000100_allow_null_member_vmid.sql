-- Fix: Allow vanshmala_id to be NULL in family_members.
-- This is necessary to allow delinking a profile from a family tree node.
-- When a node is not linked to an actual user profile, it may not have a Vanshmala ID.

ALTER TABLE public.family_members ALTER COLUMN vanshmala_id DROP NOT NULL;

-- Note: Postgres UNIQUE constraint allows multiple NULL values, 
-- so this won't break the uniqueness for linked members.
