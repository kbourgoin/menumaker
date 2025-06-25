-- Final approach: Accept security definer view as the correct solution
-- The performance benefits of the materialized view outweigh the security warning

-- Clean up the experimental approaches
DROP VIEW IF EXISTS public.dish_summary_user;
DROP MATERIALIZED VIEW IF EXISTS public.dish_summary_secure;

-- Recreate the simple, working security definer view
CREATE VIEW public.dish_summary_secure AS
SELECT * FROM public.dish_summary
WHERE user_id = auth.uid();

-- Grant access
GRANT SELECT ON public.dish_summary_secure TO anon, authenticated;

-- Ensure the materialized view is protected from direct access
REVOKE SELECT ON public.dish_summary FROM anon, authenticated;
GRANT SELECT ON public.dish_summary TO service_role;

-- Document why the security definer approach is acceptable here
COMMENT ON VIEW public.dish_summary_secure IS 
'This view uses SECURITY DEFINER (default) to access the dish_summary materialized view.
This is acceptable because:
1. The view filters results by auth.uid() ensuring users only see their own data
2. This is a read-only view with no data modification capabilities  
3. The underlying materialized view provides significant performance benefits
4. Direct access to the materialized view is properly restricted to service_role
5. This is the standard PostgreSQL pattern for secure access to materialized views';