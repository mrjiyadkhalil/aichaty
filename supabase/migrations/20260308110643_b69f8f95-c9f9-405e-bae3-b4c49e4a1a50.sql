
-- 1. Broadcast messages table
CREATE TABLE public.broadcast_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  target text NOT NULL DEFAULT 'all',
  target_user_ids uuid[] DEFAULT NULL,
  sent_at timestamptz DEFAULT now(),
  sent_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.broadcast_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage broadcast_messages" ON public.broadcast_messages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. Usage quota override columns on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS custom_soft_cap numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS custom_hard_cap numeric DEFAULT NULL;

-- 3. Maintenance mode config (uses existing system_config table, no schema change needed)

-- 4. API key names table for managing which env keys are used
CREATE TABLE public.provider_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name text NOT NULL,
  env_key_name text NOT NULL,
  label text,
  is_set boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
ALTER TABLE public.provider_api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage provider_api_keys" ON public.provider_api_keys
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. User broadcast read tracking  
CREATE TABLE public.broadcast_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id uuid NOT NULL REFERENCES public.broadcast_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(broadcast_id, user_id)
);
ALTER TABLE public.broadcast_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own broadcast_reads" ON public.broadcast_reads
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
