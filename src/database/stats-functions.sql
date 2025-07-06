-- Database functions for optimized stats queries
-- These functions should be run in Supabase SQL editor

-- Function to get top dishes by cook count
CREATE OR REPLACE FUNCTION get_top_dishes(limit_count INTEGER DEFAULT 5)
RETURNS TABLE(
  name TEXT,
  timesCooked BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.name,
    COUNT(mh.id) as timesCooked
  FROM dishes d
  LEFT JOIN meal_history mh ON d.id = mh.dishid
  WHERE d.user_id = auth.uid()
  GROUP BY d.id, d.name
  HAVING COUNT(mh.id) > 0
  ORDER BY timesCooked DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get cuisine breakdown
CREATE OR REPLACE FUNCTION get_cuisine_breakdown()
RETURNS TABLE(
  cuisine TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH dish_cuisines AS (
    SELECT d.id, 
           CASE 
             WHEN d.cuisines IS NOT NULL AND array_length(d.cuisines, 1) > 0 
             THEN unnest(d.cuisines)
             ELSE 'Other'
           END as cuisine
    FROM dishes d
    WHERE d.user_id = auth.uid()
  )
  SELECT 
    dc.cuisine,
    COUNT(*) as count
  FROM dish_cuisines dc
  GROUP BY dc.cuisine
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_meal_history_dishid_date ON meal_history(dishid, date DESC);
CREATE INDEX IF NOT EXISTS idx_dishes_user_id ON dishes(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_history_user_id_date ON meal_history(user_id, date DESC);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_top_dishes(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_cuisine_breakdown() TO authenticated;