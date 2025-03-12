
import { useQuery } from "@tanstack/react-query";
import { supabase, mapDishFromDB } from "@/integrations/supabase/client";

export function useStats() {
  // Get dish stats with React Query
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      try {
        // Fetch dishes data
        const { data: dishesData, error: dishesError } = await supabase
          .from('dishes')
          .select('*');
          
        if (dishesError) throw dishesError;
        
        // Fetch meal history data
        const { data: historyData, error: historyError } = await supabase
          .from('meal_history')
          .select('*');
          
        if (historyError) throw historyError;
        
        // Group meal history by dish ID
        const historyByDishId: Record<string, any[]> = {};
        historyData.forEach(entry => {
          if (!historyByDishId[entry.dishid]) {
            historyByDishId[entry.dishid] = [];
          }
          historyByDishId[entry.dishid].push(entry);
        });
        
        // Map dishes with their meal history data
        const dishes = dishesData.map(dish => 
          mapDishFromDB(dish, historyByDishId[dish.id] || [])
        );
        
        // Fetch recent meal history
        const { data: recentHistoryData, error: recentHistoryError } = await supabase
          .from('meal_history')
          .select('*, dishes(*)') // Join with dishes to get dish details
          .order('date', { ascending: false })
          .limit(5);
          
        if (recentHistoryError) throw recentHistoryError;
        
        // Find dish with highest timesCooked
        const mostCooked = [...dishes].sort((a, b) => b.timesCooked - a.timesCooked)[0];
        
        // Get cuisine breakdown
        const cuisineBreakdown = dishes.reduce((acc: Record<string, number>, dish) => {
          dish.cuisines.forEach(cuisine => {
            acc[cuisine] = (acc[cuisine] || 0) + 1;
          });
          return acc;
        }, {});
        
        // Transform recent history to include dish data
        const recentlyCooked = recentHistoryData.map(entry => ({
          date: entry.date,
          dish: entry.dishes ? mapDishFromDB(entry.dishes, historyByDishId[entry.dishes.id] || []) : null,
          notes: entry.notes
        }));
        
        return {
          totalDishes: dishes.length,
          totalTimesCooked: historyData.length, // Total count of meal history entries
          mostCooked,
          cuisineBreakdown,
          recentlyCooked
        };
      } catch (error) {
        console.error("Error fetching stats:", error);
        throw error;
      }
    }
  });

  return {
    getStats: async () => stats || {
      totalDishes: 0,
      totalTimesCooked: 0,
      mostCooked: null,
      cuisineBreakdown: {},
      recentlyCooked: []
    },
    isLoading
  };
}
