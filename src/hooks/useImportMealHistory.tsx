
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useImportMealHistory() {
  const queryClient = useQueryClient();

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
      
      // Process dishes in batches
      const dishEntries = Object.entries(entriesByDish);
      
      for (let i = 0; i < dishEntries.length; i += BATCH_SIZE) {
        const batch = dishEntries.slice(i, i + BATCH_SIZE);
        
        // Process each batch in parallel
        await Promise.all(batch.map(async ([dishLower, dishEntries]) => {
          // Check if dish already exists
          const { data: existingDishes } = await supabase
            .from('dishes')
            .select('*')
            .ilike('name', dishEntries[0].dish);
          
          let dishId;
          
          // If dish doesn't exist, create it
          if (!existingDishes || existingDishes.length === 0) {
            const firstEntry = dishEntries[0];
            let source = firstEntry.source || {
              type: 'none',
              value: ''
            };
            
            // If it's a book source, try to find or create cookbook
            if (source.type === 'book' && source.value) {
              const { data: existingCookbooks } = await supabase
                .from('cookbooks')
                .select('*')
                .ilike('name', source.value);
              
              let cookbookId;
              
              if (!existingCookbooks || existingCookbooks.length === 0) {
                // Create new cookbook
                const { data: newCookbook } = await supabase
                  .from('cookbooks')
                  .insert({ 
                    name: source.value,
                    user_id 
                  })
                  .select('id')
                  .single();
                  
                if (newCookbook) {
                  cookbookId = newCookbook.id;
                }
              } else {
                cookbookId = existingCookbooks[0].id;
              }
              
              if (cookbookId) {
                source = {
                  ...source,
                  bookId: cookbookId
                };
              }
            }
            
            // Create new dish
            const { data: newDish } = await supabase
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
              
            if (newDish) {
              dishId = newDish.id;
            }
          } else {
            dishId = existingDishes[0].id;
          }
          
          if (dishId) {
            // Create meal history entries in one batch
            const historyEntries = [];
            const existingEntries = new Set();
            
            // First, get all existing entries for this dish to avoid duplicates
            const { data: existingMealHistory } = await supabase
              .from('meal_history')
              .select('date')
              .eq('dishid', dishId);
              
            if (existingMealHistory) {
              existingMealHistory.forEach(entry => {
                existingEntries.add(entry.date);
              });
            }
            
            // Prepare new entries that don't exist yet
            for (const entry of dishEntries) {
              if (!existingEntries.has(entry.date)) {
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
            
            // Insert all new entries in a single batch
            if (historyEntries.length > 0) {
              const { data, error } = await supabase
                .from('meal_history')
                .insert(historyEntries);
                
              if (!error) {
                successCount += historyEntries.length;
              } else {
                console.error("Error inserting history entries:", error);
              }
            }
          }
          
          // Update progress
          processedDishes++;
          if (onProgress) {
            onProgress(processedDishes, totalDishes);
          }
        }));
      }
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
      queryClient.invalidateQueries({ queryKey: ['mealHistory'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      
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
