-- Convert dish_summary_secure to a materialized view for better performance
-- This avoids the security definer warning while providing good performance

-- Drop the current regular view
DROP VIEW IF EXISTS public.dish_summary_secure;

-- Create a materialized view with all the calculated data
CREATE MATERIALIZED VIEW public.dish_summary_secure AS
SELECT 
    d.id,
    d.name,
    d.createdat,
    d.user_id,
    d.source_id,
    d.location,
    -- Calculate times_cooked by counting meal history entries
    (SELECT COUNT(*) FROM meal_history mh WHERE mh.dishid = d.id)::integer as times_cooked,
    -- Get the most recent meal history date
    (SELECT mh.date 
     FROM meal_history mh 
     WHERE mh.dishid = d.id 
     ORDER BY mh.date DESC 
     LIMIT 1) as last_made,
    -- Get the most recent meal history comment
    (SELECT mh.notes 
     FROM meal_history mh 
     WHERE mh.dishid = d.id AND mh.notes IS NOT NULL 
     ORDER BY mh.date DESC 
     LIMIT 1) as last_comment,
    -- Get cuisines as an array
    COALESCE(
        (SELECT array_agg(t.name ORDER BY t.name)
         FROM dish_tags dt
         JOIN tags t ON dt.tag_id = t.id
         WHERE dt.dish_id = d.id AND t.category = 'cuisine'),
        '{}'::text[]
    ) as cuisines,
    -- Get all tags as an array
    COALESCE(
        (SELECT array_agg(t.name ORDER BY t.name)
         FROM dish_tags dt
         JOIN tags t ON dt.tag_id = t.id
         WHERE dt.dish_id = d.id),
        '{}'::text[]
    ) as tags
FROM dishes d;

-- Create a unique index for concurrent refreshes
CREATE UNIQUE INDEX idx_dish_summary_secure_id ON public.dish_summary_secure (id);

-- Create a regular view on top that filters by user_id
-- This provides the security layer without the security definer warning
CREATE VIEW public.dish_summary_user AS
SELECT * FROM public.dish_summary_secure
WHERE user_id = auth.uid();

-- Grant permissions
GRANT SELECT ON public.dish_summary_user TO anon, authenticated;
-- Keep the materialized view restricted (only accessible through the user view)
REVOKE SELECT ON public.dish_summary_secure FROM anon, authenticated;
GRANT SELECT ON public.dish_summary_secure TO service_role;

-- The existing triggers should refresh this materialized view when data changes