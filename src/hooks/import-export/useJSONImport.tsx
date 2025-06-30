
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
      
      console.log(`Import starting for user: ${userId}`);
      
      // Check if this is a same-account import by looking at user_ids in the data
      const exportedUserIds = new Set([
        ...jsonData.sources.map(s => s.user_id).filter(Boolean),
        ...jsonData.dishes.map(d => d.user_id).filter(Boolean),
        ...jsonData.mealHistory.map(m => m.user_id).filter(Boolean)
      ]);
      
      const isSameAccountImport = exportedUserIds.size === 1 && exportedUserIds.has(userId);
      console.log(`Same account import: ${isSameAccountImport}`);
      if (isSameAccountImport) {
        console.log("Detected same-account import - will preserve existing IDs and use upsert behavior");
      } else {
        console.log("Detected cross-account import - will generate new IDs to prevent conflicts");
      }
      
      // Create ID mapping tables to handle cross-account imports
      const sourceIdMap = new Map<string, string>();
      const dishIdMap = new Map<string, string>();
      const mealHistoryIdMap = new Map<string, string>();
      
      // Generate new UUIDs for all entities to prevent conflicts (only for cross-account)
      const generateNewId = () => crypto.randomUUID();
      
      // Ensure all imported data has the current user ID
      const updateUserIds = <T extends Record<string, unknown>>(obj: T): T & { user_id: string } => {
        const updated = {...obj, user_id: userId};
        if (obj.user_id && obj.user_id !== userId) {
          console.log(`Updated user_id from ${obj.user_id} to ${userId}`);
        }
        return updated;
      };
      
      // Update the progress
      const totalItems = jsonData.sources.length + jsonData.dishes.length + jsonData.mealHistory.length;
      let processedItems = 0;
      
      // Import sources first, as dishes may depend on them
      console.log(`Importing ${jsonData.sources.length} sources...`);
      let successCount = 0;
      let errorCount = 0;
      let sourceImportSuccess = 0;
      let dishImportSuccess = 0;
      
      // Process sources in batches
      for (let i = 0; i < jsonData.sources.length; i += BATCH_SIZE) {
        const batch = jsonData.sources.slice(i, i + BATCH_SIZE);
        // Create properly typed source objects (with or without new IDs based on import type)
        const sourcesToDB = batch.map(source => {
          const sourceToDB = mapSourceToDB(updateUserIds(source));
          
          let finalId: string;
          if (isSameAccountImport) {
            // Same account: preserve original ID for upsert behavior
            finalId = sourceToDB.id || generateNewId();
            sourceIdMap.set(sourceToDB.id || 'unknown', finalId);
          } else {
            // Cross account: generate new ID to prevent conflicts
            finalId = generateNewId();
            if (sourceToDB.id) {
              sourceIdMap.set(sourceToDB.id, finalId);
            }
          }
          
          // Ensure all required fields are present
          return {
            id: finalId,
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
            sourceImportSuccess += count || 0;
            successCount += count || 0;
          } catch (error) {
            console.error("Error importing sources batch:", error);
            console.error("Source batch data:", sourcesToDB);
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
        // Create properly typed dish objects (with or without new IDs based on import type)
        const dishesToDB = batch.map(dish => {
          const dishToDB = mapDishToDB(updateUserIds(dish));
          
          let finalId: string;
          if (isSameAccountImport) {
            // Same account: preserve original ID for upsert behavior
            finalId = dishToDB.id || generateNewId();
            dishIdMap.set(dishToDB.id || 'unknown', finalId);
          } else {
            // Cross account: generate new ID to prevent conflicts
            finalId = generateNewId();
            if (dishToDB.id) {
              dishIdMap.set(dishToDB.id, finalId);
            }
          }
          
          // Map source_id to new source ID if it exists in our mapping
          const mappedSourceId = dishToDB.source_id ? sourceIdMap.get(dishToDB.source_id) : undefined;
          
          // Ensure all required fields are present
          return {
            id: finalId,
            name: dishToDB.name || 'Unknown Dish', // Default name if missing
            createdat: dishToDB.createdat || new Date().toISOString(),
            cuisines: dishToDB.cuisines || ['Other'],
            source_id: mappedSourceId || dishToDB.source_id, // Use mapped ID if available
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
            dishImportSuccess += count || 0;
            successCount += count || 0;
          } catch (error) {
            console.error("Error importing dishes batch:", error);
            console.error("Dish batch data:", dishesToDB);
            errorCount += batch.length;
          }
        } else {
          errorCount += batch.length;
        }
        
        processedItems += batch.length;
        if (onProgress) onProgress(processedItems, totalItems);
        setProgress(Math.floor((processedItems / totalItems) * 100));
      }
      
      // Import meal history in batches (only if dishes were imported successfully)
      console.log(`Importing ${jsonData.mealHistory.length} meal history entries...`);
      console.log(`Dishes imported successfully: ${dishImportSuccess}`);
      for (let i = 0; i < jsonData.mealHistory.length; i += BATCH_SIZE) {
        const batch = jsonData.mealHistory.slice(i, i + BATCH_SIZE);
        // Create properly typed history objects (with or without new IDs based on import type)
        const historyToDB = batch.map(history => {
          const historyEntry = mapMealHistoryToDB(updateUserIds(history));
          
          let finalId: string;
          if (isSameAccountImport) {
            // Same account: preserve original ID for upsert behavior
            finalId = historyEntry.id || generateNewId();
            mealHistoryIdMap.set(historyEntry.id || 'unknown', finalId);
          } else {
            // Cross account: generate new ID to prevent conflicts
            finalId = generateNewId();
            if (historyEntry.id) {
              mealHistoryIdMap.set(historyEntry.id, finalId);
            }
          }
          
          // Map dishid to dish ID - for same account, use original; for cross account, use mapped
          let finalDishId: string | undefined;
          if (isSameAccountImport) {
            finalDishId = historyEntry.dishid; // Keep original dish reference
          } else {
            finalDishId = historyEntry.dishid ? dishIdMap.get(historyEntry.dishid) : undefined;
          }
          
          // Ensure all required fields are present
          return {
            id: finalId,
            dishid: finalDishId,
            date: historyEntry.date || new Date().toISOString(),
            notes: historyEntry.notes,
            user_id: historyEntry.user_id
          };
        }).filter(h => {
          if (!h.dishid) {
            console.warn(`Meal history entry missing ${isSameAccountImport ? 'original' : 'mapped'} dishid:`, h);
            return false;
          }
          return true;
        }); // Filter out entries where dish reference is invalid
        
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
            console.error("Meal history batch data:", historyToDB);
            errorCount += batch.length;
          }
        } else {
          errorCount += batch.length;
        }
        
        processedItems += batch.length;
        if (onProgress) onProgress(processedItems, totalItems);
        setProgress(Math.floor((processedItems / totalItems) * 100));
      }
      
      // The materialized view should be refreshed automatically by database triggers
      // after the import completes, so no manual refresh is needed
      
      // Refresh all queries to update data
      queryClient.invalidateQueries();
      
      console.log(`Import complete. Success: ${successCount}, Errors: ${errorCount}`);
      console.log(`ID mappings created:`);
      console.log(`- Sources: ${sourceIdMap.size} mappings`);
      console.log(`- Dishes: ${dishIdMap.size} mappings`);
      console.log(`- Meal History: ${mealHistoryIdMap.size} mappings`);
      
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
