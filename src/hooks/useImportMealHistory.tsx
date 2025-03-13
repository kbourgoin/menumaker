
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
            
            // Use a Set for existing entries to avoid duplicates
            const existingEntries = new Set();
            
            // We need to paginate through all meal history entries for this dish
            // to properly check for duplicates, due to the 1000 row limit
            let hasMoreEntries = true;
            let lastDate = null;
            
            while (hasMoreEntries) {
              let query = supabase
                .from('meal_history')
                .select('date')
                .eq('dishid', dishId)
                .order('date', { ascending: false });
              
              // Apply pagination using the start_after parameter if we have a lastDate
              if (lastDate) {
                query = query.lt('date', lastDate);
              }
              
              // Limit to max rows to get a full page
              query = query.limit(1000);
              
              const { data: existingMealHistory, error } = await query;
              
              if (error) {
                console.error("Error fetching meal history:", error);
                break;
              }
              
              // If we got fewer rows than the limit, we've reached the end
              if (!existingMealHistory || existingMealHistory.length < 1000) {
                hasMoreEntries = false;
              }
              
              // Add all dates to our set
              if (existingMealHistory && existingMealHistory.length > 0) {
                existingMealHistory.forEach(entry => {
                  existingEntries.add(entry.date);
                });
                
                // Update lastDate for next page
                lastDate = existingMealHistory[existingMealHistory.length - 1].date;
              } else {
                hasMoreEntries = false;
              }
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
              // Split into chunks of 1000 if needed to avoid the limit
              const CHUNK_SIZE = 500; // Using 500 to be safe with Supabase limits
              
              for (let i = 0; i < historyEntries.length; i += CHUNK_SIZE) {
                const chunk = historyEntries.slice(i, i + CHUNK_SIZE);
                
                const { data, error } = await supabase
                  .from('meal_history')
                  .insert(chunk);
                  
                if (!error) {
                  successCount += chunk.length;
                } else {
                  console.error("Error inserting history entries:", error);
                }
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
