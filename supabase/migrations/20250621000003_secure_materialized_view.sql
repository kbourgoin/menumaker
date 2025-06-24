-- Secure materialized view dish_summary access
-- Materialized views can't have RLS, so we'll revoke public access and create a secure view

-- Revoke public access to the materialized view
REVOKE ALL ON public.dish_summary FROM anon, authenticated;

-- Create a secure view that filters by user_id
CREATE OR REPLACE VIEW public.dish_summary_secure AS
SELECT * FROM public.dish_summary
WHERE user_id = auth.uid();

-- Grant access to the secure view (views cannot have RLS, filtering is done in the view definition)
GRANT SELECT ON public.dish_summary_secure TO anon, authenticated;