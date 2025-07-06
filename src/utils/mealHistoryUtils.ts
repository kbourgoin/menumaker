import { Dish } from "@/types";
import { getStorageItem, saveStorageItem } from "./storageUtils";

// Mock functions that were previously imported from dishUtils
const getDishes = (): Dish[] => [];
const saveDishes = (_dishes: Dish[]): void => {};

// Get meal history from localStorage or initialize with empty array
export const getMealHistory = (): {
  date: string;
  dishId: string;
  notes?: string;
}[] => {
  return getStorageItem<{ date: string; dishId: string; notes?: string }[]>(
    "mealHistory",
    []
  );
};

// Save meal history to localStorage
export const saveMealHistory = (
  history: { date: string; dishId: string; notes?: string }[]
): void => {
  saveStorageItem("mealHistory", history);
};

// Log that a dish was cooked (updates lastMade and timesCooked)
export const logDishCooked = (
  dishId: string,
  date: string = new Date().toISOString(),
  notes?: string
): void => {
  // Update dish stats
  const dishes = getDishes();
  const updatedDishes = dishes.map(dish => {
    if (dish.id === dishId) {
      return {
        ...dish,
        lastMade: date,
        timesCooked: dish.timesCooked + 1,
      };
    }
    return dish;
  });

  // Update history
  const history = getMealHistory();
  const updatedHistory = [
    ...history,
    {
      date,
      dishId,
      notes,
    },
  ];

  saveDishes(updatedDishes);
  saveMealHistory(updatedHistory);
};
