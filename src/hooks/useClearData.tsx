
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useClearData() {
  const queryClient = useQueryClient();

  // Clear all data
  const clearData = async () => {
    try {
      const user = await supabase.auth.getUser();
      const user_id = user.data.user?.id;
      
      if (!user_id) throw new Error("User not authenticated");
      
      console.log("Clearing data for user:", user_id);
      
      // Use a single transaction for deleting all user data
      // This avoids issues with the materialized view refresh triggers
      // Using a raw query with the function call since TypeScript doesn't know about our custom function
      const { error } = await supabase.rpc('clear_user_data', { user_id: user_id }) as any;
      
      if (error) {
        console.error("Error clearing data:", error);
        throw error;
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
