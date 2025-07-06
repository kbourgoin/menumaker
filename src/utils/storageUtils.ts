// This file contains basic localStorage operations used by all other utility files

// Generate a simple ID helper function
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

// Helper to get data from localStorage
export const getStorageItem = <T>(key: string, defaultValue: T): T => {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : defaultValue;
};

// Helper to save data to localStorage
export const saveStorageItem = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Clear all data from localStorage
export const clearAllData = (): void => {
  localStorage.removeItem("dishes");
  localStorage.removeItem("mealHistory");
  localStorage.removeItem("cookbooks");
};
