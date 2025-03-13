
import { Dish } from "@/types";
import { supabase, mapDishFromDB, mapDishFromSummary } from "@/integrations/supabase/client";

/**
 * Fetch dishes using the original method (fallback if materialized view fails)
 */
export const fetchDishesOriginalMethod = async (user_id: string): Promise<Dish[]> => {
  try {
    // First get the dishes directly from the dishes table
    const { data: dishesData, error: dishesError } = await supabase
      .from('dishes')
      .select('*')
      .eq('user_id', user_id)
      .order('name');
    
    if (dishesError) throw dishesError;
    
    // Create an array to store all mapped dishes
    const mappedDishes: Dish[] = [];
    
    // Process each dish one by one to avoid hitting the 1000 row limit for all meal history at once
    for (const dish of dishesData) {
      // For each dish, get its meal history with pagination to handle the 1000 row limit
      let historyForDish: any[] = [];
      let hasMoreEntries = true;
      let lastDate = null;
      
      while (hasMoreEntries) {
        let query = supabase
          .from('meal_history')
          .select('*')
          .eq('dishid', dish.id)
          .order('date', { ascending: false });
        
        // Apply pagination if we have a lastDate
        if (lastDate) {
          query = query.lt('date', lastDate);
        }
        
        // Limit to max rows per query
        query = query.limit(1000);
        
        const { data: historyPage, error: historyError } = await query;
        
        if (historyError) {
          console.error("Error fetching meal history for dish:", dish.id, historyError);
          break;
        }
        
        // If we got data, add it to our results
        if (historyPage && historyPage.length > 0) {
          historyForDish = [...historyForDish, ...historyPage];
          
          // Update lastDate for next page
          lastDate = historyPage[historyPage.length - 1].date;
          
          // If we got fewer rows than the limit, we've reached the end
          if (historyPage.length < 1000) {
            hasMoreEntries = false;
          }
        } else {
          hasMoreEntries = false;
        }
      }
      
      // Map the dish with its complete history
      mappedDishes.push(mapDishFromDB(dish, historyForDish));
    }
    
    return mappedDishes;
  } catch (error) {
    console.error("Error in fallback method:", error);
    return [];
  }
};

/**
 * Fetches a single dish by its ID
 */
export const fetchDishById = async (id: string): Promise<Dish | null> => {
  try {
    // Always read directly from the dishes table for a single dish (not the view)
    const { data, error } = await supabase
      .from('dishes')
      .select('*')
      .eq('id', id)
      .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no results
    
    if (error) {
      console.error("Error fetching dish:", error);
      throw error;
    }
    
    if (data) {
      // Fetch meal history for this dish
      const { data: historyData, error: historyError } = await supabase
        .from('meal_history')
        .select('*')
        .eq('dishid', id);
        
      if (historyError) {
        console.error("Error fetching meal history:", historyError);
        return mapDishFromDB(data); // Return dish without history data
      }
      
      return mapDishFromDB(data, historyData);
    }
    
    console.log("No dish found with ID:", id);
    return null;
  } catch (error) {
    console.error("Error getting dish:", error);
    return null;
  }
};

/**
 * Fetches meal history for a specific dish
 */
export const fetchMealHistoryForDish = async (dishId: string) => {
  try {
    const { data, error } = await supabase
      .from('meal_history')
      .select('*')
      .eq('dishid', dishId)
      .order('date', { ascending: false });
      
    if (error) throw error;
    
    return data.map(history => ({
      date: history.date,
      notes: history.notes
    }));
  } catch (error) {
    console.error("Error getting meal history:", error);
    return [];
  }
};
