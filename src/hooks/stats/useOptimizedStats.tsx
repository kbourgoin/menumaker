import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { measureAsync, trackQuery } from "@/utils/performance";

import { StatsData } from "@/types";

export function useOptimizedStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["optimized-stats"],
    queryFn: async (): Promise<StatsData> => {
      return await measureAsync("optimized-stats-query", async () => {
        try {
          // Use database aggregations instead of client-side processing
          // If RPC functions don't exist, this will fall back to the original useStats
          const queries = await Promise.all([
            // 1. Get total dishes count
            supabase.from("dishes").select("*", { count: "exact", head: true }),

            // 2. Get total meal history count
            supabase
              .from("meal_history")
              .select("*", { count: "exact", head: true }),

            // 3. Get top 5 most cooked dishes using aggregation
            supabase.rpc("get_top_dishes", { limit_count: 5 }),

            // 4. Get cuisine breakdown using aggregation
            supabase.rpc("get_cuisine_breakdown"),

            // 5. Get recent meal history with full dish data (only 5 most recent)
            supabase
              .from("meal_history")
              .select(
                `
                date, 
                notes, 
                dishes(
                  id,
                  name,
                  created_at,
                  cuisines,
                  source_id,
                  user_id,
                  location,
                  tags
                )
              `
              )
              .order("date", { ascending: false })
              .limit(5),
          ]);

          const [
            dishesCount,
            historyCount,
            topDishes,
            cuisineData,
            recentHistory,
          ] = queries;

          // Check for errors
          if (dishesCount.error) throw dishesCount.error;
          if (historyCount.error) throw historyCount.error;
          if (topDishes.error) throw topDishes.error;
          if (cuisineData.error) throw cuisineData.error;
          if (recentHistory.error) throw recentHistory.error;

          // Process results
          const totalDishes = dishesCount.count || 0;
          const totalTimesCooked = historyCount.count || 0;

          // Convert RPC results to Dish format for topDishes
          const topDishesData = (topDishes.data || []).map(
            (item: { name: string; timesCooked: number }) => ({
              id: `top-dish-${item.name}`, // Generate a temporary ID
              name: item.name,
              createdAt: new Date().toISOString(),
              cuisines: [],
              timesCooked: item.timesCooked,
              userId: "current-user",
              tags: [],
            })
          );

          const mostCooked =
            topDishesData.length > 0
              ? {
                  name: topDishesData[0].name,
                  timesCooked: topDishesData[0].timesCooked,
                }
              : null;

          const cuisineBreakdown = (cuisineData.data || []).reduce(
            (
              acc: Record<string, number>,
              item: { cuisine: string; count: number }
            ) => {
              acc[item.cuisine] = item.count;
              return acc;
            },
            {}
          );

          // Convert recent history to expected format
          const recentlyCooked = (recentHistory.data || []).map(
            (entry: {
              date: string;
              notes?: string;
              dishes?: {
                id: string;
                name: string;
                created_at: string;
                cuisines?: string[];
                source_id?: string;
                user_id: string;
                location?: string;
                tags?: string[];
              };
            }) => ({
              date: entry.date,
              dish: entry.dishes
                ? {
                    id: entry.dishes.id,
                    name: entry.dishes.name,
                    createdAt: entry.dishes.created_at,
                    cuisines: entry.dishes.cuisines || [],
                    sourceId: entry.dishes.source_id,
                    userId: entry.dishes.user_id,
                    location: entry.dishes.location,
                    tags: entry.dishes.tags || [],
                    timesCooked: 0, // Will be calculated elsewhere if needed
                  }
                : null,
              notes: entry.notes,
            })
          );

          trackQuery({
            queryType: "optimized-stats-complete",
            duration: 0, // Will be set by measureAsync
            recordCount: totalDishes,
            success: true,
          });

          return {
            totalDishes,
            totalTimesCooked,
            mostCooked,
            topDishes: topDishesData,
            cuisineBreakdown,
            recentlyCooked,
          };
        } catch (error) {
          console.error("Error fetching optimized stats:", error);
          trackQuery({
            queryType: "optimized-stats-complete",
            duration: 0,
            recordCount: 0,
            success: false,
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
    isLoading,
  };
}
