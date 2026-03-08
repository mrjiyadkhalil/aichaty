
INSERT INTO public.model_configs (model_name, provider_name, enabled, is_custom, cost_tier, max_output_tokens, timeout_seconds, retry_enabled, short_label, provider_url, api_key_env)
VALUES
  ('anthropic/claude-4-sonnet', 'anthropic', false, true, 'premium', 8192, 90, true, 'C4S', 'https://api.anthropic.com/v1/messages', 'ANTHROPIC_API_KEY'),
  ('anthropic/claude-4-haiku', 'anthropic', false, true, 'low', 4096, 60, true, 'C4H', 'https://api.anthropic.com/v1/messages', 'ANTHROPIC_API_KEY'),
  ('deepseek/deepseek-v3', 'deepseek', false, true, 'low', 8192, 60, true, 'DSv3', 'https://api.deepseek.com/v1/chat/completions', 'DEEPSEEK_API_KEY'),
  ('deepseek/deepseek-r1', 'deepseek', false, true, 'balanced', 8192, 90, true, 'DSr1', 'https://api.deepseek.com/v1/chat/completions', 'DEEPSEEK_API_KEY'),
  ('mistral/mistral-large', 'mistral', false, true, 'premium', 8192, 90, true, 'MisL', 'https://api.mistral.ai/v1/chat/completions', 'MISTRAL_API_KEY'),
  ('mistral/codestral', 'mistral', false, true, 'low', 8192, 60, true, 'CdSt', 'https://api.mistral.ai/v1/chat/completions', 'MISTRAL_API_KEY'),
  ('kimi/moonshot-v1', 'kimi', false, true, 'balanced', 8192, 60, true, 'Moon', 'https://api.moonshot.cn/v1/chat/completions', 'KIMI_API_KEY')
ON CONFLICT DO NOTHING;
