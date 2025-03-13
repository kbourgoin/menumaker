
import { useDishQueries } from "./dish/useDishQueries";
import { useDishMutations } from "./dish/useDishMutations";

/**
 * Main hook that combines dish queries and mutations
 */
export function useDishes() {
  const { dishes, isLoading, getDish, getMealHistoryForDish } = useDishQueries();
  const { addDish, updateDish, deleteDish, recordDishCooked } = useDishMutations();

  return {
    dishes,
    isLoading,
    addDish,
    updateDish,
    deleteDish,
    recordDishCooked,
    getDish,
    getMealHistoryForDish
  };
}
