
import { useDishQueries, useDishMutations } from "./dish";
import { useMealHistory } from "./useMealHistory";
import { useWeeklyMenu } from "./useWeeklyMenu";
import { useSources } from "./sources";
import { useStats } from "./useStats";
import { useDataImport } from "./import";

/**
 * This is a composite hook that combines all meal-related functionality.
 * It imports from individual hook files and provides a unified API.
 */
export function useDishes() {
  const { dishes, isLoading, getDish, getMealHistoryForDish } = useDishQueries();
  const { addDish, updateDish, deleteDish } = useDishMutations();
  const { recordDishCooked } = useMealHistory();
  const weeklyMenuHook = useWeeklyMenu();
  const sourcesHook = useSources();
  const statsHook = useStats();
  const dataImportHook = useDataImport();

  return {
    // Dishes
    dishes,
    isLoading,
    addDish,
    updateDish,
    deleteDish,
    getDish,
    
    // Meal History
    recordDishCooked,
    getMealHistoryForDish,
    
    // Weekly Menu
    getWeeklyDishSuggestions: weeklyMenuHook.getWeeklyDishSuggestions,
    allDishes: weeklyMenuHook.allDishes,
    
    // Sources
    getSources: sourcesHook.getSources,
    getSource: sourcesHook.getSource,
    getDishesBySource: sourcesHook.getDishesBySource,
    
    // Stats
    getStats: statsHook.getStats,
    
    // Data Import
    importMealHistory: dataImportHook.importMealHistory,
    clearData: dataImportHook.clearData
  };
}
