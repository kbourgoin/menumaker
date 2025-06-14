-- Drop the existing dish_summary view
DROP VIEW IF EXISTS public.dish_summary;

-- Recreate dish_summary view with tags
CREATE VIEW public.dish_summary AS
SELECT 
    d.id,
    d.name,
    d.location,
    d.cuisines,
    d.source_id,
    d.user_id,
    d.createdat,
    COALESCE(mh.times_cooked, 0) AS times_cooked,
    mh.last_made,
    mh.last_comment,
    COALESCE(
        ARRAY_AGG(t.name ORDER BY t.name) FILTER (WHERE t.name IS NOT NULL),
        '{}'::text[]
    ) AS tags
FROM 
    public.dishes d
LEFT JOIN (
    SELECT 
        dishid,
        COUNT(*) AS times_cooked,
        MAX(date) AS last_made,
        FIRST_VALUE(notes) OVER (
            PARTITION BY dishid 
            ORDER BY date DESC
        ) AS last_comment
    FROM public.meal_history
    GROUP BY dishid, notes, date
) mh ON d.id = mh.dishid
LEFT JOIN public.dish_tags dt ON d.id = dt.dish_id
LEFT JOIN public.tags t ON dt.tag_id = t.id
GROUP BY 
    d.id, 
    d.name, 
    d.location, 
    d.cuisines, 
    d.source_id, 
    d.user_id, 
    d.createdat,
    mh.times_cooked,
    mh.last_made,
    mh.last_comment;