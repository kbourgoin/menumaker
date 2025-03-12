
import { 
  supabase, 
  mapMealHistoryFromDB, 
  mapMealHistoryToDB 
} from "@/integrations/supabase/client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";

export function useMealHistory() {
  const queryClient = useQueryClient();

  // Mutation to record a dish was cooked
  const recordDishCookedMutation = useMutation({
    mutationFn: async ({ dishId, date = new Date().toISOString(), notes }: { dishId: string, date?: string, notes?: string }) => {
      const user = await supabase.auth.getUser();
      const user_id = user.data.user?.id;
      
      if (!user_id) throw new Error("User not authenticated");
      
      // Add to meal history only
      const historyEntry = {
        dishid: dishId,
        date,
        notes,
        user_id
      };
      
      const { error } = await supabase
        .from('meal_history')
        .insert(historyEntry);
      
      if (error) throw error;
      
      // No need to update lastmade or timescooked in the dish table anymore
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
      queryClient.invalidateQueries({ queryKey: ['mealHistory'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    }
  });

  // Get meal history for a dish
  const getMealHistoryForDish = async (dishId: string) => {
    const { data, error } = await supabase
      .from('meal_history')
      .select('*')
      .eq('dishid', dishId)
      .order('date', { ascending: false });
      
    if (error) throw error;
    return data.map(entry => ({
      date: entry.date,
      notes: entry.notes
    }));
  };

  // Get count of entries for a dish
  const getTimesCooked = async (dishId: string) => {
    const { count, error } = await supabase
      .from('meal_history')
      .select('*', { count: 'exact', head: true })
      .eq('dishid', dishId);
      
    if (error) throw error;
    return count || 0;
  };

  return {
    recordDishCooked: (dishId: string, date?: string, notes?: string) => 
      recordDishCookedMutation.mutateAsync({ dishId, date, notes }),
    getMealHistoryForDish,
    getTimesCooked
  };
}
