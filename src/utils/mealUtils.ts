import { Dish, Cookbook } from "@/types";

// Get dishes from localStorage or initialize with empty array
export const getDishes = (): Dish[] => {
  const dishes = localStorage.getItem("dishes");
  return dishes ? JSON.parse(dishes) : [];
};

// Save dishes to localStorage
export const saveDishes = (dishes: Dish[]): void => {
  localStorage.setItem("dishes", JSON.stringify(dishes));
};

// Get meal history from localStorage or initialize with empty array
export const getMealHistory = (): { date: string; dishId: string; notes?: string }[] => {
  const history = localStorage.getItem("mealHistory");
  return history ? JSON.parse(history) : [];
};

// Save meal history to localStorage
export const saveMealHistory = (history: { date: string; dishId: string; notes?: string }[]): void => {
  localStorage.setItem("mealHistory", JSON.stringify(history));
};

// Get cookbooks from localStorage or initialize with empty array
export const getCookbooks = (): Cookbook[] => {
  const cookbooks = localStorage.getItem("cookbooks");
  return cookbooks ? JSON.parse(cookbooks) : [];
};

// Save cookbooks to localStorage
export const saveCookbooks = (cookbooks: Cookbook[]): void => {
  localStorage.setItem("cookbooks", JSON.stringify(cookbooks));
};

// Add a new cookbook
export const addCookbook = (cookbook: Omit<Cookbook, "id" | "createdAt">): Cookbook[] => {
  const cookbooks = getCookbooks();
  const newCookbook: Cookbook = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    ...cookbook,
  };
  const updatedCookbooks = [...cookbooks, newCookbook];
  saveCookbooks(updatedCookbooks);
  return updatedCookbooks;
};

// Update a cookbook
export const updateCookbook = (id: string, updates: Partial<Cookbook>): Cookbook[] => {
  const cookbooks = getCookbooks();
  const updatedCookbooks = cookbooks.map((cookbook) => {
    if (cookbook.id === id) {
      return {
        ...cookbook,
        ...updates,
      };
    }
    return cookbook;
  });
  saveCookbooks(updatedCookbooks);
  return updatedCookbooks;
};

// Delete a cookbook
export const deleteCookbook = (id: string): Cookbook[] => {
  const cookbooks = getCookbooks();
  const updatedCookbooks = cookbooks.filter((cookbook) => cookbook.id !== id);
  saveCookbooks(updatedCookbooks);
  
  // Update any dish references
  const dishes = getDishes();
  const updatedDishes = dishes.map((dish) => {
    if (dish.source?.type === 'book' && dish.source?.bookId === id) {
      return {
        ...dish,
        source: {
          ...dish.source,
          bookId: undefined,
        }
      };
    }
    return dish;
  });
  saveDishes(updatedDishes);
  
  return updatedCookbooks;
};

// Get cookbook by ID
export const getCookbookById = (id: string): Cookbook | undefined => {
  const cookbooks = getCookbooks();
  return cookbooks.find((cookbook) => cookbook.id === id);
};

// Get dishes by cookbook ID
export const getDishesByBookId = (bookId: string): Dish[] => {
  const dishes = getDishes();
  return dishes.filter((dish) => dish.source?.type === 'book' && dish.source?.bookId === bookId);
};

// Helper function to generate a simple ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
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

// Log that a dish was cooked (updates lastMade and timesCooked)
export const logDishCooked = (
  dishId: string, 
  date: string = new Date().toISOString(),
  notes?: string
): void => {
  // Update dish stats
  const dishes = getDishes();
  const updatedDishes = dishes.map((dish) => {
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
      notes 
    }
  ];

  saveDishes(updatedDishes);
  saveMealHistory(updatedHistory);
};

// Generate random dish suggestions weighted by frequency and recency
export const getRandomDishSuggestions = (count: number = 7): Dish[] => {
  const dishes = getDishes();
  if (dishes.length === 0) return [];
  if (dishes.length <= count) return [...dishes];

  // Calculate the 'weight' for each dish based on:
  // 1. How often it's been cooked (less is better)
  // 2. How recently it's been cooked (longer ago is better)
  const today = new Date();
  
  // Calculate weights
  const dishesWithWeights = dishes.map(dish => {
    // Frequency weight (inverse of timesCooked)
    const frequencyWeight = dish.timesCooked === 0 ? 5 : (10 / (dish.timesCooked + 1));
    
    // Recency weight (more days since last made = higher weight)
    let recencyWeight = 5; // Default for never made
    if (dish.lastMade) {
      const daysSinceLastMade = Math.max(
        1, 
        Math.floor((today.getTime() - new Date(dish.lastMade).getTime()) / (1000 * 60 * 60 * 24))
      );
      recencyWeight = Math.min(10, daysSinceLastMade / 7); // Cap at 10 (about 10 weeks)
    }
    
    // Surface old favorites (high times cooked but not recent)
    const oldFavoriteBonus = 
      dish.timesCooked > 3 && 
      dish.lastMade && 
      (today.getTime() - new Date(dish.lastMade).getTime()) > (90 * 24 * 60 * 60 * 1000) // > 90 days
        ? 5 
        : 0;
    
    const totalWeight = frequencyWeight + recencyWeight + oldFavoriteBonus;
    
    return {
      dish,
      weight: totalWeight
    };
  });
  
  // Sort by weight (higher weights first)
  dishesWithWeights.sort((a, b) => b.weight - a.weight);
  
  // Get the top dishes by weight, but add some randomness by selecting from the top 60%
  const topDishes = dishesWithWeights.slice(0, Math.max(count * 2, Math.floor(dishes.length * 0.6)));
  
  // Randomly select from top-weighted dishes
  const suggestions: Dish[] = [];
  const selectedIndexes = new Set<number>();
  
  while (suggestions.length < count && suggestions.length < topDishes.length) {
    const randomIndex = Math.floor(Math.random() * topDishes.length);
    if (!selectedIndexes.has(randomIndex)) {
      selectedIndexes.add(randomIndex);
      suggestions.push(topDishes[randomIndex].dish);
    }
  }
  
  return suggestions;
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
  return updatedDishes;
};

// Delete dish by ID
export const deleteDish = (id: string): Dish[] => {
  const dishes = getDishes();
  const updatedDishes = dishes.filter((dish) => dish.id !== id);
  saveDishes(updatedDishes);
  
  // Also clean up meal history
  const history = getMealHistory();
  const updatedHistory = history.filter((entry) => entry.dishId !== id);
  saveMealHistory(updatedHistory);
  
  return updatedDishes;
};

// Get stats about dishes
export const getDishStats = () => {
  const dishes = getDishes();
  const history = getMealHistory();
  
  return {
    totalDishes: dishes.length,
    totalTimesCooked: dishes.reduce((sum, dish) => sum + dish.timesCooked, 0),
    mostCooked: [...dishes].sort((a, b) => b.timesCooked - a.timesCooked)[0],
    cuisineBreakdown: dishes.reduce((acc, dish) => {
      dish.cuisines.forEach(cuisine => {
        acc[cuisine] = (acc[cuisine] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>),
    recentlyCooked: history
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(h => ({
        date: h.date,
        dish: getDishById(h.dishId)
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
      bookId?: string;
    };
  }[]
): { success: number; skipped: number } => {
  const dishes = getDishes();
  const history = getMealHistory();
  const cookbooks = getCookbooks();
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
  
  const updatedDishes = [...dishes];
  const updatedHistory = [...history];
  
  // Process each unique dish
  Object.entries(entriesByDish).forEach(([dishLower, dishEntries]) => {
    // Find if this dish already exists in the database
    let dish = dishes.find(d => d.name.toLowerCase() === dishLower);
    
    // If dish doesn't exist, create it once using the first entry's data
    if (!dish) {
      const firstEntry = dishEntries[0];
      let source = firstEntry.source || {
        type: 'none',
        value: ''
      };
      
      // If it's a book source, try to find or create cookbook
      if (source.type === 'book' && source.value) {
        // Check if cookbook already exists
        let cookbook = cookbooks.find(c => c.name.toLowerCase() === source.value.toLowerCase());
        
        // If cookbook doesn't exist, create it
        if (!cookbook) {
          cookbook = {
            id: generateId(),
            name: source.value,
            createdAt: new Date().toISOString(),
          };
          cookbooks.push(cookbook);
          saveCookbooks(cookbooks);
        }
        
        // Link dish to cookbook
        source = {
          ...source,
          bookId: cookbook.id
        };
      }
      
      dish = {
        id: generateId(),
        name: firstEntry.dish,
        createdAt: firstEntry.date, // Use the earliest historical date as creation date
        timesCooked: 0,
        cuisines: ['Other'], // Default cuisine
        source
      };
      updatedDishes.push(dish);
    }
    
    // Process all entries for this dish (different cooking dates)
    let newCookCount = 0;
    
    dishEntries.forEach(entry => {
      // Create history entry for each cooking date
      const historyEntry = {
        date: entry.date,
        dishId: dish!.id,
        notes: entry.notes
      };
      
      // Check if this exact entry already exists (avoid duplicates)
      const duplicateEntry = updatedHistory.some(h => 
        h.dishId === historyEntry.dishId && 
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
    
    // Only update the dish record if we added new cooking instances
    if (newCookCount > 0) {
      // Find the dish in updatedDishes to update its stats
      const dishIndex = updatedDishes.findIndex(d => d.id === dish!.id);
      if (dishIndex >= 0) {
        // Sort all entries for this dish by date
        const sortedEntries = [...dishEntries].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        // Update lastMade to the most recent date
        updatedDishes[dishIndex].lastMade = sortedEntries[0].date;
        
        // Increment timesCooked by the number of new entries
        updatedDishes[dishIndex].timesCooked += newCookCount;
      }
    }
  });
  
  // Save updated data
  saveDishes(updatedDishes);
  saveMealHistory(updatedHistory);
  
  return { success: successCount, skipped: skippedCount };
};

// Clear all dish data from localStorage
export const clearAllData = (): void => {
  localStorage.removeItem("dishes");
  localStorage.removeItem("mealHistory");
  localStorage.removeItem("cookbooks");
};
