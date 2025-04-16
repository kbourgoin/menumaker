
import { useDishQueries } from "./dish/useDishQueries";
import { useDishMutations } from "./dish/useDishMutations";
import { useMealHistory } from "./useMealHistory";

/**
 * Main hook that combines dish queries and mutations
 */
export function useDishes() {
  const { dishes, isLoading, getDish, getMealHistoryForDish } = useDishQueries();
  const { addDish, updateDish, deleteDish } = useDishMutations();
  const { recordDishCooked, updateMealHistory, deleteMealHistory } = useMealHistory();

  return {
    dishes,
    isLoading,
    addDish,
    updateDish,
    deleteDish,
    recordDishCooked,
    updateMealHistory,
    deleteMealHistory,
    getDish,
    getMealHistoryForDish
  };
}
