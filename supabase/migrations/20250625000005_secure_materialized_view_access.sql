-- Remove direct API access to dish_summary materialized view
-- Only allow access through the dish_summary_secure view

-- Revoke direct access to the materialized view from API users
REVOKE SELECT ON public.dish_summary FROM anon, authenticated;

-- Grant access to the service role so the secure view can still access it
-- The service role is used internally by Supabase and our secure view
GRANT SELECT ON public.dish_summary TO service_role;

-- Ensure our secure view still works by granting it the necessary permissions
-- Views created by the service role can access the underlying materialized view
GRANT SELECT ON public.dish_summary_secure TO anon, authenticated;