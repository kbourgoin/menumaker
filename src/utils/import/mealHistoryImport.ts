
import { supabase } from "@/integrations/supabase/client";

// Get existing meal history entries for a dish to avoid duplicates
export const getExistingMealEntries = async (dishId: string, userId: string) => {
  const { data: existingMealHistory, error: historyError } = await supabase
    .from('meal_history')
    .select('date')
    .eq('dishid', dishId)
    .eq('user_id', userId);
    
  if (historyError) {
    console.error(`Error fetching meal history for dish ${dishId}:`, historyError);
    return new Set();
  }
  
  // Use a Set for existing entries to avoid duplicates
  const existingEntries = new Set();
  
  if (existingMealHistory) {
    existingMealHistory.forEach(entry => {
      // Store just the date part to simplify comparison
      const dateOnly = new Date(entry.date).toISOString().split('T')[0];
      existingEntries.add(dateOnly);
    });
    console.log(`Found ${existingMealHistory.length} existing history entries for dish ${dishId}`);
  }
  
  return existingEntries;
};

// Create new meal history entries for a dish
export const createMealHistoryEntries = async (
  dishId: string, 
  entries: { date: string; notes?: string }[], 
  existingEntries: Set<string>,
  userId: string
) => {
  // Prepare new entries that don't exist yet
  const historyEntries = [];
  let skipped = 0;
  
  for (const entry of entries) {
    // Compare just the date part
    const entryDateOnly = new Date(entry.date).toISOString().split('T')[0];
    
    if (!existingEntries.has(entryDateOnly)) {
      historyEntries.push({
        dishid: dishId,
        date: entry.date,
        notes: entry.notes,
        user_id: userId
      });
    } else {
      skipped++;
    }
  }
  
  console.log(`Adding ${historyEntries.length} new history entries for dish ${dishId} (skipped ${skipped})`);
  
  // Insert all new entries in a single batch
  if (historyEntries.length > 0) {
    const { error: insertError } = await supabase
      .from('meal_history')
      .insert(historyEntries);
      
    if (insertError) {
      console.error(`Error inserting history entries for dish ${dishId}:`, insertError);
      return { success: 0, skipped };
    }
    
    return { success: historyEntries.length, skipped };
  }
  
  return { success: 0, skipped };
};
