
import { findOrCreateSource, findOrCreateDish } from "./dishImport";
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
    };
    location?: string; 
  }[],
  userId: string
) => {
  try {
    const firstEntry = dishEntries[0];
    let sourceId = undefined;
    
    // If it's a book source, try to find or create a source entry
    if (firstEntry.source?.type === 'book' && firstEntry.source.value) {
      sourceId = await findOrCreateSource(firstEntry.source.value, 'book', null, userId);
    } else if (firstEntry.source?.type === 'url' && firstEntry.source.value) {
      // Optionally also track website sources
      sourceId = await findOrCreateSource(firstEntry.source.value, 'website', firstEntry.source.value, userId);
    }
    
    // Find or create the dish - pass the location field
    const dishId = await findOrCreateDish(
      firstEntry.dish, 
      firstEntry.date, 
      sourceId, 
      userId,
      firstEntry.location
    );
    
    if (!dishId) {
      console.error(`Failed to find or create dish '${firstEntry.dish}'`);
      return { success: 0, skipped: dishEntries.length };
    }
    
    // Get existing meal history entries for this dish
    const existingEntries = await getExistingMealEntries(dishId, userId);
    
    // Create new meal history entries
    return await createMealHistoryEntries(dishId, dishEntries, existingEntries, userId);
  } catch (err) {
    // Log the specific error for debugging
    const error = err as any;
    console.error(`Error processing dish '${dishEntries[0].dish}':`, error);
    return { success: 0, skipped: dishEntries.length };
  }
};
