import { useDishQueries } from "./dish/useDishQueries";
import { useDishMutations } from "./dish/useDishMutations";
import { useMealHistory } from "./meal-history";

/**
 * Main hook that combines dish queries and mutations
 */
export function useDishes() {
  const { dishes, isLoading, error, getDish, getMealHistoryForDish } =
    useDishQueries();
  const {
    addDish,
    updateDish,
    deleteDish,
    isAddingDish,
    isUpdatingDish,
    isDeletingDish,
    addDishError,
    updateDishError,
    deleteDishError,
    resetAddDishError,
    resetUpdateDishError,
    resetDeleteDishError,
  } = useDishMutations();
  const { recordDishCooked, updateMealHistory, deleteMealHistory } =
    useMealHistory();

  return {
    // Data and loading states
    dishes,
    isLoading,
    error,

    // Mutation functions
    addDish,
    updateDish,
    deleteDish,
    recordDishCooked,
    updateMealHistory,
    deleteMealHistory,

    // Mutation states
    isAddingDish,
    isUpdatingDish,
    isDeletingDish,
    addDishError,
    updateDishError,
    deleteDishError,
    resetAddDishError,
    resetUpdateDishError,
    resetDeleteDishError,

    // Utility functions
    getDish,
    getMealHistoryForDish,
  };
}
