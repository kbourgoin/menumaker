
import { useState, useEffect } from "react";
import { Dish } from "@/types";
import { 
  getDishes,
  addDish,
  updateDish,
  deleteDish,
  logDishCooked,
  getRandomDishSuggestions,
  getDishById,
  getDishStats,
  importMealHistory,
  clearAllData
} from "@/utils/mealUtils";

export function useDishes() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load dishes from localStorage
    const loadedDishes = getDishes();
    setDishes(loadedDishes);
    setIsLoading(false);
  }, []);

  const addNewDish = (dish: Omit<Dish, "id" | "createdAt" | "timesCooked">) => {
    const updatedDishes = addDish(dish);
    setDishes(updatedDishes);
    return updatedDishes.find(d => d.name === dish.name);
  };

  const updateExistingDish = (id: string, updates: Partial<Dish>) => {
    const updatedDishes = updateDish(id, updates);
    setDishes(updatedDishes);
  };

  const removeExistingDish = (id: string) => {
    const updatedDishes = deleteDish(id);
    setDishes(updatedDishes);
  };

  const recordDishCooked = (dishId: string, date?: string, notes?: string) => {
    logDishCooked(dishId, date, notes);
    // Refresh dishes list to get updated timesCooked and lastMade
    setDishes(getDishes());
  };

  const getWeeklyDishSuggestions = (count: number = 7) => {
    return getRandomDishSuggestions(count);
  };

  const getDish = (id: string) => {
    return getDishById(id);
  };

  const getStats = () => {
    return getDishStats();
  };

  const importMealHistoryFromData = (
    entries: { 
      date: string; 
      dish: string; 
      notes?: string;
      source?: {
        type: 'url' | 'book' | 'none';
        value: string;
        page?: number;
      };
    }[]
  ) => {
    const result = importMealHistory(entries);
    // Refresh dishes list to get updated data
    setDishes(getDishes());
    return result;
  };

  const clearData = () => {
    clearAllData();
    setDishes([]);
  };

  return {
    dishes,
    isLoading,
    addDish: addNewDish,
    updateDish: updateExistingDish,
    deleteDish: removeExistingDish,
    recordDishCooked,
    getWeeklyDishSuggestions,
    getDish,
    getStats,
    importMealHistory: importMealHistoryFromData,
    clearData
  };
}
