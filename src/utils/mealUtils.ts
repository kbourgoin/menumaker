
import { Meal } from "@/types";

// Get meals from localStorage or initialize with empty array
export const getMeals = (): Meal[] => {
  const meals = localStorage.getItem("meals");
  return meals ? JSON.parse(meals) : [];
};

// Save meals to localStorage
export const saveMeals = (meals: Meal[]): void => {
  localStorage.setItem("meals", JSON.stringify(meals));
};

// Get meal history from localStorage or initialize with empty array
export const getMealHistory = (): { date: string; mealId: string; notes?: string }[] => {
  const history = localStorage.getItem("mealHistory");
  return history ? JSON.parse(history) : [];
};

// Save meal history to localStorage
export const saveMealHistory = (history: { date: string; mealId: string; notes?: string }[]): void => {
  localStorage.setItem("mealHistory", JSON.stringify(history));
};

// Add a new meal and return the updated list
export const addMeal = (meal: Omit<Meal, "id" | "createdAt" | "timesCooked">): Meal[] => {
  const meals = getMeals();
  const newMeal: Meal = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    timesCooked: 0,
    ...meal,
  };
  const updatedMeals = [...meals, newMeal];
  saveMeals(updatedMeals);
  return updatedMeals;
};

// Log that a meal was cooked (updates lastMade and timesCooked)
export const logMealCooked = (
  mealId: string, 
  date: string = new Date().toISOString(),
  notes?: string
): void => {
  // Update meal stats
  const meals = getMeals();
  const updatedMeals = meals.map((meal) => {
    if (meal.id === mealId) {
      return {
        ...meal,
        lastMade: date,
        timesCooked: meal.timesCooked + 1,
      };
    }
    return meal;
  });

  // Update history
  const history = getMealHistory();
  const updatedHistory = [
    ...history, 
    { 
      date, 
      mealId, 
      notes 
    }
  ];

  saveMeals(updatedMeals);
  saveMealHistory(updatedHistory);
};

// Generate random meal suggestions weighted by frequency and recency
export const getRandomMealSuggestions = (count: number = 7): Meal[] => {
  const meals = getMeals();
  if (meals.length === 0) return [];
  if (meals.length <= count) return [...meals];

  // Calculate the 'weight' for each meal based on:
  // 1. How often it's been cooked (less is better)
  // 2. How recently it's been cooked (longer ago is better)
  const today = new Date();
  
  // Calculate weights
  const mealsWithWeights = meals.map(meal => {
    // Frequency weight (inverse of timesCooked)
    const frequencyWeight = meal.timesCooked === 0 ? 5 : (10 / (meal.timesCooked + 1));
    
    // Recency weight (more days since last made = higher weight)
    let recencyWeight = 5; // Default for never made
    if (meal.lastMade) {
      const daysSinceLastMade = Math.max(
        1, 
        Math.floor((today.getTime() - new Date(meal.lastMade).getTime()) / (1000 * 60 * 60 * 24))
      );
      recencyWeight = Math.min(10, daysSinceLastMade / 7); // Cap at 10 (about 10 weeks)
    }
    
    // Surface old favorites (high times cooked but not recent)
    const oldFavoriteBonus = 
      meal.timesCooked > 3 && 
      meal.lastMade && 
      (today.getTime() - new Date(meal.lastMade).getTime()) > (90 * 24 * 60 * 60 * 1000) // > 90 days
        ? 5 
        : 0;
    
    const totalWeight = frequencyWeight + recencyWeight + oldFavoriteBonus;
    
    return {
      meal,
      weight: totalWeight
    };
  });
  
  // Sort by weight (higher weights first)
  mealsWithWeights.sort((a, b) => b.weight - a.weight);
  
  // Get the top meals by weight, but add some randomness by selecting from the top 60%
  const topMeals = mealsWithWeights.slice(0, Math.max(count * 2, Math.floor(meals.length * 0.6)));
  
  // Randomly select from top-weighted meals
  const suggestions: Meal[] = [];
  const selectedIndexes = new Set<number>();
  
  while (suggestions.length < count && suggestions.length < topMeals.length) {
    const randomIndex = Math.floor(Math.random() * topMeals.length);
    if (!selectedIndexes.has(randomIndex)) {
      selectedIndexes.add(randomIndex);
      suggestions.push(topMeals[randomIndex].meal);
    }
  }
  
  return suggestions;
};

// Get meal by ID
export const getMealById = (id: string): Meal | undefined => {
  const meals = getMeals();
  return meals.find((meal) => meal.id === id);
};

// Update meal by ID
export const updateMeal = (id: string, updates: Partial<Meal>): Meal[] => {
  const meals = getMeals();
  const updatedMeals = meals.map((meal) => {
    if (meal.id === id) {
      return {
        ...meal,
        ...updates,
      };
    }
    return meal;
  });
  saveMeals(updatedMeals);
  return updatedMeals;
};

// Delete meal by ID
export const deleteMeal = (id: string): Meal[] => {
  const meals = getMeals();
  const updatedMeals = meals.filter((meal) => meal.id !== id);
  saveMeals(updatedMeals);
  
  // Also clean up meal history
  const history = getMealHistory();
  const updatedHistory = history.filter((entry) => entry.mealId !== id);
  saveMealHistory(updatedHistory);
  
  return updatedMeals;
};

// Helper function to generate a simple ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

// Get stats about meals
export const getMealStats = () => {
  const meals = getMeals();
  const history = getMealHistory();
  
  return {
    totalMeals: meals.length,
    totalTimesCooked: meals.reduce((sum, meal) => sum + meal.timesCooked, 0),
    mostCooked: [...meals].sort((a, b) => b.timesCooked - a.timesCooked)[0],
    cuisineBreakdown: meals.reduce((acc, meal) => {
      meal.cuisines.forEach(cuisine => {
        acc[cuisine] = (acc[cuisine] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>),
    recentlyCooked: history
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(h => ({
        date: h.date,
        meal: getMealById(h.mealId)
      }))
  };
};

// Import meal history from CSV data
export const importMealHistory = (
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
): { success: number; skipped: number } => {
  const meals = getMeals();
  const history = getMealHistory();
  let successCount = 0;
  let skippedCount = 0;
  
  // Group entries by dish name to handle duplicates
  const entriesByDish: Record<string, typeof entries> = {};
  
  entries.forEach(entry => {
    const dishLower = entry.dish.toLowerCase();
    if (!entriesByDish[dishLower]) {
      entriesByDish[dishLower] = [];
    }
    entriesByDish[dishLower].push(entry);
  });
  
  const updatedMeals = [...meals];
  const updatedHistory = [...history];
  
  // Process each unique dish
  Object.entries(entriesByDish).forEach(([dishLower, dishEntries]) => {
    // Find if this dish already exists in the database
    let meal = meals.find(m => m.name.toLowerCase() === dishLower);
    
    // If dish doesn't exist, create it once using the first entry's data
    if (!meal) {
      const firstEntry = dishEntries[0];
      meal = {
        id: generateId(),
        name: firstEntry.dish,
        createdAt: firstEntry.date, // Use the earliest historical date as creation date
        timesCooked: 0,
        cuisines: ['Other'], // Default cuisine
        source: firstEntry.source || {
          type: 'none',
          value: ''
        }
      };
      updatedMeals.push(meal);
    }
    
    // Process all entries for this dish (different cooking dates)
    let newCookCount = 0;
    
    dishEntries.forEach(entry => {
      // Create history entry for each cooking date
      const historyEntry = {
        date: entry.date,
        mealId: meal!.id,
        notes: entry.notes
      };
      
      // Check if this exact entry already exists (avoid duplicates)
      const duplicateEntry = updatedHistory.some(h => 
        h.mealId === historyEntry.mealId && 
        h.date === historyEntry.date
      );
      
      if (!duplicateEntry) {
        updatedHistory.push(historyEntry);
        newCookCount++;
        successCount++;
      } else {
        skippedCount++;
      }
    });
    
    // Only update the meal record if we added new cooking instances
    if (newCookCount > 0) {
      // Find the meal in updatedMeals to update its stats
      const mealIndex = updatedMeals.findIndex(m => m.id === meal!.id);
      if (mealIndex >= 0) {
        // Sort all entries for this dish by date
        const sortedEntries = [...dishEntries].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        // Update lastMade to the most recent date
        updatedMeals[mealIndex].lastMade = sortedEntries[0].date;
        
        // Increment timesCooked by the number of new entries
        updatedMeals[mealIndex].timesCooked += newCookCount;
      }
    }
  });
  
  // Save updated data
  saveMeals(updatedMeals);
  saveMealHistory(updatedHistory);
  
  return { success: successCount, skipped: skippedCount };
};

// Clear all meal data from localStorage
export const clearAllData = (): void => {
  localStorage.removeItem("meals");
  localStorage.removeItem("mealHistory");
};

// Helper function to generate a simple ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

// Get stats about meals
export const getMealStats = () => {
  const meals = getMeals();
  const history = getMealHistory();
  
  return {
    totalMeals: meals.length,
    totalTimesCooked: meals.reduce((sum, meal) => sum + meal.timesCooked, 0),
    mostCooked: [...meals].sort((a, b) => b.timesCooked - a.timesCooked)[0],
    cuisineBreakdown: meals.reduce((acc, meal) => {
      meal.cuisines.forEach(cuisine => {
        acc[cuisine] = (acc[cuisine] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>),
    recentlyCooked: history
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(h => ({
        date: h.date,
        meal: getMealById(h.mealId)
      }))
  };
};
