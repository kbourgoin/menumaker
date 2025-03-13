
import { useState } from "react";
import { Dish } from "@/types";
import { 
  supabase, 
  mapDishFromDB, 
  mapDishFromSummary
} from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

/**
 * Hook that provides query functions for dishes
 */
export function useDishQueries() {
  const [isLoading, setIsLoading] = useState(true);

  // Query to fetch dishes from the materialized view for better performance (READ ONLY)
  const { data: dishes = [] } = useQuery({
    queryKey: ['dishes'],
    queryFn: async (): Promise<Dish[]> => {
      try {
        const user = await supabase.auth.getUser();
        const user_id = user.data.user?.id;
        
        if (!user_id) {
          setIsLoading(false);
          return [];
        }
        
        try {
          // Get dishes from the materialized view (READ ONLY)
          const { data: summaryData, error: summaryError } = await supabase
            .from('dish_summary')
            .select('*')
            .eq('user_id', user_id)
            .order('name');
          
          if (summaryError) {
            console.error("Error fetching from dish_summary:", summaryError);
            // Fallback to the original method if materialized view fails
            return await fetchDishesOriginalMethod(user_id);
          }
          
          if (!summaryData) {
            setIsLoading(false);
            return [];
          }
          
          // Map the summary data to our Dish type
          const mappedDishes = summaryData.map(summary => mapDishFromSummary(summary));
          
          setIsLoading(false);
          return mappedDishes;
        } catch (viewError) {
          console.error("Error with dish_summary view:", viewError);
          // Fallback if there's any issue with the view
          return await fetchDishesOriginalMethod(user_id);
        }
      } catch (error) {
        console.error("Error fetching dishes:", error);
        setIsLoading(false);
        return [];
      }
    },
    // Enable caching to improve performance
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Improved error handling
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Get dish by ID - only from Supabase, no localStorage fallback
  const getDish = async (id: string): Promise<Dish | null> => {
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

  // Get meal history for a dish
  const getMealHistoryForDish = async (dishId: string) => {
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

  return {
    dishes,
    isLoading,
    getDish,
    getMealHistoryForDish
  };
}

// Fallback method if the materialized view fails - extracted as a separate function
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
