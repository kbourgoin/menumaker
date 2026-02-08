import { Dish } from "@/types";
import {
  supabase,
  mapDishFromDB,
  mapDishToDB,
} from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { classifyError, logError, retryOperation } from "@/utils/errorHandling";

/**
 * Hook that provides mutation functions for dishes
 */
export function useDishMutations() {
  const queryClient = useQueryClient();

  // Mutation to add a new dish
  const addDishMutation = useMutation({
    mutationFn: async (
      dish: Omit<Dish, "id" | "createdAt" | "timesCooked" | "user_id">
    ) => {
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
          const authError = classifyError(new Error("User not authenticated"));
          logError(authError, "useDishMutations:addDish:auth");
          throw new Error("User not authenticated");
        }

        // Validate required fields
        if (!dish.name?.trim()) {
          const validationError = classifyError(
            new Error("Dish name is required")
          );
          logError(validationError, "useDishMutations:addDish:validation");
          throw new Error("Dish name is required");
        }

        const newDish = {
          name: dish.name.trim(),
          cuisines: dish.cuisines || ["Other"],
          createdat: new Date().toISOString(),
          source_id: dish.sourceId,
          location: dish.location,
          user_id: user.id,
        };

        // Insert with retry for transient failures
        const data = await retryOperation(
          async () => {
            const { data: insertData, error } = await supabase
              .from("dishes")
              .insert(newDish)
              .select("*")
              .single();

            if (error) {
              const appError = classifyError(error);
              logError(appError, "useDishMutations:addDish:insert");
              throw error;
            }

            return insertData;
          },
          { maxRetries: 2, initialDelay: 1000 }
        );

        return mapDishFromDB(data);
      } catch (error) {
        const appError = classifyError(error);
        logError(appError, "useDishMutations:addDish:top-level");
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["suggestedDishes"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: error => {
      const appError = classifyError(error);
      logError(appError, "useDishMutations:addDish:onError");
    },
  });

  // Mutation to update a dish
  const updateDishMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Dish>;
    }) => {
      try {
        // Validate inputs
        if (!id?.trim()) {
          const validationError = classifyError(
            new Error("Dish ID is required")
          );
          logError(validationError, "useDishMutations:updateDish:validation");
          throw new Error("Dish ID is required");
        }

        if (!updates || Object.keys(updates).length === 0) {
          const validationError = classifyError(
            new Error("No updates provided")
          );
          logError(validationError, "useDishMutations:updateDish:validation");
          throw new Error("No updates provided");
        }

        // Convert client model to DB model
        const dbUpdates = mapDishToDB(updates);
        delete dbUpdates.id; // Don't try to update the ID

        // Update with retry for transient failures
        await retryOperation(
          async () => {
            const { error } = await supabase
              .from("dishes")
              .update(dbUpdates)
              .eq("id", id);

            if (error) {
              const appError = classifyError(error);
              logError(appError, "useDishMutations:updateDish:update");
              throw error;
            }
          },
          { maxRetries: 2, initialDelay: 1000 }
        );
      } catch (error) {
        const appError = classifyError(error);
        logError(appError, "useDishMutations:updateDish:top-level");
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["suggestedDishes"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: error => {
      const appError = classifyError(error);
      logError(appError, "useDishMutations:updateDish:onError");
    },
  });

  // Mutation to delete a dish
  const deleteDishMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        // Validate inputs
        if (!id?.trim()) {
          const validationError = classifyError(
            new Error("Dish ID is required")
          );
          logError(validationError, "useDishMutations:deleteDish:validation");
          throw new Error("Dish ID is required");
        }

        // Delete with retry - need to handle this as a transaction
        await retryOperation(
          async () => {
            // First delete related meal history
            const { error: historyError } = await supabase
              .from("meal_history")
              .delete()
              .eq("dishid", id);

            if (historyError) {
              const appError = classifyError(historyError);
              logError(appError, "useDishMutations:deleteDish:meal-history");
              throw historyError;
            }

            // Then delete the dish
            const { error: dishError } = await supabase
              .from("dishes")
              .delete()
              .eq("id", id);

            if (dishError) {
              const appError = classifyError(dishError);
              logError(appError, "useDishMutations:deleteDish:dish");
              throw dishError;
            }
          },
          { maxRetries: 1, initialDelay: 1000 }
        );
      } catch (error) {
        const appError = classifyError(error);
        logError(appError, "useDishMutations:deleteDish:top-level");
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      queryClient.invalidateQueries({ queryKey: ["mealHistory"] });
      queryClient.invalidateQueries({ queryKey: ["mealHistoryByDate"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["suggestedDishes"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: error => {
      const appError = classifyError(error);
      logError(appError, "useDishMutations:deleteDish:onError");
    },
  });

  return {
    // Mutation functions
    addDish: (
      dish: Omit<Dish, "id" | "createdAt" | "timesCooked" | "user_id">
    ) => addDishMutation.mutateAsync(dish),
    updateDish: (id: string, updates: Partial<Dish>) =>
      updateDishMutation.mutateAsync({ id, updates }),
    deleteDish: (id: string) => deleteDishMutation.mutateAsync(id),

    // Loading states
    isAddingDish: addDishMutation.isPending,
    isUpdatingDish: updateDishMutation.isPending,
    isDeletingDish: deleteDishMutation.isPending,

    // Error states with classification
    addDishError: addDishMutation.error
      ? classifyError(addDishMutation.error)
      : null,
    updateDishError: updateDishMutation.error
      ? classifyError(updateDishMutation.error)
      : null,
    deleteDishError: deleteDishMutation.error
      ? classifyError(deleteDishMutation.error)
      : null,

    // Reset functions for clearing errors
    resetAddDishError: addDishMutation.reset,
    resetUpdateDishError: updateDishMutation.reset,
    resetDeleteDishError: deleteDishMutation.reset,
  };
}
