
ALTER TABLE public.messages 
  ADD COLUMN IF NOT EXISTS enhanced_content text,
  ADD COLUMN IF NOT EXISTS final_content text,
  ADD COLUMN IF NOT EXISTS file_context_ids uuid[] DEFAULT '{}';

ALTER TABLE public.model_responses 
  ADD COLUMN IF NOT EXISTS latency_ms integer;
