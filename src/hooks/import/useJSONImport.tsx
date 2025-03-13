
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExportData } from "./useDataExport";
import { mapDishToDB, mapMealHistoryToDB, mapSourceToDB } from "@/integrations/supabase/client";

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
      
      // Process sources
      for (const source of jsonData.sources) {
        try {
          const sourceToDB = mapSourceToDB(updateUserIds(source));
          
          // Ensure required fields are present
          if (!sourceToDB.name || !sourceToDB.type || !sourceToDB.user_id) {
            throw new Error("Missing required fields for source");
          }
          
          const { error } = await supabase
            .from('sources')
            .upsert({
              id: sourceToDB.id,
              name: sourceToDB.name,
              type: sourceToDB.type,
              description: sourceToDB.description,
              created_at: sourceToDB.created_at,
              user_id: sourceToDB.user_id
            }, { onConflict: 'id' });
            
          if (error) throw error;
          successCount++;
        } catch (error) {
          console.error("Error importing source:", error);
          errorCount++;
        }
        
        processedItems++;
        if (onProgress) onProgress(processedItems, totalItems);
        setProgress(Math.floor((processedItems / totalItems) * 100));
      }
      
      // Import dishes
      console.log(`Importing ${jsonData.dishes.length} dishes...`);
      for (const dish of jsonData.dishes) {
        try {
          const dishToDB = mapDishToDB(updateUserIds(dish));
          
          // Ensure required fields are present
          if (!dishToDB.name || !dishToDB.user_id) {
            throw new Error("Missing required fields for dish");
          }
          
          const { error } = await supabase
            .from('dishes')
            .upsert({
              id: dishToDB.id,
              name: dishToDB.name,
              createdat: dishToDB.createdat || new Date().toISOString(),
              cuisines: dishToDB.cuisines || ['Other'],
              source_id: dishToDB.source_id,
              location: dishToDB.location,
              user_id: dishToDB.user_id
            }, { onConflict: 'id' });
            
          if (error) throw error;
          successCount++;
        } catch (error) {
          console.error("Error importing dish:", error);
          errorCount++;
        }
        
        processedItems++;
        if (onProgress) onProgress(processedItems, totalItems);
        setProgress(Math.floor((processedItems / totalItems) * 100));
      }
      
      // Import meal history
      console.log(`Importing ${jsonData.mealHistory.length} meal history entries...`);
      for (const history of jsonData.mealHistory) {
        try {
          const historyToDB = mapMealHistoryToDB(updateUserIds(history));
          
          // Ensure required fields are present
          if (!historyToDB.dishid || !historyToDB.user_id) {
            throw new Error("Missing required fields for meal history entry");
          }
          
          const { error } = await supabase
            .from('meal_history')
            .upsert({
              id: historyToDB.id,
              dishid: historyToDB.dishid,
              date: historyToDB.date || new Date().toISOString(),
              notes: historyToDB.notes,
              user_id: historyToDB.user_id
            }, { onConflict: 'id' });
            
          if (error) throw error;
          successCount++;
        } catch (error) {
          console.error("Error importing meal history:", error);
          errorCount++;
        }
        
        processedItems++;
        if (onProgress) onProgress(processedItems, totalItems);
        setProgress(Math.floor((processedItems / totalItems) * 100));
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
