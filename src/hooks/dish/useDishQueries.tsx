
import { Dish } from "@/types";
import { supabase, mapDishFromSummary } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { fetchDishesOriginalMethod, fetchDishById, fetchMealHistoryForDish } from "./utils/dishFetchUtils";
import { classifyError, logError } from "@/utils/errorHandling";
import { ErrorType } from "@/types/errors";
import { measureAsync, trackQuery } from "@/utils/performance";
import { useDynamicCacheInvalidation } from "@/hooks/useDynamicCacheInvalidation";

/**
 * Hook that provides query functions for dishes
 */
export function useDishQueries() {
  // Remove this local state as it conflicts with React Query's built-in loading state
  // const [isLoading, setIsLoading] = useState(true);
  
  const { isUserActive } = useDynamicCacheInvalidation({
    idleThreshold: 3 * 60 * 1000, // 3 minutes for dishes
    activityWindow: 15 * 60 * 1000, // 15 minutes tracking window
  });

  // Query to fetch dishes with optimized performance monitoring
  const { data: dishes = [], isLoading, error: queryError } = useQuery({
    queryKey: ['dishes'],
    queryFn: async (): Promise<Dish[]> => {
      return await measureAsync('dishes-query', async () => {
        // Simple auth check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user?.id) {
          const appError = classifyError(authError || new Error('User not authenticated'));
          logError(appError, 'useDishQueries:auth');
          trackQuery({
            queryType: 'dishes-auth',
            duration: 0,
            recordCount: 0,
            success: false
          });
          return [];
        }
        
        // Try materialized view first with performance tracking
        try {
          const result = await measureAsync('dishes-summary-view', async () => {
            const { data, error } = await supabase
              .from('dish_summary_secure')
              .select('*')
              .order('name');
            
            if (error) throw error;
            return data || [];
          });
          
          const mappedDishes = result.map(summary => mapDishFromSummary(summary));
          
          trackQuery({
            queryType: 'dishes-summary-view',
            duration: performance.now(), // Will be updated by measureAsync
            recordCount: mappedDishes.length,
            success: true,
            fallbackUsed: false
          });
          
          return mappedDishes;
          
        } catch (viewError) {
          const appError = classifyError(viewError);
          logError(appError, 'useDishQueries:view-failed');
          
          // Simple fallback without nested retries
          try {
            const fallbackResult = await measureAsync('dishes-fallback', async () => {
              return await fetchDishesOriginalMethod(user.id);
            });
            
            trackQuery({
              queryType: 'dishes-fallback',
              duration: performance.now(),
              recordCount: fallbackResult.length,
              success: true,
              fallbackUsed: true
            });
            
            return fallbackResult;
            
          } catch (fallbackError) {
            const fallbackAppError = classifyError(fallbackError);
            logError(fallbackAppError, 'useDishQueries:fallback-failed');
            
            trackQuery({
              queryType: 'dishes-fallback',
              duration: performance.now(),
              recordCount: 0,
              success: false,
              fallbackUsed: true
            });
            
            return [];
          }
        }
      });
    },
    // Dynamic caching based on user activity
    staleTime: isUserActive() ? 1 * 60 * 1000 : 5 * 60 * 1000, // 1 min active, 5 min idle
    gcTime: 10 * 60 * 1000, // 10 minutes
    // Simplified retry logic - let our internal fallback handle failures
    retry: (failureCount, error) => {
      // Only retry transient network errors, not application errors
      const appError = classifyError(error);
      return appError.type === ErrorType.NETWORK_ERROR && failureCount < 2;
    },
    retryDelay: 1000, // Fixed 1 second delay for simplicity
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
