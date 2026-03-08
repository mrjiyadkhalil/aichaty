
-- 1. Add ban/suspend columns to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS ban_reason text,
  ADD COLUMN IF NOT EXISTS banned_at timestamptz,
  ADD COLUMN IF NOT EXISTS banned_by uuid,
  ADD COLUMN IF NOT EXISTS suspended_until timestamptz;

-- 2. Add custom model columns to model_configs
ALTER TABLE public.model_configs
  ADD COLUMN IF NOT EXISTS provider_url text,
  ADD COLUMN IF NOT EXISTS api_key_env text,
  ADD COLUMN IF NOT EXISTS is_custom boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS request_format jsonb,
  ADD COLUMN IF NOT EXISTS short_label text;

-- 3. Create revenue_summary view
CREATE OR REPLACE VIEW public.revenue_summary AS
SELECT 
  date_trunc('day', created_at)::date AS day,
  model,
  provider,
  COUNT(*) AS total_requests,
  SUM(estimated_cost) AS total_revenue,
  COUNT(DISTINCT user_id) AS unique_users,
  SUM(input_tokens) AS total_input_tokens,
  SUM(output_tokens) AS total_output_tokens
FROM public.usage_events
WHERE status = 'success'
GROUP BY day, model, provider;

-- 4. Create model_performance view
CREATE OR REPLACE VIEW public.model_performance AS
SELECT
  model,
  provider,
  COUNT(*) AS total_requests,
  COUNT(*) FILTER (WHERE status = 'success') AS success_count,
  COUNT(*) FILTER (WHERE status = 'error') AS error_count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'success') / NULLIF(COUNT(*), 0), 1) AS success_rate,
  ROUND(AVG(latency_ms) FILTER (WHERE status = 'success'))::int AS avg_latency_ms,
  MIN(latency_ms) FILTER (WHERE status = 'success') AS min_latency_ms,
  MAX(latency_ms) FILTER (WHERE status = 'success') AS max_latency_ms,
  SUM(estimated_cost) AS total_cost
FROM public.usage_events
GROUP BY model, provider;
