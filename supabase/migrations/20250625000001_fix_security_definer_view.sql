-- Fix security definer view issue for dish_summary_secure
-- Replace the view to use SECURITY INVOKER instead of SECURITY DEFINER

-- Drop the existing view
DROP VIEW IF EXISTS public.dish_summary_secure;

-- Recreate the view with SECURITY INVOKER to run with the privileges of the querying user
CREATE VIEW public.dish_summary_secure 
WITH (security_invoker = true) AS
SELECT * FROM public.dish_summary
WHERE user_id = auth.uid();

-- Grant access to the secure view
GRANT SELECT ON public.dish_summary_secure TO anon, authenticated;