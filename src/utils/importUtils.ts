
import { Dish, MealHistory } from "@/types";
import { generateId } from "./storageUtils";

// Function to import meal history data
export const importMealHistory = (
  mealHistoryData: Record<string, any>[],
  userId: string
): MealHistory[] => {
  return mealHistoryData.map((historyData) => importMealHistoryEntry(historyData, userId));
};

// Function to import a single meal history entry
export const importMealHistoryEntry = (
  historyData: Record<string, any>,
  userId: string
): MealHistory => {
  // Set default values for required fields if they aren't present
  if (!historyData.dishId) {
    throw new Error("Dish ID is required");
  }
  if (!historyData.date) {
    throw new Error("Date is required");
  }

  // Create a new meal history entry with the imported data
  const newMealHistoryEntry: MealHistory = {
    id: generateId(),
    dishId: historyData.dishId,
    date: historyData.date,
    notes: historyData.notes || undefined,
    user_id: userId
  };

  return newMealHistoryEntry;
};

// Function to import dish data
export const importDishes = (
  dishesData: Record<string, any>[],
  userId: string
): Dish[] => {
  return dishesData.map((dishData) => importDish(dishData, userId));
};

// Function to import a single dish
export const importDish = (
  dishData: Record<string, any>,
  userId: string
): Dish => {
  // Set default values for required fields if they aren't present
  if (!dishData.name) {
    throw new Error("Dish name is required");
  }

  // Create a new dish with the imported data
  const newDish: Dish = {
    id: generateId(),
    name: dishData.name,
    cuisines: Array.isArray(dishData.cuisines)
      ? dishData.cuisines
      : dishData.cuisines
      ? [dishData.cuisines]
      : ["Other"],
    createdAt: dishData.createdAt || new Date().toISOString(),
    timesCooked: dishData.timesCooked || 0,
    lastMade: dishData.lastMade || undefined,
    sourceId: dishData.sourceId || undefined,
    location: dishData.location,
    user_id: userId
  };

  return newDish;
};
