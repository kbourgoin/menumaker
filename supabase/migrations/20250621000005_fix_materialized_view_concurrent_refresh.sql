-- Fix materialized view concurrent refresh by adding required unique index
-- and perform initial refresh to pick up missed data

-- Create unique index required for concurrent refreshes
CREATE UNIQUE INDEX CONCURRENTLY dish_summary_id_idx ON public.dish_summary (id);

-- Update the refresh function to use concurrent refresh now that we have the index
CREATE OR REPLACE FUNCTION public.refresh_dish_summary_secure()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Refresh the materialized view concurrently (now that we have unique index)
    REFRESH MATERIALIZED VIEW CONCURRENTLY dish_summary;
END;
$$;

-- Perform initial refresh to pick up all the data missed while triggers were broken
REFRESH MATERIALIZED VIEW public.dish_summary;