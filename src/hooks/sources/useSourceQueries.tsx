
import { Source, Dish } from "@/types";
import { supabase, mapSourceFromDB, mapDishFromDB } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export function useSourceQueries() {
  // Get all sources with React Query
  const { 
    data: sources = [], 
    isLoading: isLoadingSources, 
    error: sourcesError 
  } = useQuery({
    queryKey: ['sources'],
    queryFn: async (): Promise<Source[]> => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user_id = userData.user?.id;
        
        if (!user_id) return [];
        
        const { data, error } = await supabase
          .from('sources')
          .select('*')
          .eq('user_id', user_id)
          .order('name');
          
        if (error) {
          console.error('Error fetching sources:', error);
          return [];
        }
        
        return data ? data.map(mapSourceFromDB) : [];
      } catch (error) {
        console.error('Error in sources query:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Get a single source by ID
  const getSource = async (id: string): Promise<Source | null> => {
    if (!id) return null;
    
    try {
      const { data, error } = await supabase
        .from('sources')
        .select('*')
        .eq('id', id)
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching source:', error);
        return null;
      }
      
      return data ? mapSourceFromDB(data) : null;
    } catch (error) {
      console.error('Error fetching source:', error);
      return null;
    }
  };

  // Get all dishes associated with a source
  const getDishesBySource = async (sourceId: string): Promise<Dish[]> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user_id = userData.user?.id;
      
      if (!user_id || !sourceId) return [];
      
      const { data: dishesData, error } = await supabase
        .from('dishes')
        .select('*')
        .eq('source_id', sourceId)
        .eq('user_id', user_id)
        .order('name');
        
      if (error) {
        console.error('Error fetching dishes by source:', error);
        return [];
      }
      
      // Get meal history for these dishes
      const dishIds = dishesData.map(dish => dish.id);
      let mealHistoryByDish: Record<string, any[]> = {};
      
      if (dishIds.length > 0) {
        const { data: historyData, error: historyError } = await supabase
          .from('meal_history')
          .select('*')
          .in('dishid', dishIds);
          
        if (historyError) {
          console.error('Error fetching meal history:', historyError);
        } else if (historyData) {
          // Group history by dish ID
          mealHistoryByDish = historyData.reduce((acc, history) => {
            if (!acc[history.dishid]) {
              acc[history.dishid] = [];
            }
            acc[history.dishid].push(history);
            return acc;
          }, {} as Record<string, any[]>);
        }
      }
      
      return dishesData.map(dish => mapDishFromDB(dish, mealHistoryByDish[dish.id] || []));
    } catch (error) {
      console.error('Error in getDishesBySource:', error);
      return [];
    }
  };

  // Check if source with the same name exists
  const findSourceByName = async (name: string, excludeId?: string): Promise<Source | null> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user_id = userData.user?.id;
      
      if (!user_id) return null;
      
      const query = supabase
        .from('sources')
        .select('*')
        .eq('user_id', user_id)
        .ilike('name', name);
        
      // Exclude the current source if editing
      if (excludeId) {
        query.neq('id', excludeId);
      }
      
      const { data, error } = await query.maybeSingle();
        
      if (error) {
        console.error('Error finding source by name:', error);
        return null;
      }
      
      return data ? mapSourceFromDB(data) : null;
    } catch (error) {
      console.error('Error in findSourceByName:', error);
      return null;
    }
  };

  return {
    sources,
    isLoadingSources,
    sourcesError,
    getSources: async (): Promise<Source[]> => sources || [],
    getSource,
    getDishesBySource,
    findSourceByName
  };
}
