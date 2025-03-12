
import { supabase, mapDishFromDB, mapMealHistoryFromDB } from "@/integrations/supabase/client";

export function useStats() {
  // Get dish stats
  const getStats = async () => {
    const { data: dishesData, error: dishesError } = await supabase
      .from('dishes')
      .select('*');
      
    if (dishesError) throw dishesError;
    const dishes = dishesData.map(mapDishFromDB);
    
    const { data: historyData, error: historyError } = await supabase
      .from('meal_history')
      .select('*')
      .order('date', { ascending: false })
      .limit(5);
      
    if (historyError) throw historyError;
    const history = historyData.map(mapMealHistoryFromDB);
    
    // Get most cooked dish
    const mostCooked = [...dishes].sort((a, b) => b.timesCooked - a.timesCooked)[0];
    
    // Get cuisine breakdown
    const cuisineBreakdown = dishes.reduce((acc: Record<string, number>, dish) => {
      dish.cuisines.forEach(cuisine => {
        acc[cuisine] = (acc[cuisine] || 0) + 1;
      });
      return acc;
    }, {});
    
    // Transform recent history to include dish data
    const recentlyCooked = await Promise.all(
      history.map(async h => {
        const dish = dishes.find(d => d.id === h.dishId);
        return {
          date: h.date,
          dish
        };
      })
    );
    
    return {
      totalDishes: dishes.length,
      totalTimesCooked: dishes.reduce((sum, dish) => sum + dish.timesCooked, 0),
      mostCooked,
      cuisineBreakdown,
      recentlyCooked
    };
  };

  return {
    getStats
  };
}
