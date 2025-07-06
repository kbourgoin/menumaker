import { Dish, MealHistory } from "@/types";
import { supabase, mapDishFromDB } from "@/integrations/supabase/client";
import { measureAsync } from "@/utils/performance";

/**
 * Fetch dishes using optimized fallback method (when materialized view fails)
 * Reduces database queries by fetching all meal history in bulk
 */
export const fetchDishesOriginalMethod = async (
  user_id: string
): Promise<Dish[]> => {
  return await measureAsync("fallback-dishes-fetch", async () => {
    // Get all dishes for the user
    const dishesData = await measureAsync("fallback-dishes-query", async () => {
      const { data, error } = await supabase
        .from("dishes")
        .select("*")
        .eq("user_id", user_id)
        .order("name");

      if (error) throw error;
      return data || [];
    });

    if (dishesData.length === 0) {
      return [];
    }

    // Get dish IDs for bulk meal history fetch
    const dishIds = dishesData.map(dish => dish.id);

    // Fetch ALL meal history for all dishes in one query (more efficient)
    const allMealHistory = await measureAsync(
      "fallback-history-query",
      async () => {
        const { data, error } = await supabase
          .from("meal_history")
          .select("*")
          .in("dishid", dishIds)
          .order("date", { ascending: false });

        if (error) {
          console.warn("Error fetching meal history in fallback:", error);
          return [];
        }

        return data || [];
      }
    );

    // Group meal history by dish ID for efficient lookup
    const historyByDishId = new Map<string, MealHistory[]>();
    allMealHistory.forEach(history => {
      const dishId = history.dishid;
      if (!historyByDishId.has(dishId)) {
        historyByDishId.set(dishId, []);
      }
      historyByDishId.get(dishId)!.push({
        id: String(history.id),
        dishId: history.dishid,
        date: history.date,
        notes: history.notes || undefined,
        user_id: history.user_id,
      });
    });

    // Map dishes with their history (now in memory, no more DB queries)
    return dishesData.map(dish => {
      const dishHistory = historyByDishId.get(dish.id) || [];
      return mapDishFromDB(dish, dishHistory);
    });
  });
};

/**
 * Fetches a single dish by its ID with performance monitoring
 */
export const fetchDishById = async (id: string): Promise<Dish | null> => {
  return await measureAsync(`fetch-dish-${id}`, async () => {
    // Fetch dish data
    const dishData = await measureAsync("single-dish-query", async () => {
      const { data, error } = await supabase
        .from("dishes")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    });

    if (!dishData) {
      return null;
    }

    // Fetch meal history for this dish
    const historyData = await measureAsync("single-dish-history", async () => {
      const { data, error } = await supabase
        .from("meal_history")
        .select("*")
        .eq("dishid", id)
        .order("date", { ascending: false });

      if (error) {
        console.warn("Error fetching meal history for dish:", id, error);
        return [];
      }

      return data || [];
    });

    return mapDishFromDB(dishData, historyData);
  });
};

/**
 * Fetches meal history for a specific dish with performance monitoring
 */
export const fetchMealHistoryForDish = async (
  dishId: string
): Promise<MealHistory[]> => {
  return await measureAsync(`meal-history-${dishId}`, async () => {
    const { data, error } = await supabase
      .from("meal_history")
      .select("*")
      .eq("dishid", dishId)
      .order("date", { ascending: false });

    if (error) throw error;

    if (!data) return [];

    // Map to proper MealHistory type with all required properties
    return data.map(history => ({
      id: String(history.id),
      dishId: history.dishid,
      date: history.date,
      notes: history.notes || undefined,
      user_id: history.user_id,
    }));
  });
};
