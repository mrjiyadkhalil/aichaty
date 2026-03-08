
-- Subscription plans table
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name text NOT NULL UNIQUE,
  price_monthly numeric NOT NULL DEFAULT 0,
  price_yearly numeric NOT NULL DEFAULT 0,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read plans" ON public.subscription_plans FOR SELECT USING (true);

-- Add plan column to profiles
ALTER TABLE public.profiles ADD COLUMN plan text NOT NULL DEFAULT 'free';

-- User sessions table
CREATE TABLE public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_name text,
  browser text,
  os text,
  ip_address text,
  location text,
  last_active timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  is_current boolean NOT NULL DEFAULT false,
  session_token text
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON public.user_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON public.user_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.user_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.user_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Seed subscription plans
INSERT INTO public.subscription_plans (plan_name, price_monthly, price_yearly, features) VALUES
('free', 0, 0, '{"messages_per_day": 20, "max_output_tokens": 2048, "models": ["google/gemini-2.5-flash", "openai/gpt-5-nano"], "file_uploads": false, "projects": false, "multi_chat": false, "synthesis": false, "prompt_library": false, "bookmarks": false, "export": false, "custom_system_prompt": false, "usage_cap_soft": 5, "usage_cap_hard": 10}'::jsonb),
('pro', 12, 99, '{"messages_per_day": -1, "max_output_tokens": 4096, "models": ["google/gemini-3-flash-preview", "google/gemini-2.5-flash", "google/gemini-2.5-pro", "openai/gpt-5-mini", "openai/gpt-5-nano"], "file_uploads": true, "file_max_mb": 10, "projects": true, "multi_chat": true, "synthesis": true, "prompt_library": true, "bookmarks": true, "export": true, "custom_system_prompt": false, "usage_cap_soft": 5, "usage_cap_hard": 10}'::jsonb),
('enterprise', 49, 399, '{"messages_per_day": -1, "max_output_tokens": 8192, "models": "all", "file_uploads": true, "file_max_mb": 10, "projects": true, "multi_chat": true, "synthesis": true, "prompt_library": true, "bookmarks": true, "export": true, "custom_system_prompt": true, "priority_speed": true, "admin_dashboard": true, "usage_cap_soft": 50, "usage_cap_hard": 100}'::jsonb);
