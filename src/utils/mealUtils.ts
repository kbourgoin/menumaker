
// Re-export all functions from individual utility files for backward compatibility

// Storage utilities
export { generateId, clearAllData } from './storageUtils';

// Dish utilities
export { 
  getDishes, 
  saveDishes, 
  addDish, 
  getDishById, 
  updateDish, 
  deleteDish,
  getDishesByBookId
} from './dishUtils';

// Meal history utilities
export {
  getMealHistory,
  saveMealHistory,
  logDishCooked
} from './mealHistoryUtils';

// Cookbook utilities
export {
  getCookbooks,
  saveCookbooks,
  addCookbook,
  updateCookbook,
  deleteCookbook,
  getCookbookById
} from './cookbookUtils';

// Suggestion utilities
export { getRandomDishSuggestions } from './suggestionUtils';

// Stats utilities
export { getDishStats } from './statsUtils';

// Import utilities
export { importMealHistory } from './importUtils';
