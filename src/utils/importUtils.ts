
import { getDishes, saveDishes } from "./dishUtils";
import { getMealHistory, saveMealHistory } from "./mealHistoryUtils";
import { getCookbooks, saveCookbooks } from "./cookbookUtils";
import { generateId } from "./storageUtils";

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
