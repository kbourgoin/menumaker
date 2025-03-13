
import { findOrCreateCookbook, findOrCreateDish } from "./dishImport";
import { getExistingMealEntries, createMealHistoryEntries } from "./mealHistoryImport";

// Process a single dish and its entries
export const processDishImport = async (
  dishName: string, 
  dishEntries: { 
    date: string; 
    dish: string; 
    notes?: string;
    source?: {
      type: 'url' | 'book' | 'none';
      value: string;
      page?: number;
      bookId?: string;
    }; 
  }[],
  userId: string
) => {
  try {
    const firstEntry = dishEntries[0];
    let source = firstEntry.source || {
      type: 'none',
      value: ''
    };
    
    // If it's a book source, try to find or create cookbook
    if (source.type === 'book' && source.value) {
      const cookbookId = await findOrCreateCookbook(source.value, userId);
      
      if (cookbookId) {
        source = {
          ...source,
          bookId: cookbookId
        };
      }
    }
    
    // Find or create the dish - this function is now updated to avoid the view
    const dishId = await findOrCreateDish(firstEntry.dish, firstEntry.date, source, userId);
    
    if (!dishId) {
      console.error(`Failed to find or create dish '${firstEntry.dish}'`);
      return { success: 0, skipped: dishEntries.length };
    }
    
    // Get existing meal history entries for this dish
    const existingEntries = await getExistingMealEntries(dishId, userId);
    
    // Create new meal history entries - this function is now updated to avoid the view
    return await createMealHistoryEntries(dishId, dishEntries, existingEntries, userId);
  } catch (err) {
    // Log the specific error for debugging
    const error = err as any;
    if (error?.message?.includes('dish_summary')) {
      console.error(`Permission error with materialized view when processing dish '${dishEntries[0].dish}':`, error);
    } else {
      console.error(`Error processing dish '${dishEntries[0].dish}':`, error);
    }
    return { success: 0, skipped: dishEntries.length };
  }
};
