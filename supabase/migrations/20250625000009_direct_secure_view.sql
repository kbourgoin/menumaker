-- Replace the nested view approach with a direct secure view
-- This eliminates the security definer warning by not nesting views

-- Drop the current nested view
DROP VIEW IF EXISTS public.dish_summary_secure;

-- Create a secure view that directly queries the base tables
-- This replicates the logic from the materialized view but with built-in security
CREATE VIEW public.dish_summary_secure AS
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
FROM dishes d
WHERE d.user_id = auth.uid();

-- Grant access to the secure view
GRANT SELECT ON public.dish_summary_secure TO anon, authenticated;

-- The materialized view can now be left as-is for other potential uses
-- but we're not using it in our secure access pattern anymore