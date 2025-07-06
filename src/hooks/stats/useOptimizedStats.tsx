import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { measureAsync, trackQuery } from "@/utils/performance";

interface OptimizedStatsResult {
  totalDishes: number;
  totalTimesCooked: number;
  mostCooked: { name: string; timesCooked: number } | null;
  topDishes: Array<{ name: string; timesCooked: number }>;
  cuisineBreakdown: Record<string, number>;
  recentlyCooked: Array<{ date: string; dishName: string; notes?: string }>;
}

export function useOptimizedStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['optimized-stats'],
    queryFn: async (): Promise<OptimizedStatsResult> => {
      return await measureAsync('optimized-stats-query', async () => {
        try {
          // Use database aggregations instead of client-side processing
          const queries = await Promise.all([
            // 1. Get total dishes count
            supabase
              .from('dishes')
              .select('*', { count: 'exact', head: true }),
            
            // 2. Get total meal history count  
            supabase
              .from('meal_history')
              .select('*', { count: 'exact', head: true }),
            
            // 3. Get top 5 most cooked dishes using aggregation
            supabase
              .rpc('get_top_dishes', { limit_count: 5 }),
            
            // 4. Get cuisine breakdown using aggregation
            supabase
              .rpc('get_cuisine_breakdown'),
            
            // 5. Get recent meal history (only 5 most recent)
            supabase
              .from('meal_history')
              .select('date, notes, dishes(name)')
              .order('date', { ascending: false })
              .limit(5)
          ]);

          const [dishesCount, historyCount, topDishes, cuisineData, recentHistory] = queries;

          // Check for errors
          if (dishesCount.error) throw dishesCount.error;
          if (historyCount.error) throw historyCount.error;
          if (topDishes.error) throw topDishes.error;
          if (cuisineData.error) throw cuisineData.error;
          if (recentHistory.error) throw recentHistory.error;

          // Process results
          const totalDishes = dishesCount.count || 0;
          const totalTimesCooked = historyCount.count || 0;
          
          const topDishesData = topDishes.data || [];
          const mostCooked = topDishesData.length > 0 ? topDishesData[0] : null;
          
          const cuisineBreakdown = (cuisineData.data || []).reduce((acc: Record<string, number>, item: { cuisine: string; count: number }) => {
            acc[item.cuisine] = item.count;
            return acc;
          }, {});

          const recentlyCooked = (recentHistory.data || []).map((entry: { date: string; notes?: string; dishes?: { name: string } }) => ({
            date: entry.date,
            dishName: entry.dishes?.name || 'Unknown',
            notes: entry.notes
          }));

          trackQuery({
            queryType: 'optimized-stats-complete',
            duration: 0, // Will be set by measureAsync
            recordCount: totalDishes,
            success: true
          });

          return {
            totalDishes,
            totalTimesCooked,
            mostCooked,
            topDishes: topDishesData,
            cuisineBreakdown,
            recentlyCooked
          };
        } catch (error) {
          console.error("Error fetching optimized stats:", error);
          trackQuery({
            queryType: 'optimized-stats-complete',
            duration: 0,
            recordCount: 0,
            success: false
          });
          throw error;
        }
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - stats don't change frequently
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    retryDelay: 1000,
  });

  return {
    stats,
    isLoading
  };
}