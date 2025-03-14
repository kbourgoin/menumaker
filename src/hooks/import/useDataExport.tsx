
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
      
      // Fetch all dishes with pagination to overcome any limits
      let allDishes: any[] = [];
      let hasMoreDishes = true;
      let lastDishId: string | null = null;
      
      while (hasMoreDishes) {
        let query = supabase
          .from('dishes')
          .select('*')
          .eq('user_id', userId)
          .order('id', { ascending: true })
          .limit(1000);
        
        if (lastDishId) {
          query = query.gt('id', lastDishId);
        }
        
        const { data: dishesPage, error: dishesError } = await query;
        
        if (dishesError) throw dishesError;
        
        if (dishesPage && dishesPage.length > 0) {
          allDishes = [...allDishes, ...dishesPage];
          lastDishId = dishesPage[dishesPage.length - 1].id;
          
          if (dishesPage.length < 1000) {
            hasMoreDishes = false;
          }
        } else {
          hasMoreDishes = false;
        }
      }
      
      console.log(`Exported ${allDishes.length} dishes`);
      
      // Fetch all meal history with pagination
      let allMealHistory: any[] = [];
      let hasMoreHistory = true;
      let lastHistoryId: string | null = null;
      
      while (hasMoreHistory) {
        let query = supabase
          .from('meal_history')
          .select('*')
          .eq('user_id', userId)
          .order('id', { ascending: true })
          .limit(1000);
        
        if (lastHistoryId) {
          query = query.gt('id', lastHistoryId);
        }
        
        const { data: historyPage, error: historyError } = await query;
        
        if (historyError) throw historyError;
        
        if (historyPage && historyPage.length > 0) {
          allMealHistory = [...allMealHistory, ...historyPage];
          lastHistoryId = historyPage[historyPage.length - 1].id;
          
          if (historyPage.length < 1000) {
            hasMoreHistory = false;
          }
        } else {
          hasMoreHistory = false;
        }
      }
      
      console.log(`Exported ${allMealHistory.length} meal history entries`);
      
      // Fetch all sources with pagination
      let allSources: any[] = [];
      let hasMoreSources = true;
      let lastSourceId: string | null = null;
      
      while (hasMoreSources) {
        let query = supabase
          .from('sources')
          .select('*')
          .eq('user_id', userId)
          .order('id', { ascending: true })
          .limit(1000);
        
        if (lastSourceId) {
          query = query.gt('id', lastSourceId);
        }
        
        const { data: sourcesPage, error: sourcesError } = await query;
        
        if (sourcesError) throw sourcesError;
        
        if (sourcesPage && sourcesPage.length > 0) {
          allSources = [...allSources, ...sourcesPage];
          lastSourceId = sourcesPage[sourcesPage.length - 1].id;
          
          if (sourcesPage.length < 1000) {
            hasMoreSources = false;
          }
        } else {
          hasMoreSources = false;
        }
      }
      
      console.log(`Exported ${allSources.length} sources`);
      
      // Map data to our app types
      const dishes = allDishes.map(dish => mapDishFromDB(dish));
      const mealHistory = allMealHistory.map(history => mapMealHistoryFromDB(history));
      const sources = allSources.map(source => mapSourceFromDB(source));
      
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
