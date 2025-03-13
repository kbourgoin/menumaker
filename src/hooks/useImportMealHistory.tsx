
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useImportMealHistory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Import meal history with progress reporting
  const importMealHistory = async (
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
    }[],
    onProgress?: (progress: number, total: number) => void
  ) => {
    const user = await supabase.auth.getUser();
    const user_id = user.data.user?.id;
    
    if (!user_id) throw new Error("User not authenticated");
    
    console.log(`Starting import of ${entries.length} entries`);
    
    let successCount = 0;
    let skippedCount = 0;
    const BATCH_SIZE = 10; // Process entries in batches of 10
    
    try {
      // Group entries by dish name
      const entriesByDish: Record<string, typeof entries> = {};
      
      entries.forEach(entry => {
        const dishLower = entry.dish.toLowerCase();
        if (!entriesByDish[dishLower]) {
          entriesByDish[dishLower] = [];
        }
        entriesByDish[dishLower].push(entry);
      });
      
      const totalDishes = Object.keys(entriesByDish).length;
      let processedDishes = 0;
      
      console.log(`Grouped ${entries.length} entries into ${totalDishes} dishes`);
      
      // Process dishes in batches
      const dishEntries = Object.entries(entriesByDish);
      
      for (let i = 0; i < dishEntries.length; i += BATCH_SIZE) {
        const batch = dishEntries.slice(i, i + BATCH_SIZE);
        
        console.log(`Processing batch ${i/BATCH_SIZE + 1} of ${Math.ceil(dishEntries.length/BATCH_SIZE)}`);
        
        // Process each batch in parallel
        await Promise.all(batch.map(async ([dishLower, dishEntries]) => {
          try {
            // Use a more forgiving search to find dishes with similar names
            const { data: existingDishes, error: dishError } = await supabase
              .from('dishes')
              .select('*')
              .ilike('name', `%${dishEntries[0].dish.substring(0, Math.min(dishEntries[0].dish.length, 10))}%`)
              .limit(5);
            
            if (dishError) {
              console.error(`Error finding dish '${dishEntries[0].dish}':`, dishError);
              return;
            }
            
            console.log(`Search for '${dishEntries[0].dish}' found ${existingDishes?.length || 0} potential matches`);
            
            let dishId;
            let exactMatch = false;
            
            // Check for an exact match (case insensitive)
            if (existingDishes && existingDishes.length > 0) {
              const exactDish = existingDishes.find(d => 
                d.name.toLowerCase() === dishEntries[0].dish.toLowerCase()
              );
              
              if (exactDish) {
                dishId = exactDish.id;
                exactMatch = true;
                console.log(`Found exact match for dish '${dishEntries[0].dish}' with ID ${dishId}`);
              }
            }
            
            // If no exact match, create a new dish
            if (!exactMatch) {
              console.log(`Creating new dish '${dishEntries[0].dish}'`);
              const firstEntry = dishEntries[0];
              let source = firstEntry.source || {
                type: 'none',
                value: ''
              };
              
              // If it's a book source, try to find or create cookbook
              if (source.type === 'book' && source.value) {
                console.log(`Looking for cookbook '${source.value}'`);
                const { data: existingCookbooks, error: cookbookError } = await supabase
                  .from('cookbooks')
                  .select('*')
                  .ilike('name', `%${source.value}%`);
                
                if (cookbookError) {
                  console.error(`Error finding cookbook '${source.value}':`, cookbookError);
                }
                
                let cookbookId;
                
                if (!existingCookbooks || existingCookbooks.length === 0) {
                  // Create new cookbook
                  console.log(`Creating new cookbook '${source.value}'`);
                  const { data: newCookbook, error: newCookbookError } = await supabase
                    .from('cookbooks')
                    .insert({ 
                      name: source.value,
                      user_id 
                    })
                    .select('id')
                    .single();
                    
                  if (newCookbookError) {
                    console.error(`Error creating cookbook '${source.value}':`, newCookbookError);
                  } else if (newCookbook) {
                    cookbookId = newCookbook.id;
                    console.log(`Created cookbook '${source.value}' with ID ${cookbookId}`);
                  }
                } else {
                  // Find the best match (exact match preferred)
                  const exactCookbook = existingCookbooks.find(c => 
                    c.name.toLowerCase() === source.value.toLowerCase()
                  );
                  
                  cookbookId = exactCookbook ? exactCookbook.id : existingCookbooks[0].id;
                  console.log(`Using existing cookbook '${exactCookbook?.name || existingCookbooks[0].name}' with ID ${cookbookId}`);
                }
                
                if (cookbookId) {
                  source = {
                    ...source,
                    bookId: cookbookId
                  };
                }
              }
              
              // Create new dish - This is the part that was failing due to the materialized view
              try {
                const { data: newDish, error: newDishError } = await supabase
                  .from('dishes')
                  .insert({
                    name: firstEntry.dish,
                    createdat: firstEntry.date,
                    cuisines: ['Other'],
                    source,
                    user_id
                  })
                  .select('id')
                  .single();
                  
                if (newDishError) {
                  console.error(`Error creating dish '${firstEntry.dish}':`, newDishError);
                  return;
                } else if (newDish) {
                  dishId = newDish.id;
                  console.log(`Created new dish '${firstEntry.dish}' with ID ${dishId}`);
                }
              } catch (err) {
                console.error(`Failed to create dish '${firstEntry.dish}':`, err);
                return;
              }
            }
            
            if (dishId) {
              // Create meal history entries for this dish
              const historyEntries = [];
              
              // Use a Set for existing entries to avoid duplicates
              const existingEntries = new Set();
              
              // Get all existing meal history entries for this dish to check for duplicates
              const { data: existingMealHistory, error: historyError } = await supabase
                .from('meal_history')
                .select('date')
                .eq('dishid', dishId);
                
              if (historyError) {
                console.error(`Error fetching meal history for dish ${dishId}:`, historyError);
              } else if (existingMealHistory) {
                existingMealHistory.forEach(entry => {
                  // Store just the date part to simplify comparison
                  const dateOnly = new Date(entry.date).toISOString().split('T')[0];
                  existingEntries.add(dateOnly);
                });
                console.log(`Found ${existingMealHistory.length} existing history entries for dish ${dishId}`);
              }
              
              // Prepare new entries that don't exist yet
              for (const entry of dishEntries) {
                // Compare just the date part
                const entryDateOnly = new Date(entry.date).toISOString().split('T')[0];
                
                if (!existingEntries.has(entryDateOnly)) {
                  historyEntries.push({
                    dishid: dishId,
                    date: entry.date,
                    notes: entry.notes,
                    user_id
                  });
                } else {
                  skippedCount++;
                }
              }
              
              console.log(`Adding ${historyEntries.length} new history entries for dish ${dishId} (skipped ${dishEntries.length - historyEntries.length})`);
              
              // Insert all new entries in a single batch
              if (historyEntries.length > 0) {
                try {
                  const { data: newHistory, error: insertError } = await supabase
                    .from('meal_history')
                    .insert(historyEntries);
                    
                  if (insertError) {
                    console.error(`Error inserting history entries for dish ${dishId}:`, insertError);
                  } else {
                    successCount += historyEntries.length;
                    console.log(`Successfully added ${historyEntries.length} history entries for dish ${dishId}`);
                  }
                } catch (err) {
                  console.error(`Failed to insert history entries for dish ${dishId}:`, err);
                }
              }
            }
          } catch (err) {
            console.error(`Error processing dish '${dishEntries[0].dish}':`, err);
          } finally {
            // Always update progress even if there was an error
            processedDishes++;
            if (onProgress) {
              onProgress(processedDishes, totalDishes);
            }
          }
        }));
      }
      
      console.log(`Import complete. Success: ${successCount}, Skipped: ${skippedCount}`);
      
      // Refresh data regardless of success count
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
      queryClient.invalidateQueries({ queryKey: ['mealHistory'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      
      // Always return a result even if nothing was imported
      return { success: successCount, skipped: skippedCount };
    } catch (error) {
      console.error("Import error:", error);
      throw error;
    }
  };

  return {
    importMealHistory
  };
}
