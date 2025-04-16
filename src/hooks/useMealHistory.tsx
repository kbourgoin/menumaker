
import { MealHistory } from "@/types";
import { 
  supabase, 
  mapMealHistoryFromDB, 
  mapMealHistoryToDB 
} from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useMealHistory() {
  const queryClient = useQueryClient();

  // Get meal history for a dish
  const getMealHistoryForDish = async (dishId: string) => {
    try {
      const { data, error } = await supabase
        .from('meal_history')
        .select('*')
        .eq('dishid', dishId)
        .order('date', { ascending: false });
        
      if (error) throw error;
      
      // Make sure to include id in the returned objects
      return data.map(history => ({
        id: history.id,
        date: history.date,
        notes: history.notes
      }));
    } catch (error) {
      console.error("Error getting meal history:", error);
      return [];
    }
  };

  // Record a dish as cooked
  const recordDishCookedMutation = useMutation({
    mutationFn: async ({ 
      dishId, 
      date, 
      notes 
    }: { 
      dishId: string;
      date: string;
      notes?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const user_id = userData.user?.id;
      
      if (!user_id) throw new Error("User not authenticated");
      
      const mealHistoryEntry = {
        dishid: dishId,
        date,
        notes,
        user_id
      };
      
      const { data, error } = await supabase
        .from('meal_history')
        .insert(mealHistoryEntry)
        .select()
        .single();
        
      if (error) throw error;
      
      return mapMealHistoryFromDB(data);
    },
    onSuccess: () => {
      // Invalidate multiple queries to ensure all related data is refreshed
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
      queryClient.invalidateQueries({ queryKey: ['mealHistory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['suggestedDishes'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    }
  });

  // Delete a meal history entry
  const deleteMealHistoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('meal_history')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
      queryClient.invalidateQueries({ queryKey: ['mealHistory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['suggestedDishes'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    }
  });

  // Update a meal history entry
  const updateMealHistoryMutation = useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: { date: string; notes?: string }; 
    }) => {
      const { error } = await supabase
        .from('meal_history')
        .update(updates)
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
      queryClient.invalidateQueries({ queryKey: ['mealHistory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['suggestedDishes'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    }
  });

  return {
    getMealHistoryForDish,
    recordDishCooked: (dishId: string, date: string, notes?: string) => 
      recordDishCookedMutation.mutateAsync({ dishId, date, notes }),
    deleteMealHistory: (id: string) => 
      deleteMealHistoryMutation.mutateAsync(id),
    updateMealHistory: (id: string, updates: { date: string; notes?: string }) =>
      updateMealHistoryMutation.mutateAsync({ id, updates })
  };
}
