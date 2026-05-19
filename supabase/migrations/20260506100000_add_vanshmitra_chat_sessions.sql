-- ============================================================
-- VanshMitra AI Astrologer — Chat session persistence
-- Stores conversation history per user session.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.vanshmitra_chat_sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL DEFAULT 'New Consultation',
  language    text NOT NULL DEFAULT 'en',
  messages    jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vanshmitra_sessions_user
  ON public.vanshmitra_chat_sessions(user_id);

-- ============================================================
-- Row-Level Security
-- ============================================================
ALTER TABLE public.vanshmitra_chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat sessions"
  ON public.vanshmitra_chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat sessions"
  ON public.vanshmitra_chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions"
  ON public.vanshmitra_chat_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions"
  ON public.vanshmitra_chat_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER on_vanshmitra_session_update
  BEFORE UPDATE ON public.vanshmitra_chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_kundali_input_updated_at();
