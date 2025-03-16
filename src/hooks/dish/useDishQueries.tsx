
import { useState } from "react";
import { Dish } from "@/types";
import { supabase, mapDishFromSummary } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { fetchDishesOriginalMethod, fetchDishById, fetchMealHistoryForDish } from "./utils/dishFetchUtils";

/**
 * Hook that provides query functions for dishes
 */
export function useDishQueries() {
  // Remove this local state as it conflicts with React Query's built-in loading state
  // const [isLoading, setIsLoading] = useState(true);

  // Query to fetch dishes from the materialized view for better performance (READ ONLY)
  const { data: dishes = [], isLoading } = useQuery({
    queryKey: ['dishes'],
    queryFn: async (): Promise<Dish[]> => {
      try {
        const user = await supabase.auth.getUser();
        const user_id = user.data.user?.id;
        
        if (!user_id) {
          return [];
        }
        
        try {
          // Get dishes from the materialized view (READ ONLY)
          const { data: summaryData, error: summaryError } = await supabase
            .from('dish_summary')
            .select('*')
            .eq('user_id', user_id)
            .order('name');
          
          if (summaryError) {
            console.error("Error fetching from dish_summary:", summaryError);
            // Fallback to the original method if materialized view fails
            return await fetchDishesOriginalMethod(user_id);
          }
          
          if (!summaryData) {
            return [];
          }
          
          // Map the summary data to our Dish type
          const mappedDishes = summaryData.map(summary => mapDishFromSummary(summary));
          
          return mappedDishes;
        } catch (viewError) {
          console.error("Error with dish_summary view:", viewError);
          // Fallback if there's any issue with the view
          return await fetchDishesOriginalMethod(user_id);
        }
      } catch (error) {
        console.error("Error fetching dishes:", error);
        return [];
      }
    },
    // Enable caching to improve performance
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Improved error handling
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    dishes,
    isLoading, // Now we're using React Query's built-in isLoading state
    getDish: fetchDishById,
    getMealHistoryForDish: fetchMealHistoryForDish
  };
}

// Re-export the fetchDishesOriginalMethod for use in other files (like useWeeklyMenu)
export { fetchDishesOriginalMethod };
