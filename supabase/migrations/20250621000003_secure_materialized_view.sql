-- Secure materialized view dish_summary access
-- Materialized views can't have RLS, so we'll revoke public access and create a secure view

-- Revoke public access to the materialized view
REVOKE ALL ON public.dish_summary FROM anon, authenticated;

-- Create a secure view that filters by user_id
CREATE OR REPLACE VIEW public.dish_summary_secure AS
SELECT * FROM public.dish_summary
WHERE user_id = auth.uid();

-- Enable RLS on the secure view
ALTER VIEW public.dish_summary_secure ENABLE ROW LEVEL SECURITY;

-- Grant access to the secure view
GRANT SELECT ON public.dish_summary_secure TO anon, authenticated;

-- Create RLS policy for the secure view
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dish_summary_secure' AND policyname = 'Users can view their own dish summary') THEN
        CREATE POLICY "Users can view their own dish summary" ON public.dish_summary_secure
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;