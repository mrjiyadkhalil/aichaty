
-- Fix security definer views by making them explicitly security invoker
ALTER VIEW public.revenue_summary SET (security_invoker = on);
ALTER VIEW public.model_performance SET (security_invoker = on);
