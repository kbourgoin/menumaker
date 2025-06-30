
import { useState } from "react";
import { Dish } from "@/types";
import { supabase, mapDishFromSummary } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { fetchDishesOriginalMethod, fetchDishById, fetchMealHistoryForDish } from "./utils/dishFetchUtils";
import { classifyError, logError, retryOperation } from "@/utils/errorHandling";
import { ErrorType } from "@/types/errors";

/**
 * Hook that provides query functions for dishes
 */
export function useDishQueries() {
  // Remove this local state as it conflicts with React Query's built-in loading state
  // const [isLoading, setIsLoading] = useState(true);

  // Query to fetch dishes from the materialized view for better performance (READ ONLY)
  const { data: dishes = [], isLoading, error: queryError } = useQuery({
    queryKey: ['dishes'],
    queryFn: async (): Promise<Dish[]> => {
      try {
        // Auth check with retry for transient failures
        const user = await retryOperation(
          async () => {
            const userResult = await supabase.auth.getUser();
            if (userResult.error) {
              throw userResult.error;
            }
            return userResult.data.user;
          },
          { maxRetries: 2, initialDelay: 500 }
        );
        
        if (!user?.id) {
          const authError = classifyError(new Error('User not authenticated'));
          logError(authError, 'useDishQueries:auth');
          return [];
        }
        
        try {
          // Primary fetch with retry for network failures
          const summaryData = await retryOperation(
            async () => {
              const { data, error } = await supabase
                .from('dish_summary_secure')
                .select('*')
                .order('name');
              
              if (error) {
                const appError = classifyError(error);
                logError(appError, 'useDishQueries:summary-view');
                throw error;
              }
              
              return data;
            },
            { maxRetries: 2, initialDelay: 1000 }
          );
          
          if (!summaryData) {
            return [];
          }
          
          // Map the summary data to our Dish type
          const mappedDishes = summaryData.map(summary => mapDishFromSummary(summary));
          return mappedDishes;
          
        } catch (viewError) {
          const appError = classifyError(viewError);
          logError(appError, 'useDishQueries:summary-view-fallback');
          
          // Fallback to original method with retry
          try {
            return await retryOperation(
              () => fetchDishesOriginalMethod(user.id),
              { maxRetries: 1, initialDelay: 500 }
            );
          } catch (fallbackError) {
            const fallbackAppError = classifyError(fallbackError);
            logError(fallbackAppError, 'useDishQueries:fallback-method');
            return [];
          }
        }
      } catch (error) {
        const appError = classifyError(error);
        logError(appError, 'useDishQueries:top-level');
        return [];
      }
    },
    // Enable caching to improve performance
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    // Enhanced retry configuration
    retry: (failureCount, error) => {
      const appError = classifyError(error);
      // Don't retry auth errors or validation errors
      if (appError.type === ErrorType.AUTH_ERROR || 
          appError.type === ErrorType.UNAUTHORIZED ||
          appError.type === ErrorType.VALIDATION_ERROR) {
        return false;
      }
      // Retry network and server errors up to 3 times
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    dishes,
    isLoading,
    error: queryError ? classifyError(queryError) : null,
    getDish: fetchDishById,
    getMealHistoryForDish: fetchMealHistoryForDish
  };
}

// Re-export the fetchDishesOriginalMethod for use in other files (like useWeeklyMenu)
export { fetchDishesOriginalMethod };
