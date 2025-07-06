import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { operationLog, errorLog } from "@/utils/logger";

export function useClearData() {
  const queryClient = useQueryClient();

  // Clear all data
  const clearData = async () => {
    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;

      if (!userId) throw new Error("User not authenticated");

      operationLog(`Clearing data for user: ${userId}`, "Data");

      // Call the updated stored procedure
      const { error } = await supabase.rpc("clear_user_data", {
        p_user_id: userId,
      });

      if (error) {
        errorLog("Error clearing data", "Data", error);
        throw error;
      }

      // Invalidate ALL queries to ensure UI is refreshed
      queryClient.invalidateQueries();

      operationLog("All data cleared successfully", "Data");
      return { success: true };
    } catch (error) {
      errorLog("Error clearing data", "Data", error);
      return { success: false, error };
    }
  };

  return {
    clearData,
  };
}
