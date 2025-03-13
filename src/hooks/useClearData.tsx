
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useClearData() {
  const queryClient = useQueryClient();

  // Clear all data
  const clearData = async () => {
    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;
      
      if (!userId) throw new Error("User not authenticated");
      
      console.log("Clearing data for user:", userId);
      
      // Change the parameter name to p_user_id to avoid ambiguity with column names
      const { error } = await supabase.rpc('clear_user_data', { 
        p_user_id: userId  // Changed parameter name to avoid ambiguity
      }) as any;
      
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
