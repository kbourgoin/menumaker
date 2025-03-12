
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDataImport() {
  const queryClient = useQueryClient();

  // Import meal history
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
    }[]
  ) => {
    const user = await supabase.auth.getUser();
    const user_id = user.data.user?.id;
    
    if (!user_id) throw new Error("User not authenticated");
    
    let successCount = 0;
    let skippedCount = 0;
    
    // Group entries by dish name
    const entriesByDish: Record<string, typeof entries> = {};
    
    entries.forEach(entry => {
      const dishLower = entry.dish.toLowerCase();
      if (!entriesByDish[dishLower]) {
        entriesByDish[dishLower] = [];
      }
      entriesByDish[dishLower].push(entry);
    });
    
    // Process each unique dish
    for (const [dishLower, dishEntries] of Object.entries(entriesByDish)) {
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
            timescooked: 0,
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
        // Process all entries for this dish
        let newCookCount = 0;
        
        for (const entry of dishEntries) {
          // Check if this entry already exists
          const { data: existingEntries } = await supabase
            .from('meal_history')
            .select('*')
            .eq('dishid', dishId)
            .eq('date', entry.date);
            
          if (!existingEntries || existingEntries.length === 0) {
            // Add to meal history
            await supabase
              .from('meal_history')
              .insert({
                dishid: dishId,
                date: entry.date,
                notes: entry.notes,
                user_id
              });
              
            newCookCount++;
            successCount++;
          } else {
            skippedCount++;
          }
        }
        
        // Update dish stats if needed
        if (newCookCount > 0) {
          // Find the most recent entry
          const sortedEntries = [...dishEntries].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          
          // Update the lastmade date
          await supabase
            .from('dishes')
            .update({
              lastmade: sortedEntries[0].date,
            })
            .eq('id', dishId);
            
          // Increment the timescooked using RPC
          if (newCookCount === 1) {
            await supabase.rpc('increment_times_cooked', { dish_id: dishId });
          } else {
            await supabase.rpc('increment_by', { 
              dish_id: dishId, 
              increment_amount: newCookCount 
            });
          }
        }
      }
    }
    
    // Refresh data
    queryClient.invalidateQueries({ queryKey: ['dishes'] });
    queryClient.invalidateQueries({ queryKey: ['mealHistory'] });
    
    return { success: successCount, skipped: skippedCount };
  };

  // Clear all data
  const clearData = async () => {
    try {
      const user = await supabase.auth.getUser();
      const user_id = user.data.user?.id;
      
      if (!user_id) throw new Error("User not authenticated");
      
      console.log("Clearing data for user:", user_id);
      
      // Delete all data in reverse order of dependencies
      const { error: mealHistoryError } = await supabase
        .from('meal_history')
        .delete()
        .eq('user_id', user_id);
        
      if (mealHistoryError) {
        console.error("Error deleting meal history:", mealHistoryError);
        throw mealHistoryError;
      }
      
      const { error: dishesError } = await supabase
        .from('dishes')
        .delete()
        .eq('user_id', user_id);
        
      if (dishesError) {
        console.error("Error deleting dishes:", dishesError);
        throw dishesError;
      }
      
      const { error: cookbooksError } = await supabase
        .from('cookbooks')
        .delete()
        .eq('user_id', user_id);
        
      if (cookbooksError) {
        console.error("Error deleting cookbooks:", cookbooksError);
        throw cookbooksError;
      }
      
      // Invalidate ALL queries to ensure UI is refreshed
      queryClient.invalidateQueries();
      
      console.log("All data cleared successfully");
      return { success: true };
    } catch (error) {
      console.error("Error clearing data:", error);
      return { success: false, error };
    }
  };

  return {
    importMealHistory,
    clearData
  };
}
