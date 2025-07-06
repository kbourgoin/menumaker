import { Dish, MealHistory } from "@/types";
import { supabase, mapDishFromDB, mapDishFromSummary } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

/**
 * Optimized dish fetching that avoids N+1 queries by batching meal history requests
 */
export const fetchDishesOptimized = async (user_id: string): Promise<Dish[]> => {
  try {
    // First, get all dishes for the user
    const { data: dishesData, error: dishesError } = await supabase
      .from('dishes')
      .select('*')
      .eq('user_id', user_id)
      .order('name');
    
    if (dishesError) throw dishesError;
    if (!dishesData || dishesData.length === 0) return [];

    // Get all dish IDs for batch querying
    const dishIds = dishesData.map(dish => dish.id);
    
    // Fetch ALL meal history for ALL dishes in batches to avoid N+1 queries
    let allMealHistory: Tables<'meal_history'>[] = [];
    const batchSize = 1000; // Supabase row limit per query
    let hasMoreHistory = true;
    let lastDate: string | null = null;

    while (hasMoreHistory) {
      let query = supabase
        .from('meal_history')
        .select('*')
        .in('dishid', dishIds)
        .order('date', { ascending: false });
      
      // Apply pagination if we have a lastDate
      if (lastDate) {
        query = query.lt('date', lastDate);
      }
      
      query = query.limit(batchSize);
      
      const { data: historyBatch, error: historyError } = await query;
      
      if (historyError) {
        console.error("Error fetching meal history batch:", historyError);
        break;
      }
      
      if (historyBatch && historyBatch.length > 0) {
        allMealHistory = [...allMealHistory, ...historyBatch];
        
        // Update lastDate for next pagination
        lastDate = historyBatch[historyBatch.length - 1].date;
        
        // If we got fewer rows than the limit, we've reached the end
        if (historyBatch.length < batchSize) {
          hasMoreHistory = false;
        }
      } else {
        hasMoreHistory = false;
      }
    }

    // Group meal history by dish ID for efficient lookup
    const historyByDishId = allMealHistory.reduce((acc, history) => {
      if (!acc[history.dishid]) {
        acc[history.dishid] = [];
      }
      acc[history.dishid].push(history);
      return acc;
    }, {} as Record<string, Tables<'meal_history'>[]>);

    // Map all dishes with their respective meal history
    const mappedDishes = dishesData.map(dish => 
      mapDishFromDB(dish, historyByDishId[dish.id] || [])
    );
    
    return mappedDishes;
  } catch (error) {
    console.error("Error in optimized dish fetch:", error);
    return [];
  }
};

/**
 * Optimized dish fetching using the secure materialized view (preferred method)
 */
export const fetchDishesFromView = async (user_id: string): Promise<Dish[]> => {
  try {
    const { data, error } = await supabase
      .from('dish_summary_secure')
      .select('*')
      .order('name');
      
    if (error) {
      console.error("Error fetching from dish_summary_secure view:", error);
      // Fallback to optimized fetch instead of the N+1 query method
      return fetchDishesOptimized(user_id);
    }
    
    if (!data) return [];
    
    // Map the view data to Dish objects using centralized mapping
    return data.map(dish => mapDishFromSummary(dish));
  } catch (error) {
    console.error("Error fetching dishes from view:", error);
    // Fallback to optimized fetch
    return fetchDishesOptimized(user_id);
  }
};

/**
 * Main entry point for dish fetching with automatic fallback
 */
export const fetchDishesWithFallback = async (user_id: string): Promise<Dish[]> => {
  try {
    // Try the materialized view first (most efficient)
    return await fetchDishesFromView(user_id);
  } catch (error) {
    console.error("View fetch failed, using optimized fallback:", error);
    // If view fails, use optimized batch fetching instead of N+1 queries
    return fetchDishesOptimized(user_id);
  }
};