
import { useState } from "react";
import { Dish } from "@/types";
import { 
  supabase, 
  mapDishFromDB, 
  mapDishToDB,
  mapMealHistoryFromDB
} from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useDishes() {
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Query to fetch dishes from Supabase
  const { data: dishes = [] } = useQuery({
    queryKey: ['dishes'],
    queryFn: async (): Promise<Dish[]> => {
      try {
        // First get the dishes
        const { data: dishesData, error: dishesError } = await supabase
          .from('dishes')
          .select('*')
          .order('name');
        
        if (dishesError) throw dishesError;
        
        // Fetch meal history for all dishes
        const { data: historyData, error: historyError } = await supabase
          .from('meal_history')
          .select('*');
          
        if (historyError) throw historyError;
        
        // Group meal history by dish ID
        const historyByDishId: Record<string, any[]> = {};
        historyData.forEach(entry => {
          if (!historyByDishId[entry.dishid]) {
            historyByDishId[entry.dishid] = [];
          }
          historyByDishId[entry.dishid].push(entry);
        });
        
        // Map dishes with their meal history data
        const mappedDishes = dishesData.map(dish => 
          mapDishFromDB(dish, historyByDishId[dish.id] || [])
        );
        
        setIsLoading(false);
        return mappedDishes;
      } catch (error) {
        console.error("Error fetching dishes:", error);
        setIsLoading(false);
        return [];
      }
    }
  });

  // Mutation to add a new dish
  const addDishMutation = useMutation({
    mutationFn: async (dish: Omit<Dish, "id" | "createdAt" | "timesCooked" | "user_id">) => {
      const user = await supabase.auth.getUser();
      const user_id = user.data.user?.id;
      
      if (!user_id) throw new Error("User not authenticated");
      
      const newDish = {
        name: dish.name, // Ensure required field is present
        cuisines: dish.cuisines || ['Other'],
        timescooked: 0,
        createdat: new Date().toISOString(),
        source: dish.source,
        user_id
      };
      
      const { data, error } = await supabase
        .from('dishes')
        .insert(newDish)
        .select('*')
        .single();
        
      if (error) throw error;
      return mapDishFromDB(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
    }
  });

  // Mutation to update a dish
  const updateDishMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Dish> }) => {
      // Convert client model to DB model
      const dbUpdates = mapDishToDB(updates);
      delete dbUpdates.id; // Don't try to update the ID
      
      const { error } = await supabase
        .from('dishes')
        .update(dbUpdates)
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
    }
  });

  // Mutation to delete a dish
  const deleteDishMutation = useMutation({
    mutationFn: async (id: string) => {
      // First delete related meal history
      await supabase
        .from('meal_history')
        .delete()
        .eq('dishid', id);
        
      // Then delete the dish
      const { error } = await supabase
        .from('dishes')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
      queryClient.invalidateQueries({ queryKey: ['mealHistory'] });
    }
  });

  // Get dish by ID - only from Supabase, no localStorage fallback
  const getDish = async (id: string): Promise<Dish | null> => {
    try {
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
    addDish: (dish: Omit<Dish, "id" | "createdAt" | "timesCooked" | "user_id">) => addDishMutation.mutateAsync(dish),
    updateDish: (id: string, updates: Partial<Dish>) => updateDishMutation.mutateAsync({ id, updates }),
    deleteDish: (id: string) => deleteDishMutation.mutateAsync(id),
    getDish,
    getMealHistoryForDish
  };
}
