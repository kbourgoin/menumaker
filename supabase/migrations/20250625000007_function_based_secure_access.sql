-- Replace the security definer view with a function-based approach
-- This avoids the security definer view warning while maintaining security

-- Drop the current view
DROP VIEW IF EXISTS public.dish_summary_secure;

-- Create a function that returns filtered dish summary data
CREATE OR REPLACE FUNCTION public.get_dish_summary_secure()
RETURNS SETOF public.dish_summary
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Only return dishes for the authenticated user
    RETURN QUERY
    SELECT * FROM public.dish_summary
    WHERE user_id = auth.uid()
    ORDER BY name;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.get_dish_summary_secure() TO anon, authenticated;

-- Keep the materialized view access restricted
REVOKE SELECT ON public.dish_summary FROM anon, authenticated;
GRANT SELECT ON public.dish_summary TO service_role;