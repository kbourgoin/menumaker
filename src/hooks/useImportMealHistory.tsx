
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useBatchProcessing } from "./import/useBatchProcessing";
import { processDishImport } from "@/utils/import/processDishImport";

export function useImportMealHistory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const BATCH_SIZE = 5;

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
    let errorCount = 0;
    
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
        const results = await Promise.allSettled(batch.map(async ([dishLower, dishEntries]) => {
          try {
            return await processDishImport(dishEntries[0].dish, dishEntries, user_id);
          } catch (error) {
            console.error(`Error processing dish ${dishEntries[0].dish}:`, error);
            errorCount += 1;
            return { success: 0, skipped: dishEntries.length };
          }
        }));
        
        // Count successes and failures
        results.forEach(result => {
          if (result.status === 'fulfilled') {
            successCount += result.value.success;
            skippedCount += result.value.skipped;
          }
        });
        
        // Update progress after each batch
        processedDishes += batch.length;
        if (onProgress) {
          onProgress(processedDishes, totalDishes);
        }
      }
      
      console.log(`Import complete. Success: ${successCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);
      
      // Refresh data regardless of success count
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
      queryClient.invalidateQueries({ queryKey: ['mealHistory'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      
      // Always return a result even if nothing was imported
      return { success: successCount, skipped: skippedCount, errors: errorCount };
    } catch (error) {
      console.error("Import error:", error);
      throw error;
    }
  };

  return {
    importMealHistory
  };
}
