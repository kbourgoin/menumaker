
import { Dish } from "@/types";
import { 
  supabase, 
  mapDishFromDB, 
  mapDishToDB 
} from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Hook that provides mutation functions for dishes
 */
export function useDishMutations() {
  const queryClient = useQueryClient();

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

  return {
    addDish: (dish: Omit<Dish, "id" | "createdAt" | "timesCooked" | "user_id">) => addDishMutation.mutateAsync(dish),
    updateDish: (id: string, updates: Partial<Dish>) => updateDishMutation.mutateAsync({ id, updates }),
    deleteDish: (id: string) => deleteDishMutation.mutateAsync(id)
  };
}
