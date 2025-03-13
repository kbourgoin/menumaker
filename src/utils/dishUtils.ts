import { Dish } from "@/types";
import { getStorageItem, saveStorageItem, generateId } from "./storageUtils";

// Get dishes from localStorage or initialize with empty array
export const getDishes = (): Dish[] => {
  return getStorageItem<Dish[]>("dishes", []);
};

// Save dishes to localStorage
export const saveDishes = (dishes: Dish[]): void => {
  saveStorageItem("dishes", dishes);
};

// Add a new dish and return the updated list
export const addDish = (dish: Omit<Dish, "id" | "createdAt" | "timesCooked">): Dish[] => {
  const dishes = getDishes();
  const newDish: Dish = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    timesCooked: 0,
    ...dish,
  };
  const updatedDishes = [...dishes, newDish];
  saveDishes(updatedDishes);
  return updatedDishes;
};

// Get dish by ID
export const getDishById = (id: string): Dish | undefined => {
  const dishes = getDishes();
  return dishes.find((dish) => dish.id === id);
};

// Update dish by ID
export const updateDish = (id: string, updates: Partial<Dish>): Dish[] => {
  const dishes = getDishes();
  const updatedDishes = dishes.map((dish) => {
    if (dish.id === id) {
      return {
        ...dish,
        ...updates,
      };
    }
    return dish;
  });
  saveDishes(updatedDishes);
  
  // Update any cached lastMade/timesCooked values
  const recentDishes = getStorageItem<Dish[]>("recentDishes", []);
  if (recentDishes.length > 0) {
    const updatedRecentDishes = recentDishes.map((dish) => {
      if (dish.id === id) {
        return {
          ...dish,
          ...updates,
        };
      }
      return dish;
    });
    saveStorageItem("recentDishes", updatedRecentDishes);
  }

  return updatedDishes;
};

// Delete dish by ID
export const deleteDish = (id: string): Dish[] => {
  const dishes = getDishes();
  const updatedDishes = dishes.filter((dish) => dish.id !== id);
  saveDishes(updatedDishes);
  
  // Clean up meal history (importing function from mealHistoryUtils would create circular dependency)
  const history = JSON.parse(localStorage.getItem("mealHistory") || "[]");
  const updatedHistory = history.filter((entry: any) => entry.dishId !== id);
  localStorage.setItem("mealHistory", JSON.stringify(updatedHistory));
  
  return updatedDishes;
};

// Get dishes by cookbook ID - updated to use the direct foreign key
export const getDishesByBookId = (bookId: string): Dish[] => {
  const dishes = getDishes();
  return dishes.filter((dish) => dish.cookbookId === bookId);
};
