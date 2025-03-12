
import { useState, useEffect } from "react";
import { Meal } from "@/types";
import { 
  getMeals,
  addMeal,
  updateMeal,
  deleteMeal,
  logMealCooked,
  getRandomMealSuggestions,
  getMealById,
  getMealStats
} from "@/utils/mealUtils";

export function useMeals() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load meals from localStorage
    const loadedMeals = getMeals();
    setMeals(loadedMeals);
    setIsLoading(false);
  }, []);

  const addNewMeal = (meal: Omit<Meal, "id" | "createdAt" | "timesCooked">) => {
    const updatedMeals = addMeal(meal);
    setMeals(updatedMeals);
    return updatedMeals.find(m => m.name === meal.name);
  };

  const updateExistingMeal = (id: string, updates: Partial<Meal>) => {
    const updatedMeals = updateMeal(id, updates);
    setMeals(updatedMeals);
  };

  const removeExistingMeal = (id: string) => {
    const updatedMeals = deleteMeal(id);
    setMeals(updatedMeals);
  };

  const recordMealCooked = (mealId: string, date?: string, notes?: string) => {
    logMealCooked(mealId, date, notes);
    // Refresh meals list to get updated timesCooked and lastMade
    setMeals(getMeals());
  };

  const getWeeklyMealSuggestions = (count: number = 7) => {
    return getRandomMealSuggestions(count);
  };

  const getMeal = (id: string) => {
    return getMealById(id);
  };

  const getStats = () => {
    return getMealStats();
  };

  return {
    meals,
    isLoading,
    addMeal: addNewMeal,
    updateMeal: updateExistingMeal,
    deleteMeal: removeExistingMeal,
    recordMealCooked,
    getWeeklyMealSuggestions,
    getMeal,
    getStats
  };
}
