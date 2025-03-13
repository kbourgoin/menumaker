
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
      
      return data.map(history => ({
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
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
      queryClient.invalidateQueries({ queryKey: ['mealHistory'] });
    }
  });

  return {
    getMealHistoryForDish,
    recordDishCooked: (dishId: string, date: string, notes?: string) => 
      recordDishCookedMutation.mutateAsync({ dishId, date, notes })
  };
}
