
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
  deleteDish
} from './dishUtils';

// Meal history utilities
export {
  getMealHistory,
  saveMealHistory,
  logDishCooked
} from './mealHistoryUtils';

// Source utilities
export {
  getSources,
  saveSources,
  addSource,
  updateSource,
  deleteSource,
  getSourceById
} from './sourceUtils';

// Suggestion utilities
export { getRandomDishSuggestions } from './suggestionUtils';

// Stats utilities
export { getDishStats } from './statsUtils';

// Import utilities
export { importMealHistory } from './importUtils';
