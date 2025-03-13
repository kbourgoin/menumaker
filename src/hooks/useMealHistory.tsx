
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

  // Get meal history for a dish with pagination to handle 1000 row limit
  const getMealHistoryForDish = async (dishId: string) => {
    let allHistory = [];
    let hasMoreEntries = true;
    let lastDate = null;
    
    while (hasMoreEntries) {
      let query = supabase
        .from('meal_history')
        .select('*')
        .eq('dishid', dishId)
        .order('date', { ascending: false });
      
      // Apply pagination if we have a lastDate
      if (lastDate) {
        query = query.lt('date', lastDate);
      }
      
      // Limit to max rows per query
      query = query.limit(1000);
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // If we got data, add it to our results
      if (data && data.length > 0) {
        allHistory = [...allHistory, ...data.map(entry => ({
          date: entry.date,
          notes: entry.notes
        }))];
        
        // Update lastDate for next page
        lastDate = data[data.length - 1].date;
        
        // If we got fewer rows than the limit, we've reached the end
        if (data.length < 1000) {
          hasMoreEntries = false;
        }
      } else {
        hasMoreEntries = false;
      }
    }
    
    return allHistory;
  };

  // Get count of entries for a dish - account for 1000 row limit with count queries
  const getTimesCooked = async (dishId: string) => {
    let totalCount = 0;
    let hasMoreEntries = true;
    let lastDate = null;
    
    while (hasMoreEntries) {
      let query = supabase
        .from('meal_history')
        .select('id', { count: 'exact', head: true })
        .eq('dishid', dishId);
      
      // Apply pagination if we have a lastDate
      if (lastDate) {
        query = query.lt('date', lastDate);
      }
      
      // Limit to max rows per query
      query = query.limit(1000);
      
      const { count, error, data } = await query;
      
      if (error) throw error;
      
      if (count !== null) {
        totalCount += count;
      }
      
      // Check if we need another page by getting the last date
      if (count === 1000) {
        // We need to get the actual data to find the last date
        const { data: dateData } = await supabase
          .from('meal_history')
          .select('date')
          .eq('dishid', dishId)
          .order('date', { ascending: false })
          .limit(1000);
          
        if (dateData && dateData.length > 0) {
          lastDate = dateData[dateData.length - 1].date;
        } else {
          hasMoreEntries = false;
        }
      } else {
        hasMoreEntries = false;
      }
    }
    
    return totalCount;
  };

  return {
    recordDishCooked: (dishId: string, date?: string, notes?: string) => 
      recordDishCookedMutation.mutateAsync({ dishId, date, notes }),
    getMealHistoryForDish,
    getTimesCooked
  };
}
