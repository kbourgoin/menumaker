
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExportData } from "./useDataExport";
import { mapDishToDB, mapMealHistoryToDB, mapSourceToDB } from "@/integrations/supabase/client";

// Number of items to process in a single batch
const BATCH_SIZE = 50;

export function useJSONImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const queryClient = useQueryClient();

  const importFromJSON = async (
    jsonData: ExportData, 
    onProgress?: (progress: number, total: number) => void
  ) => {
    setIsImporting(true);
    setProgress(0);
    
    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;
      
      if (!userId) throw new Error("User not authenticated");
      
      // Ensure all imported data has the current user ID
      const updateUserIds = (obj: any) => ({...obj, user_id: userId});
      
      // Update the progress
      const totalItems = jsonData.sources.length + jsonData.dishes.length + jsonData.mealHistory.length;
      let processedItems = 0;
      
      // Import sources first, as dishes may depend on them
      console.log(`Importing ${jsonData.sources.length} sources...`);
      let successCount = 0;
      let errorCount = 0;
      
      // Process sources in batches
      for (let i = 0; i < jsonData.sources.length; i += BATCH_SIZE) {
        const batch = jsonData.sources.slice(i, i + BATCH_SIZE);
        // Create properly typed source objects
        const sourcesToDB = batch.map(source => {
          const sourceToDB = mapSourceToDB(updateUserIds(source));
          // Ensure all required fields are present
          return {
            id: sourceToDB.id,
            name: sourceToDB.name || 'Unknown Source', // Default name if missing
            type: sourceToDB.type || 'other', // Default type if missing
            description: sourceToDB.description,
            created_at: sourceToDB.created_at || new Date().toISOString(),
            user_id: sourceToDB.user_id
          };
        });
        
        if (sourcesToDB.length > 0) {
          try {
            const { error, count } = await supabase
              .from('sources')
              .upsert(sourcesToDB, { 
                onConflict: 'id',
                count: 'exact'
              });
              
            if (error) throw error;
            successCount += count || 0;
          } catch (error) {
            console.error("Error importing sources batch:", error);
            errorCount += batch.length;
          }
        } else {
          errorCount += batch.length;
        }
        
        processedItems += batch.length;
        if (onProgress) onProgress(processedItems, totalItems);
        setProgress(Math.floor((processedItems / totalItems) * 100));
      }
      
      // Import dishes in batches
      console.log(`Importing ${jsonData.dishes.length} dishes...`);
      for (let i = 0; i < jsonData.dishes.length; i += BATCH_SIZE) {
        const batch = jsonData.dishes.slice(i, i + BATCH_SIZE);
        // Create properly typed dish objects
        const dishesToDB = batch.map(dish => {
          const dishToDB = mapDishToDB(updateUserIds(dish));
          // Ensure all required fields are present
          return {
            id: dishToDB.id,
            name: dishToDB.name || 'Unknown Dish', // Default name if missing
            createdat: dishToDB.createdat || new Date().toISOString(),
            cuisines: dishToDB.cuisines || ['Other'],
            source_id: dishToDB.source_id,
            location: dishToDB.location,
            user_id: dishToDB.user_id
          };
        });
        
        if (dishesToDB.length > 0) {
          try {
            const { error, count } = await supabase
              .from('dishes')
              .upsert(dishesToDB, { 
                onConflict: 'id',
                count: 'exact'
              });
              
            if (error) throw error;
            successCount += count || 0;
          } catch (error) {
            console.error("Error importing dishes batch:", error);
            errorCount += batch.length;
          }
        } else {
          errorCount += batch.length;
        }
        
        processedItems += batch.length;
        if (onProgress) onProgress(processedItems, totalItems);
        setProgress(Math.floor((processedItems / totalItems) * 100));
      }
      
      // Import meal history in batches
      console.log(`Importing ${jsonData.mealHistory.length} meal history entries...`);
      for (let i = 0; i < jsonData.mealHistory.length; i += BATCH_SIZE) {
        const batch = jsonData.mealHistory.slice(i, i + BATCH_SIZE);
        // Create properly typed history objects
        const historyToDB = batch.map(history => {
          const historyEntry = mapMealHistoryToDB(updateUserIds(history));
          // Ensure all required fields are present
          return {
            id: historyEntry.id,
            dishid: historyEntry.dishid, // This is required
            date: historyEntry.date || new Date().toISOString(),
            notes: historyEntry.notes,
            user_id: historyEntry.user_id
          };
        }).filter(h => h.dishid); // Filter out invalid entries without dishid
        
        if (historyToDB.length > 0) {
          try {
            const { error, count } = await supabase
              .from('meal_history')
              .upsert(historyToDB, { 
                onConflict: 'id',
                count: 'exact'
              });
              
            if (error) throw error;
            successCount += count || 0;
          } catch (error) {
            console.error("Error importing meal history batch:", error);
            errorCount += batch.length;
          }
        } else {
          errorCount += batch.length;
        }
        
        processedItems += batch.length;
        if (onProgress) onProgress(processedItems, totalItems);
        setProgress(Math.floor((processedItems / totalItems) * 100));
      }
      
      // Manually refresh the materialized view to ensure dashboard works correctly
      try {
        await supabase.rpc('refresh_dish_summary_secure');
        console.log("Materialized view refreshed successfully");
      } catch (error) {
        console.warn("Could not refresh materialized view:", error);
        // This is non-fatal, the triggers should handle it
      }
      
      // Refresh all queries to update data
      queryClient.invalidateQueries();
      
      console.log(`Import complete. Success: ${successCount}, Errors: ${errorCount}`);
      
      // Ensure 100% progress is shown
      setProgress(100);
      
      return { success: successCount, errors: errorCount, total: totalItems };
    } finally {
      setTimeout(() => {
        setIsImporting(false);
      }, 500); // Small delay to ensure UI shows 100%
    }
  };

  const validateJSONData = (data: unknown): { valid: boolean; message?: string } => {
    if (!data || typeof data !== 'object') {
      return { valid: false, message: "Invalid JSON data format" };
    }
    
    const exportData = data as Partial<ExportData>;
    
    if (!exportData.version) {
      return { valid: false, message: "Missing version information" };
    }
    
    if (!Array.isArray(exportData.dishes)) {
      return { valid: false, message: "Missing or invalid dishes data" };
    }
    
    if (!Array.isArray(exportData.mealHistory)) {
      return { valid: false, message: "Missing or invalid meal history data" };
    }
    
    if (!Array.isArray(exportData.sources)) {
      return { valid: false, message: "Missing or invalid sources data" };
    }
    
    return { valid: true };
  };

  return {
    isImporting,
    progress,
    importFromJSON,
    validateJSONData
  };
}
