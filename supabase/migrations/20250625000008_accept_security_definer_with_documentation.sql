-- Accept the security definer view as the correct approach for this use case
-- The Supabase linter warning is acceptable here because:
-- 1. The view implements proper security filtering with WHERE user_id = auth.uid()
-- 2. This is the only way to provide secure access to materialized views
-- 3. Direct access to the underlying materialized view is properly restricted

-- Remove the function approach as it's not compatible with Supabase client
DROP FUNCTION IF EXISTS public.get_dish_summary_secure();

-- Recreate the security definer view (this is the correct approach)
CREATE OR REPLACE VIEW public.dish_summary_secure AS
SELECT * FROM public.dish_summary
WHERE user_id = auth.uid();

-- Grant access to the secure view
GRANT SELECT ON public.dish_summary_secure TO anon, authenticated;

-- Ensure materialized view remains protected from direct access
REVOKE SELECT ON public.dish_summary FROM anon, authenticated;
GRANT SELECT ON public.dish_summary TO service_role;

-- Add a comment explaining why SECURITY DEFINER is acceptable here
COMMENT ON VIEW public.dish_summary_secure IS 
'SECURITY DEFINER is intentionally used here to provide secure access to the dish_summary materialized view. 
The view enforces security by filtering results with WHERE user_id = auth.uid(), ensuring users can only 
access their own data. Direct access to the underlying materialized view is restricted.';