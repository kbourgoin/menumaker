
import { useDishQueries, useDishMutations } from "./dish";
import { useMealHistory } from "./useMealHistory";
import { useWeeklyMenu } from "./useWeeklyMenu";
import { useSources } from "./sources";
import { useStats } from "./useStats";

/**
 * This is a composite hook that combines all meal-related functionality.
 * It imports from individual hook files and provides a unified API.
 */
export function useMeals() {
  const { dishes, isLoading, getDish, getMealHistoryForDish } = useDishQueries();
  const { addDish, updateDish, deleteDish } = useDishMutations();
  const { 
    recordDishCooked, 
    deleteMealHistory, 
    updateMealHistory 
  } = useMealHistory();
  
  const weeklyMenuHook = useWeeklyMenu();
  const sourcesHook = useSources();
  const statsHook = useStats();

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
    deleteMealHistory,
    updateMealHistory,
    
    // Weekly Menu
    getWeeklyDishSuggestions: weeklyMenuHook.getWeeklyDishSuggestions,
    allDishes: weeklyMenuHook.allDishes,
    
    // Sources
    getSources: sourcesHook.getSources,
    getSource: sourcesHook.getSource,
    getDishesBySource: sourcesHook.getDishesBySource,
    
    // Stats
    getStats: statsHook.getStats,
    stats: statsHook.stats,
    statsLoading: statsHook.isLoading
  };
}

// Also export the hook as useDishes for backward compatibility
export { useMeals as useDishes };
