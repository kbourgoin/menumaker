import { useQuery } from "@tanstack/react-query";
import { Tables } from "@/integrations/supabase/types";
import { supabase, mapDishFromDB } from "@/integrations/supabase/client";
import { measureAsync, trackQuery } from "@/utils/performance";

export function useStats() {
  // Check if we should use optimized stats for large datasets
  const { data: _dishCount } = useQuery({
    queryKey: ["dish-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("dishes")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: _historyCount } = useQuery({
    queryKey: ["history-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("meal_history")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Temporarily disable optimized stats until database functions are created

  // Temporarily disable optimized stats hook to prevent console errors
  // const optimizedStats = useOptimizedStats();

  // Get dish stats with React Query (legacy method)
  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      return await measureAsync("stats-query", async () => {
        try {
          // Fetch dishes data
          const dishesData = await measureAsync(
            "stats-dishes-query",
            async () => {
              const { data, error } = await supabase.from("dishes").select("*");
              if (error) throw error;
              return data;
            }
          );

          // Fetch ALL meal history data with pagination to handle the 1000 row limit
          let allHistoryData: Tables<"meal_history">[] = [];
          let hasMoreEntries = true;
          let lastDate: string | null = null;

          while (hasMoreEntries) {
            let query = supabase.from("meal_history").select("*");

            // Apply pagination if we have a lastDate
            if (lastDate) {
              query = query.lt("date", lastDate);
            }

            // Limit to max rows per query
            query = query.order("date", { ascending: false }).limit(1000);

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
          const historyByDishId: Record<string, Tables<"meal_history">[]> = {};
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
          const { data: recentHistoryData, error: recentHistoryError } =
            await supabase
              .from("meal_history")
              .select("*, dishes(*)") // Join with dishes to get dish details
              .order("date", { ascending: false })
              .limit(5);

          if (recentHistoryError) throw recentHistoryError;

          // Find dish with highest timesCooked
          const mostCooked = [...dishes].sort(
            (a, b) => b.timesCooked - a.timesCooked
          )[0];

          // Get top 5 most cooked dishes
          const topDishes = [...dishes]
            .filter(dish => dish.timesCooked > 0)
            .sort((a, b) => b.timesCooked - a.timesCooked)
            .slice(0, 5);

          // Get cuisine breakdown - works with both old cuisines array and new cuisine tags
          const cuisineBreakdown = dishes.reduce(
            (acc: Record<string, number>, dish) => {
              // Check both old cuisine array and new cuisine tags
              const cuisines = new Set<string>();

              // Add cuisines from old system (for backward compatibility)
              dish.cuisines?.forEach(cuisine => cuisines.add(cuisine));

              // Add cuisines from new tag system (cuisine tags)
              dish.tags?.forEach(tag => {
                // For now, we'll check if any tags match known cuisine names
                // This will be updated once the migration sets cuisine tags with category
                const knownCuisines = [
                  "Italian",
                  "Mexican",
                  "American",
                  "Asian",
                  "Mediterranean",
                  "Indian",
                  "French",
                  "Greek",
                  "Thai",
                  "Japanese",
                  "Chinese",
                  "Korean",
                  "Middle Eastern",
                  "Vietnamese",
                  "Spanish",
                  "Caribbean",
                  "German",
                  "British",
                  "Fusion",
                  "Other",
                ];
                if (knownCuisines.includes(tag)) {
                  cuisines.add(tag);
                }
              });

              // If no cuisines found, default to "Other"
              if (cuisines.size === 0) {
                cuisines.add("Other");
              }

              cuisines.forEach(cuisine => {
                acc[cuisine] = (acc[cuisine] || 0) + 1;
              });
              return acc;
            },
            {}
          );

          // Transform recent history to include dish data
          const recentlyCooked = recentHistoryData.map(entry => ({
            date: entry.date,
            dish: entry.dishes
              ? mapDishFromDB(
                  entry.dishes as Tables<"dishes">["Row"],
                  historyByDishId[entry.dishes.id] || []
                )
              : null,
            notes: entry.notes,
          }));

          trackQuery({
            queryType: "stats-complete",
            duration: 0, // Will be set by measureAsync
            recordCount: dishes.length,
            success: true,
          });

          return {
            totalDishes: dishes.length,
            totalTimesCooked: allHistoryData.length, // Total count of ALL meal history entries
            mostCooked,
            topDishes,
            cuisineBreakdown,
            recentlyCooked,
          };
        } catch (error) {
          console.error("Error fetching stats:", error);
          trackQuery({
            queryType: "stats-complete",
            duration: 0,
            recordCount: 0,
            success: false,
          });
          throw error;
        }
      });
    },
    enabled: true, // Always run legacy query until optimizations are ready
  });

  // Return optimized stats if applicable, otherwise legacy stats
  // Commented out until database functions are created
  /*
  if (shouldUseOptimized) {
    return {
      getStats: async () => optimizedStats.stats || {
        totalDishes: 0,
        totalTimesCooked: 0,
        mostCooked: null,
        topDishes: [],
        cuisineBreakdown: {},
        recentlyCooked: []
      },
      stats: optimizedStats.stats,
      isLoading: optimizedStats.isLoading
    };
  }
  */

  return {
    getStats: async () =>
      stats || {
        totalDishes: 0,
        totalTimesCooked: 0,
        mostCooked: null,
        topDishes: [],
        cuisineBreakdown: {},
        recentlyCooked: [],
      },
    stats, // Expose stats directly for synchronous access
    isLoading,
  };
}
