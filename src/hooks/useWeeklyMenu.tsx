import { useState, useCallback } from "react";
import { supabase, mapDishFromSummary } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { fetchDishesOriginalMethod } from "./dish";
import {
  getCategorizedSuggestions,
  refreshCategory,
  SuggestionCategory,
} from "@/utils/suggestionUtils";

export function useWeeklyMenu() {
  const [categories, setCategories] = useState<SuggestionCategory[]>([]);

  // Get dish data using React Query and the materialized view
  const { data: allDishes = [], isLoading } = useQuery({
    queryKey: ["dishes"],
    queryFn: async () => {
      const user = await supabase.auth.getUser();
      const user_id = user.data.user?.id;

      if (!user_id) {
        return [];
      }

      try {
        const { data: summaryData, error: summaryError } = await supabase
          .from("dish_summary_secure")
          .select("*");

        if (summaryError) {
          console.error(
            "Error fetching from dish_summary_secure:",
            summaryError
          );
          return await fetchDishesOriginalMethod(user_id);
        }

        return summaryData
          ? summaryData.map(summary => mapDishFromSummary(summary))
          : [];
      } catch (error) {
        console.error("Error in useWeeklyMenu query:", error);
        return [];
      }
    },
    staleTime: 30 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Generate categorized suggestions
  const generateSuggestions = useCallback(() => {
    if (!allDishes || allDishes.length === 0) {
      setCategories([]);
      return;
    }
    const newCategories = getCategorizedSuggestions(allDishes, 3);
    setCategories(newCategories);
  }, [allDishes]);

  // Refresh a single category with new random picks
  const shuffleCategory = useCallback(
    (categoryId: string) => {
      if (!allDishes || allDishes.length === 0) return;

      setCategories(prev =>
        prev.map(cat =>
          cat.id === categoryId
            ? { ...cat, dishes: refreshCategory(allDishes, categoryId, 3) }
            : cat
        )
      );
    },
    [allDishes]
  );

  // Check if suggestions have been generated
  const hasCategories = categories.length > 0;

  return {
    allDishes,
    isLoading,
    categories,
    hasCategories,
    generateSuggestions,
    shuffleCategory,
  };
}

// Re-export the type for convenience
export type { SuggestionCategory };
