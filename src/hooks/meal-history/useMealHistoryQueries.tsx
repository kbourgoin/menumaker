// Meal history query operations with enhanced error handling
import { MealHistory } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { classifyError, logError, retryOperation } from "@/utils/errorHandling";
import { ErrorType } from "@/types/errors";
import { measureAsync, trackQuery } from "@/utils/performance";

export function useMealHistoryQueries() {
  // Get meal history for a specific dish
  const useMealHistoryForDish = (dishId: string) => {
    return useQuery({
      queryKey: ["mealHistory", dishId],
      queryFn: async (): Promise<MealHistory[]> => {
        return await measureAsync(`meal-history-${dishId}`, async () => {
          try {
            // Validate inputs
            if (!dishId?.trim()) {
              const validationError = classifyError(
                new Error("Dish ID is required")
              );
              logError(
                validationError,
                "useMealHistoryQueries:mealHistoryForDish:validation"
              );
              return [];
            }

            // Fetch with retry for transient failures
            const data = await retryOperation(
              async () => {
                const { data: queryData, error } = await supabase
                  .from("meal_history")
                  .select("*")
                  .eq("dishid", dishId)
                  .order("date", { ascending: false });

                if (error) {
                  const appError = classifyError(error);
                  logError(
                    appError,
                    "useMealHistoryQueries:mealHistoryForDish:fetch"
                  );
                  throw error;
                }

                return queryData;
              },
              { maxRetries: 2, initialDelay: 1000 }
            );

            if (!data || data.length === 0) return [];

            // Map database records to MealHistory objects with proper typing
            const mealHistory = data.map(record => ({
              id: String(record.id),
              dishId: record.dishid,
              date: record.date,
              notes: record.notes || undefined,
              user_id: record.user_id,
            }));

            trackQuery({
              queryType: "meal-history-for-dish",
              duration: 0,
              recordCount: mealHistory.length,
              success: true,
            });

            return mealHistory;
          } catch (error) {
            const appError = classifyError(error);
            logError(
              appError,
              "useMealHistoryQueries:mealHistoryForDish:top-level"
            );
            trackQuery({
              queryType: "meal-history-for-dish",
              duration: 0,
              recordCount: 0,
              success: false,
            });
            return [];
          }
        });
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        const appError = classifyError(error);
        // Don't retry auth errors or validation errors
        if (
          appError.type === ErrorType.AUTH_ERROR ||
          appError.type === ErrorType.UNAUTHORIZED ||
          appError.type === ErrorType.VALIDATION_ERROR
        ) {
          return false;
        }
        // Retry network and server errors up to 2 times
        return failureCount < 2;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
    });
  };

  // Get all meal history for current user
  const useAllMealHistory = () => {
    return useQuery({
      queryKey: ["mealHistory", "all"],
      queryFn: async (): Promise<MealHistory[]> => {
        return await measureAsync("all-meal-history", async () => {
          try {
            // Auth check with retry
            const user = await retryOperation(
              async () => {
                const userResult = await supabase.auth.getUser();
                if (userResult.error) {
                  throw userResult.error;
                }
                return userResult.data.user;
              },
              { maxRetries: 1, initialDelay: 500 }
            );

            if (!user?.id) {
              const authError = classifyError(
                new Error("User not authenticated")
              );
              logError(authError, "useMealHistoryQueries:allMealHistory:auth");
              return [];
            }

            // Fetch with retry
            const data = await retryOperation(
              async () => {
                const { data: queryData, error } = await supabase
                  .from("meal_history")
                  .select("*")
                  .eq("user_id", user.id)
                  .order("date", { ascending: false });

                if (error) {
                  const appError = classifyError(error);
                  logError(
                    appError,
                    "useMealHistoryQueries:allMealHistory:fetch"
                  );
                  throw error;
                }

                return queryData;
              },
              { maxRetries: 2, initialDelay: 1000 }
            );

            if (!data || data.length === 0) return [];

            const mealHistory = data.map(record => ({
              id: String(record.id),
              dishId: record.dishid,
              date: record.date,
              notes: record.notes || undefined,
              user_id: record.user_id,
            }));

            trackQuery({
              queryType: "all-meal-history",
              duration: 0,
              recordCount: mealHistory.length,
              success: true,
            });

            return mealHistory;
          } catch (error) {
            const appError = classifyError(error);
            logError(
              appError,
              "useMealHistoryQueries:allMealHistory:top-level"
            );
            trackQuery({
              queryType: "all-meal-history",
              duration: 0,
              recordCount: 0,
              success: false,
            });
            return [];
          }
        });
      },
      staleTime: 1 * 60 * 1000, // 1 minute
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        const appError = classifyError(error);
        if (
          appError.type === ErrorType.AUTH_ERROR ||
          appError.type === ErrorType.UNAUTHORIZED
        ) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
    });
  };

  // Legacy function for backward compatibility
  const getMealHistoryForDish = async (
    dishId: string
  ): Promise<MealHistory[]> => {
    try {
      if (!dishId?.trim()) {
        const validationError = classifyError(new Error("Dish ID is required"));
        logError(
          validationError,
          "useMealHistoryQueries:getMealHistoryForDish:validation"
        );
        return [];
      }

      const data = await retryOperation(
        async () => {
          const { data: queryData, error } = await supabase
            .from("meal_history")
            .select("*")
            .eq("dishid", dishId)
            .order("date", { ascending: false });

          if (error) {
            const appError = classifyError(error);
            logError(
              appError,
              "useMealHistoryQueries:getMealHistoryForDish:fetch"
            );
            throw error;
          }

          return queryData;
        },
        { maxRetries: 2, initialDelay: 1000 }
      );

      if (!data || data.length === 0) return [];

      return data.map(record => ({
        id: String(record.id),
        dishId: record.dishid,
        date: record.date,
        notes: record.notes || undefined,
        user_id: record.user_id,
      }));
    } catch (error) {
      const appError = classifyError(error);
      logError(
        appError,
        "useMealHistoryQueries:getMealHistoryForDish:top-level"
      );
      return [];
    }
  };

  return {
    // React Query hooks
    useMealHistoryForDish,
    useAllMealHistory,

    // Legacy function for backward compatibility
    getMealHistoryForDish,
  };
}
