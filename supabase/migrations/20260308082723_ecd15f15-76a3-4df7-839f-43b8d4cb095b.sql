
-- Add columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_access_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at timestamptz;

-- Feature flags table
CREATE TABLE public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  description text,
  enabled boolean NOT NULL DEFAULT true,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage feature_flags" ON public.feature_flags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Announcements table
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  placement text NOT NULL DEFAULT 'dashboard',
  active boolean NOT NULL DEFAULT true,
  start_at timestamptz,
  end_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can read active announcements" ON public.announcements FOR SELECT TO authenticated
  USING (active = true);

-- System templates table
CREATE TABLE public.system_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  description text,
  prompt_body text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.system_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage system_templates" ON public.system_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can read active templates" ON public.system_templates FOR SELECT TO authenticated
  USING (active = true);

-- Share links table
CREATE TABLE public.share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES public.chats(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_accessed_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid
);
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own share_links" ON public.share_links FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all share_links" ON public.share_links FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update share_links" ON public.share_links FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin SELECT policy for usage_events
CREATE POLICY "Admins can view all usage" ON public.usage_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed default feature flags
INSERT INTO public.feature_flags (key, description, enabled) VALUES
  ('prompt_enhancer', 'Enable prompt enhancement feature', true),
  ('synthesis', 'Enable synthesis/merge of model responses', true),
  ('share_links', 'Enable share link generation', true),
  ('file_upload', 'Enable file upload in projects', true),
  ('exports', 'Enable response export (Markdown, PDF, etc.)', true),
  ('onboarding', 'Show onboarding flow for new users', true),
  ('system_templates', 'Show system prompt templates', true),
  ('user_templates', 'Allow users to create custom templates', true),
  ('announcements', 'Show platform announcements to users', true),
  ('explore_cards', 'Show explore/recommendation cards', true),
  ('image_generation', 'Enable AI image generation', false);
