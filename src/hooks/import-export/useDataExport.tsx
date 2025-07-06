import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dish, MealHistory, Source } from "@/types";
import { Tables } from "@/integrations/supabase/types";
import { DishSummary } from "@/integrations/supabase/mappers/types";
import {
  mapDishFromSummary,
  mapMealHistoryFromDB,
  mapSourceFromDB,
} from "@/integrations/supabase/client";
import { operationLog, debugLog } from "@/utils/logger";

export interface ExportData {
  dishes: Dish[];
  mealHistory: MealHistory[];
  sources: Source[];
  profile?: Tables<"profiles">;
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

      // Fetch all dishes with tags from dish_summary_secure view with pagination
      let allDishes: Tables<"dish_summary">[] = [];
      let hasMoreDishes = true;
      let lastDishId: string | null = null;

      while (hasMoreDishes) {
        let query = supabase
          .from("dish_summary_secure")
          .select("*")
          .order("id", { ascending: true })
          .limit(1000);

        if (lastDishId) {
          query = query.gt("id", lastDishId);
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

      operationLog(`Exported ${allDishes.length} dishes`, "Export");

      // Fetch all meal history with pagination
      let allMealHistory: Tables<"meal_history">[] = [];
      let hasMoreHistory = true;
      let lastHistoryId: string | null = null;

      while (hasMoreHistory) {
        let query = supabase
          .from("meal_history")
          .select("*")
          .eq("user_id", userId)
          .order("id", { ascending: true })
          .limit(1000);

        if (lastHistoryId) {
          query = query.gt("id", lastHistoryId);
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

      operationLog(
        `Exported ${allMealHistory.length} meal history entries`,
        "Export"
      );

      // Fetch all sources with pagination
      let allSources: Tables<"sources">[] = [];
      let hasMoreSources = true;
      let lastSourceId: string | null = null;

      while (hasMoreSources) {
        let query = supabase
          .from("sources")
          .select("*")
          .eq("user_id", userId)
          .order("id", { ascending: true })
          .limit(1000);

        if (lastSourceId) {
          query = query.gt("id", lastSourceId);
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

      operationLog(`Exported ${allSources.length} sources`, "Export");

      // Fetch user profile to include all user data with dates
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      // Map data to our app types
      const dishes = allDishes.map(dish =>
        mapDishFromSummary({
          id: dish.id!,
          name: dish.name!,
          createdat: dish.createdat!,
          cuisines: dish.cuisines || [],
          source_id: dish.source_id || undefined,
          location: dish.location || undefined,
          user_id: dish.user_id!,
          times_cooked: dish.times_cooked || 0,
          last_made: dish.last_made || undefined,
          last_comment: dish.last_comment || undefined,
          tags: dish.tags || [],
        })
      );
      const mealHistory = allMealHistory.map(history =>
        mapMealHistoryFromDB(history)
      );
      const sources = allSources.map(source => mapSourceFromDB(source));

      // Create export object
      const exportData: ExportData = {
        dishes,
        mealHistory,
        sources,
        profile: profile || undefined,
        version: "1.0",
        exportDate: new Date().toISOString(),
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
    const blob = new Blob([jsonString], { type: "application/json" });

    // Create a URL for the blob
    const url = URL.createObjectURL(blob);

    // Create an anchor element and trigger a download
    const a = document.createElement("a");
    a.href = url;
    a.download = `meal-tracker-export-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();

    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    isExporting,
    exportAllData,
    downloadExportFile,
  };
}
