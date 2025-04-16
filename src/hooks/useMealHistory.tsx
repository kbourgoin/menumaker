
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
  const getMealHistoryForDish = async (dishId: string): Promise<MealHistory[]> => {
    try {
      const { data, error } = await supabase
        .from('meal_history')
        .select('*')
        .eq('dishid', dishId)
        .order('date', { ascending: false });
        
      if (error) throw error;
      
      if (!data || data.length === 0) return [];
      
      // Map database records to MealHistory objects with proper typing
      return data.map(history => {
        return {
          id: String(history.id), // Ensure id is a string
          dishId: history.dishid,
          date: history.date,
          notes: history.notes || undefined,
          user_id: history.user_id
        };
      });
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
      console.log("Deleting meal history entry with ID:", id);
      const { error } = await supabase
        .from('meal_history')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error("Error deleting meal history:", error);
        throw error;
      }
      
      console.log("Successfully deleted meal history entry");
      return id;
    },
    onSuccess: () => {
      console.log("Invalidating queries after delete");
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
      
      return { id, ...updates };
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
    recordDishCooked: async (dishId: string, date: string, notes?: string) => 
      await recordDishCookedMutation.mutateAsync({ dishId, date, notes }),
    deleteMealHistory: async (id: string) => 
      await deleteMealHistoryMutation.mutateAsync(id),
    updateMealHistory: async (id: string, updates: { date: string; notes?: string }) =>
      await updateMealHistoryMutation.mutateAsync({ id, updates })
  };
}
