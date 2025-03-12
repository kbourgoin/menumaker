
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useImportMealHistory() {
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
        
        // We don't need to update dish stats anymore since they're derived
        // from meal history data. The timesCooked and lastMade fields 
        // have been removed from the dishes table.
      }
    }
    
    // Refresh data
    queryClient.invalidateQueries({ queryKey: ['dishes'] });
    queryClient.invalidateQueries({ queryKey: ['mealHistory'] });
    queryClient.invalidateQueries({ queryKey: ['stats'] });
    
    return { success: successCount, skipped: skippedCount };
  };

  return {
    importMealHistory
  };
}
