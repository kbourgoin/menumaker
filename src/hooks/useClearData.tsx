
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useClearData() {
  const queryClient = useQueryClient();

  // Clear all data
  const clearData = async () => {
    try {
      const user = await supabase.auth.getUser();
      const user_id = user.data.user?.id;
      
      if (!user_id) throw new Error("User not authenticated");
      
      console.log("Clearing data for user:", user_id);
      
      // Delete all data in reverse order of dependencies
      const { error: mealHistoryError } = await supabase
        .from('meal_history')
        .delete()
        .eq('user_id', user_id);
        
      if (mealHistoryError) {
        console.error("Error deleting meal history:", mealHistoryError);
        throw mealHistoryError;
      }
      
      const { error: dishesError } = await supabase
        .from('dishes')
        .delete()
        .eq('user_id', user_id);
        
      if (dishesError) {
        console.error("Error deleting dishes:", dishesError);
        throw dishesError;
      }
      
      const { error: cookbooksError } = await supabase
        .from('cookbooks')
        .delete()
        .eq('user_id', user_id);
        
      if (cookbooksError) {
        console.error("Error deleting cookbooks:", cookbooksError);
        throw cookbooksError;
      }
      
      // Invalidate ALL queries to ensure UI is refreshed
      queryClient.invalidateQueries();
      
      console.log("All data cleared successfully");
      return { success: true };
    } catch (error) {
      console.error("Error clearing data:", error);
      return { success: false, error };
    }
  };

  return {
    clearData
  };
}
