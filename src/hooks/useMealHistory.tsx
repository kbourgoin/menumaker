
import { 
  supabase, 
  mapMealHistoryFromDB, 
  mapMealHistoryToDB 
} from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useMealHistory() {
  const queryClient = useQueryClient();

  // Mutation to record a dish was cooked
  const recordDishCookedMutation = useMutation({
    mutationFn: async ({ dishId, date = new Date().toISOString(), notes }: { dishId: string, date?: string, notes?: string }) => {
      const user = await supabase.auth.getUser();
      const user_id = user.data.user?.id;
      
      if (!user_id) throw new Error("User not authenticated");
      
      // Add to meal history
      const historyEntry = {
        dishid: dishId, // Ensure required field is present
        date,
        notes,
        user_id
      };
      
      const { error: historyError } = await supabase
        .from('meal_history')
        .insert(historyEntry);
      
      if (historyError) throw historyError;
      
      // First get the current times cooked value
      const { data: dish, error: fetchError } = await supabase
        .from('dishes')
        .select('timescooked')
        .eq('id', dishId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Calculate new count
      const newCount = (dish?.timescooked || 0) + 1;
      
      // Update dish data (set lastMade and increment timesCooked)
      const { error: dishError } = await supabase
        .from('dishes')
        .update({ 
          lastmade: date,
          timescooked: newCount // Now using a number value directly
        })
        .eq('id', dishId);
      
      if (dishError) throw dishError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
      queryClient.invalidateQueries({ queryKey: ['mealHistory'] });
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

  return {
    recordDishCooked: (dishId: string, date?: string, notes?: string) => 
      recordDishCookedMutation.mutateAsync({ dishId, date, notes }),
    getMealHistoryForDish
  };
}
