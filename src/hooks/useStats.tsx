
import { useQuery } from "@tanstack/react-query";
import { Tables } from "@/integrations/supabase/types";
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
        
        // Fetch ALL meal history data with pagination to handle the 1000 row limit
        let allHistoryData: Tables<'meal_history'>[] = [];
        let hasMoreEntries = true;
        let lastDate: string | null = null;
        
        while (hasMoreEntries) {
          let query = supabase
            .from('meal_history')
            .select('*');
          
          // Apply pagination if we have a lastDate
          if (lastDate) {
            query = query.lt('date', lastDate);
          }
          
          // Limit to max rows per query
          query = query.order('date', { ascending: false })
            .limit(1000);
          
          const { data: historyPage, error: historyError } = await query;
          
          if (historyError) throw historyError;
          
          // If we got data, add it to our results
          if (historyPage && historyPage.length > 0) {
            allHistoryData = [...allHistoryData, ...historyPage];
            
            // Update lastDate for next page
            lastDate = historyPage[historyPage.length - 1].date;
            
            // If we got fewer rows than the limit, we've reached the end
            if (historyPage.length < 1000) {
              hasMoreEntries = false;
            }
          } else {
            hasMoreEntries = false;
          }
        }
        
        // Group meal history by dish ID
        const historyByDishId: Record<string, Tables<'meal_history'>[]> = {};
        allHistoryData.forEach(entry => {
          if (!historyByDishId[entry.dishid]) {
            historyByDishId[entry.dishid] = [];
          }
          historyByDishId[entry.dishid].push(entry);
        });
        
        // Map dishes with their meal history data
        const dishes = dishesData.map(dish => 
          mapDishFromDB(dish, historyByDishId[dish.id] || [])
        );
        
        // Fetch recent meal history - only need the most recent 5 entries
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
          totalTimesCooked: allHistoryData.length, // Total count of ALL meal history entries
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
