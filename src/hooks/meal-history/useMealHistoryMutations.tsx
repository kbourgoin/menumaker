// Meal history mutation operations with enhanced error handling
import { supabase, mapMealHistoryFromDB } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { classifyError, logError, retryOperation } from "@/utils/errorHandling";

export function useMealHistoryMutations() {
  const queryClient = useQueryClient();

  // Record a dish as cooked
  const recordDishCookedMutation = useMutation({
    mutationFn: async ({
      dishId,
      date,
      notes,
    }: {
      dishId: string;
      date: string;
      notes?: string | null;
    }) => {
      try {
        // Validate inputs
        if (!dishId?.trim()) {
          const validationError = classifyError(
            new Error("Dish ID is required")
          );
          logError(
            validationError,
            "useMealHistoryMutations:recordDishCooked:validation"
          );
          throw new Error("Dish ID is required");
        }

        if (!date?.trim()) {
          const validationError = classifyError(new Error("Date is required"));
          logError(
            validationError,
            "useMealHistoryMutations:recordDishCooked:validation"
          );
          throw new Error("Date is required");
        }

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
          const authError = classifyError(new Error("User not authenticated"));
          logError(authError, "useMealHistoryMutations:recordDishCooked:auth");
          throw new Error("User not authenticated");
        }

        // Get user's household_id
        // @ts-expect-error - household_id not in auto-generated profile types yet
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("household_id")
          .eq("id", user.id)
          .single();

        if (profileError || !profile?.household_id) {
          throw new Error("Could not determine household");
        }

        const mealHistoryEntry = {
          dishid: dishId,
          date,
          notes,
          user_id: user.id,
          household_id: profile.household_id,
        };

        // Insert with retry for transient failures
        const data = await retryOperation(
          async () => {
            const { data: insertData, error } = await supabase
              .from("meal_history")
              .insert(mealHistoryEntry)
              .select()
              .single();

            if (error) {
              const appError = classifyError(error);
              logError(
                appError,
                "useMealHistoryMutations:recordDishCooked:insert"
              );
              throw error;
            }

            return insertData;
          },
          { maxRetries: 2, initialDelay: 1000 }
        );

        return mapMealHistoryFromDB(data);
      } catch (error) {
        const appError = classifyError(error);
        logError(
          appError,
          "useMealHistoryMutations:recordDishCooked:top-level"
        );
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate multiple queries to ensure all related data is refreshed
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      queryClient.invalidateQueries({ queryKey: ["mealHistory"] });
      queryClient.invalidateQueries({ queryKey: ["mealHistoryByDate"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["suggestedDishes"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: error => {
      const appError = classifyError(error);
      logError(appError, "useMealHistoryMutations:recordDishCooked:onError");
    },
  });

  // Delete a meal history entry
  const deleteMealHistoryMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        // Validate inputs
        if (!id?.trim()) {
          const validationError = classifyError(
            new Error("Meal history ID is required")
          );
          logError(
            validationError,
            "useMealHistoryMutations:deleteMealHistory:validation"
          );
          throw new Error("Meal history ID is required");
        }

        // Delete with retry for transient failures
        await retryOperation(
          async () => {
            const { error } = await supabase
              .from("meal_history")
              .delete()
              .eq("id", id);

            if (error) {
              const appError = classifyError(error);
              logError(
                appError,
                "useMealHistoryMutations:deleteMealHistory:delete"
              );
              throw error;
            }
          },
          { maxRetries: 1, initialDelay: 1000 }
        );

        return id;
      } catch (error) {
        const appError = classifyError(error);
        logError(
          appError,
          "useMealHistoryMutations:deleteMealHistory:top-level"
        );
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      queryClient.invalidateQueries({ queryKey: ["mealHistory"] });
      queryClient.invalidateQueries({ queryKey: ["mealHistoryByDate"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["suggestedDishes"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: error => {
      const appError = classifyError(error);
      logError(appError, "useMealHistoryMutations:deleteMealHistory:onError");
    },
  });

  // Update a meal history entry
  const updateMealHistoryMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: { date: string; notes?: string | null };
    }) => {
      try {
        // Validate inputs
        if (!id?.trim()) {
          const validationError = classifyError(
            new Error("Meal history ID is required")
          );
          logError(
            validationError,
            "useMealHistoryMutations:updateMealHistory:validation"
          );
          throw new Error("Meal history ID is required");
        }

        if (!updates || Object.keys(updates).length === 0) {
          const validationError = classifyError(
            new Error("No updates provided")
          );
          logError(
            validationError,
            "useMealHistoryMutations:updateMealHistory:validation"
          );
          throw new Error("No updates provided");
        }

        if (updates.date && !updates.date.trim()) {
          const validationError = classifyError(
            new Error("Date cannot be empty")
          );
          logError(
            validationError,
            "useMealHistoryMutations:updateMealHistory:validation"
          );
          throw new Error("Date cannot be empty");
        }

        // Update with retry for transient failures
        await retryOperation(
          async () => {
            const { error } = await supabase
              .from("meal_history")
              .update(updates)
              .eq("id", id);

            if (error) {
              const appError = classifyError(error);
              logError(
                appError,
                "useMealHistoryMutations:updateMealHistory:update"
              );
              throw error;
            }
          },
          { maxRetries: 2, initialDelay: 1000 }
        );

        return { id, ...updates };
      } catch (error) {
        const appError = classifyError(error);
        logError(
          appError,
          "useMealHistoryMutations:updateMealHistory:top-level"
        );
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      queryClient.invalidateQueries({ queryKey: ["mealHistory"] });
      queryClient.invalidateQueries({ queryKey: ["mealHistoryByDate"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["suggestedDishes"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: error => {
      const appError = classifyError(error);
      logError(appError, "useMealHistoryMutations:updateMealHistory:onError");
    },
  });

  return {
    // Mutation functions
    recordDishCooked: (dishId: string, date: string, notes?: string | null) =>
      recordDishCookedMutation.mutateAsync({ dishId, date, notes }),
    updateMealHistory: (
      id: string,
      updates: { date: string; notes?: string | null }
    ) => updateMealHistoryMutation.mutateAsync({ id, updates }),
    deleteMealHistory: (id: string) =>
      deleteMealHistoryMutation.mutateAsync(id),

    // Loading states
    isRecordingDish: recordDishCookedMutation.isPending,
    isUpdatingMealHistory: updateMealHistoryMutation.isPending,
    isDeletingMealHistory: deleteMealHistoryMutation.isPending,

    // Error states with classification
    recordDishError: recordDishCookedMutation.error
      ? classifyError(recordDishCookedMutation.error)
      : null,
    updateMealHistoryError: updateMealHistoryMutation.error
      ? classifyError(updateMealHistoryMutation.error)
      : null,
    deleteMealHistoryError: deleteMealHistoryMutation.error
      ? classifyError(deleteMealHistoryMutation.error)
      : null,

    // Reset functions for clearing errors
    resetRecordDishError: recordDishCookedMutation.reset,
    resetUpdateMealHistoryError: updateMealHistoryMutation.reset,
    resetDeleteMealHistoryError: deleteMealHistoryMutation.reset,
  };
}
