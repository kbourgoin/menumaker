
// Re-export all functions from individual utility files for backward compatibility

// Storage utilities
export { generateId, clearAllData } from './storageUtils';

// Mock dish utilities
export const getDishes = () => [];
export const saveDishes = () => {};
export const addDish = () => {};
export const getDishById = () => {};
export const updateDish = () => {};
export const deleteDish = () => {};

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
