
-- Add status to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Create error_logs table
CREATE TABLE public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  provider text,
  model text,
  request_type text,
  error_type text NOT NULL,
  message text NOT NULL,
  details_json jsonb,
  severity text NOT NULL DEFAULT 'error',
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view error_logs" ON public.error_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_error_logs_created_at ON public.error_logs(created_at);
CREATE INDEX idx_error_logs_user_id ON public.error_logs(user_id);

-- Create admin_audit_logs table
CREATE TABLE public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  action_type text NOT NULL,
  target_type text,
  target_id text,
  details_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit_logs" ON public.admin_audit_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_audit_logs_admin_created ON public.admin_audit_logs(admin_user_id, created_at);

-- Create system_config table
CREATE TABLE public.system_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value_json jsonb NOT NULL,
  description text,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage system_config" ON public.system_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create provider_configs table
CREATE TABLE public.provider_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name text UNIQUE NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  timeout_seconds integer NOT NULL DEFAULT 60,
  retry_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read provider_configs" ON public.provider_configs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage provider_configs" ON public.provider_configs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create model_configs table
CREATE TABLE public.model_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name text NOT NULL,
  model_name text UNIQUE NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  cost_tier text NOT NULL DEFAULT 'standard',
  max_output_tokens integer NOT NULL DEFAULT 4096,
  timeout_seconds integer NOT NULL DEFAULT 60,
  retry_enabled boolean NOT NULL DEFAULT true,
  premium_only boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.model_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read model_configs" ON public.model_configs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage model_configs" ON public.model_configs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed provider_configs
INSERT INTO public.provider_configs (provider_name, enabled, timeout_seconds, retry_enabled) VALUES
  ('google', true, 60, true),
  ('openai', true, 60, true);

-- Seed model_configs
INSERT INTO public.model_configs (provider_name, model_name, enabled, cost_tier, max_output_tokens, timeout_seconds, retry_enabled, premium_only) VALUES
  ('google', 'google/gemini-3-flash-preview', true, 'standard', 4096, 60, true, false),
  ('google', 'google/gemini-2.5-flash', true, 'low', 4096, 60, true, false),
  ('google', 'google/gemini-2.5-pro', true, 'premium', 4096, 60, true, false),
  ('openai', 'openai/gpt-5', true, 'premium', 4096, 90, true, true),
  ('openai', 'openai/gpt-5-mini', true, 'standard', 4096, 60, true, false),
  ('openai', 'openai/gpt-5-nano', true, 'low', 4096, 30, true, false);

-- Seed system_config with defaults
INSERT INTO public.system_config (key, value_json, description) VALUES
  ('soft_cap_usd', '5.0', 'Monthly soft cap in USD'),
  ('hard_cap_usd', '10.0', 'Monthly hard cap in USD'),
  ('max_models_per_request', '6', 'Max models per prompt request'),
  ('max_prompt_length', '10000', 'Max prompt character length'),
  ('max_file_size_mb', '10', 'Max file upload size in MB'),
  ('max_extracted_text_length', '50000', 'Max extracted text length'),
  ('max_synthesis_input_length', '30000', 'Max synthesis input length'),
  ('default_cost_mode', '"balanced"', 'Default cost mode for new users'),
  ('feature_export', 'true', 'Enable export feature'),
  ('feature_share_links', 'true', 'Enable share links feature'),
  ('feature_onboarding', 'true', 'Enable onboarding flow'),
  ('feature_templates', 'true', 'Enable templates feature');

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
