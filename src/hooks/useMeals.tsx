
import { useDishes as useDishesHook } from "./useDishes";
import { useMealHistory } from "./useMealHistory";
import { useWeeklyMenu } from "./useWeeklyMenu";
import { useCookbooks } from "./useCookbooks";
import { useStats } from "./useStats";
import { useDataImport } from "./useDataImport";

// This is a composite hook that combines all meal-related functionality
export function useDishes() {
  const dishesHook = useDishesHook();
  const mealHistoryHook = useMealHistory();
  const weeklyMenuHook = useWeeklyMenu();
  const cookbooksHook = useCookbooks();
  const statsHook = useStats();
  const dataImportHook = useDataImport();

  return {
    // Dishes
    ...dishesHook,
    
    // Meal History
    recordDishCooked: mealHistoryHook.recordDishCooked,
    getMealHistoryForDish: mealHistoryHook.getMealHistoryForDish,
    
    // Weekly Menu
    getWeeklyDishSuggestions: weeklyMenuHook.getWeeklyDishSuggestions,
    
    // Cookbooks
    getCookbooks: cookbooksHook.getCookbooks,
    getCookbook: cookbooksHook.getCookbook,
    getDishesByCookbook: cookbooksHook.getDishesByCookbook,
    
    // Stats
    getStats: statsHook.getStats,
    
    // Data Import
    importMealHistory: dataImportHook.importMealHistory,
    clearData: dataImportHook.clearData
  };
}
