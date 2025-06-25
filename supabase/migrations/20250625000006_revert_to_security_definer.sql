-- Revert to SECURITY DEFINER approach but ensure it's properly secured
-- The view itself handles security by filtering on auth.uid()

-- Drop the current security invoker view
DROP VIEW IF EXISTS public.dish_summary_secure;

-- Recreate as SECURITY DEFINER (default) but with proper filtering
-- This allows the view to access the materialized view with owner permissions
-- while still filtering results by the authenticated user
CREATE VIEW public.dish_summary_secure AS
SELECT * FROM public.dish_summary
WHERE user_id = auth.uid();

-- Grant access to the secure view
GRANT SELECT ON public.dish_summary_secure TO anon, authenticated;

-- Keep the materialized view restricted from direct access
-- Only allow service_role to access it directly
REVOKE SELECT ON public.dish_summary FROM anon, authenticated;
GRANT SELECT ON public.dish_summary TO service_role;