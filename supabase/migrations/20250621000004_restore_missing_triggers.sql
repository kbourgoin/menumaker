-- Restore the materialized view triggers that were accidentally deleted during security migration
-- These triggers were working before but got dropped when functions were reorganized

-- First, create a proper trigger function that returns TRIGGER
CREATE OR REPLACE FUNCTION public.trigger_refresh_dish_summary()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Call the existing refresh function
    PERFORM public.refresh_dish_summary_secure();
    
    -- Return appropriate value based on trigger type
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- Recreate the triggers using the proper trigger function
CREATE TRIGGER refresh_dish_summary_on_dish_change
    AFTER INSERT OR UPDATE OR DELETE ON public.dishes
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.trigger_refresh_dish_summary();

CREATE TRIGGER refresh_dish_summary_on_history_change
    AFTER INSERT OR UPDATE OR DELETE ON public.meal_history
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.trigger_refresh_dish_summary();

-- Also add trigger for dish_tags table (for completeness)
CREATE TRIGGER refresh_dish_summary_on_tags_change
    AFTER INSERT OR UPDATE OR DELETE ON public.dish_tags
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.trigger_refresh_dish_summary();

-- Grant execute permission on the trigger function
GRANT EXECUTE ON FUNCTION public.trigger_refresh_dish_summary() TO anon, authenticated;