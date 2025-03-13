
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
    let location = undefined;
    
    // If it's a book source, try to find or create a source entry
    if (firstEntry.source?.type === 'book' && firstEntry.source.value) {
      sourceId = await findOrCreateSource(firstEntry.source.value, 'book', userId);
      // For book sources, set location to page number if it exists
      if (firstEntry.source.page) {
        location = firstEntry.source.page.toString();
      }
    } else if (firstEntry.source?.type === 'url' && firstEntry.source.value) {
      // For URL sources, create website source and set dish location to the URL
      sourceId = await findOrCreateSource(firstEntry.source.value, 'website', userId);
      location = firstEntry.source.value;
    } else if (firstEntry.location) {
      // Use explicit location if provided
      location = firstEntry.location;
    }
    
    // Find or create the dish - pass the sourceId and location separately
    const dishId = await findOrCreateDish(
      firstEntry.dish, 
      firstEntry.date, 
      sourceId,
      userId,
      location
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
