
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dish, MealHistory, Source } from "@/types";
import { 
  mapDishFromDB, 
  mapMealHistoryFromDB, 
  mapSourceFromDB
} from "@/integrations/supabase/client";

export interface ExportData {
  dishes: Dish[];
  mealHistory: MealHistory[];
  sources: Source[];
  version: string;
  exportDate: string;
}

export function useDataExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportAllData = async (): Promise<ExportData> => {
    setIsExporting(true);
    
    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;
      
      if (!userId) throw new Error("User not authenticated");
      
      // Fetch all dishes
      const { data: dishesData, error: dishesError } = await supabase
        .from('dishes')
        .select('*')
        .eq('user_id', userId);
        
      if (dishesError) throw dishesError;
      
      // Fetch all meal history
      const { data: mealHistoryData, error: mealHistoryError } = await supabase
        .from('meal_history')
        .select('*')
        .eq('user_id', userId);
        
      if (mealHistoryError) throw mealHistoryError;
      
      // Fetch all sources
      const { data: sourcesData, error: sourcesError } = await supabase
        .from('sources')
        .select('*')
        .eq('user_id', userId);
        
      if (sourcesError) throw sourcesError;
      
      // Map data to our app types
      const dishes = dishesData.map(dish => mapDishFromDB(dish));
      const mealHistory = mealHistoryData.map(history => mapMealHistoryFromDB(history));
      const sources = sourcesData.map(source => mapSourceFromDB(source));
      
      // Create export object
      const exportData: ExportData = {
        dishes,
        mealHistory,
        sources,
        version: "1.0",
        exportDate: new Date().toISOString()
      };
      
      return exportData;
    } finally {
      setIsExporting(false);
    }
  };
  
  // Helper function to download JSON data
  const downloadExportFile = (data: ExportData) => {
    // Create a blob of the JSON data
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create an anchor element and trigger a download
    const a = document.createElement('a');
    a.href = url;
    a.download = `meal-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    isExporting,
    exportAllData,
    downloadExportFile
  };
}
