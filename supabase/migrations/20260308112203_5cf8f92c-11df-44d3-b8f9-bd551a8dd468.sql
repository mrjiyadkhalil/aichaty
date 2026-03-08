
-- Add theme and onboarding_completed to user_preferences
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'dark';
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Chat tags
CREATE TABLE public.chat_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3b82f6',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own chat_tags" ON public.chat_tags FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Chat tag assignments
CREATE TABLE public.chat_tag_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.chat_tags(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(chat_id, tag_id)
);
ALTER TABLE public.chat_tag_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own chat_tag_assignments" ON public.chat_tag_assignments FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Bookmarks
CREATE TABLE public.bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  response_id uuid NOT NULL REFERENCES public.model_responses(id) ON DELETE CASCADE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, response_id)
);
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own bookmarks" ON public.bookmarks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
