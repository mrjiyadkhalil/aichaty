
-- usage_events table
CREATE TABLE public.usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  chat_id uuid REFERENCES public.chats(id) ON DELETE SET NULL,
  message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  provider text NOT NULL,
  model text NOT NULL,
  request_type text NOT NULL,
  input_tokens integer,
  output_tokens integer,
  estimated_cost numeric(10,6),
  latency_ms integer,
  status text NOT NULL DEFAULT 'success',
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage"
  ON public.usage_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_usage_events_user_created ON public.usage_events (user_id, created_at);

-- user_preferences table
CREATE TABLE public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  cost_mode text NOT NULL DEFAULT 'balanced',
  default_models text[],
  default_layout text NOT NULL DEFAULT 'grid',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD their own preferences"
  ON public.user_preferences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
