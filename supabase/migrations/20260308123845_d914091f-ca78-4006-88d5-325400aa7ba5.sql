
-- User memories table for chat memory
CREATE TABLE public.user_memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  fact TEXT NOT NULL,
  source_chat_id UUID REFERENCES public.chats(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own memories" ON public.user_memories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Response ratings table
CREATE TABLE public.response_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  response_id UUID NOT NULL REFERENCES public.model_responses(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating IN (-1, 1)),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, response_id)
);
ALTER TABLE public.response_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own ratings" ON public.response_ratings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all ratings" ON public.response_ratings FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- User prompts / prompt library
CREATE TABLE public.user_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  use_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.user_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own prompts" ON public.user_prompts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Add custom_system_prompt to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS custom_system_prompt TEXT DEFAULT '';
