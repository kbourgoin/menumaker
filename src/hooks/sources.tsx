
import { Source, Dish } from "@/types";
import { supabase, mapSourceFromDB, mapDishFromDB } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useSources() {
  const queryClient = useQueryClient();

  // Get all sources with React Query for better caching and error handling
  const { data: sources = [], isLoading: isLoadingSources, error: sourcesError } = useQuery({
    queryKey: ['sources'],
    mutationFn: async (): Promise<Source[]> => {
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

  // Get a single source by ID with React Query
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

  // Get all dishes associated with a source with React Query
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

  // Add a new source
  const addSource = async (source: Omit<Source, 'id' | 'createdAt' | 'user_id'>) => {
    const { data: userData } = await supabase.auth.getUser();
    const user_id = userData.user?.id;
    
    if (!user_id) throw new Error('User not authenticated');
    
    const sourceToInsert = {
      ...source,
      user_id
    };
    
    const { data, error } = await supabase
      .from('sources')
      .insert(sourceToInsert)
      .select()
      .single();
      
    if (error) throw error;
    
    queryClient.invalidateQueries({ queryKey: ['sources'] });
    return mapSourceFromDB(data);
  };

  // Update an existing source
  const updateSource = async (source: Partial<Source> & { id: string }) => {
    const { data: userData } = await supabase.auth.getUser();
    const user_id = userData.user?.id;
    
    if (!user_id) throw new Error('User not authenticated');
    
    // Prepare data for update
    const updateData: any = {};
    if (source.name !== undefined) updateData.name = source.name;
    if (source.type !== undefined) updateData.type = source.type;
    if (source.description !== undefined) updateData.description = source.description;
    
    const { data, error } = await supabase
      .from('sources')
      .update(updateData)
      .eq('id', source.id)
      .eq('user_id', user_id)
      .select()
      .single();
      
    if (error) throw error;
    
    queryClient.invalidateQueries({ queryKey: ['sources'] });
    return mapSourceFromDB(data);
  };

  // Delete a source
  const deleteSource = async (id: string) => {
    // First update any dishes that reference this source
    const { data: userData } = await supabase.auth.getUser();
    const user_id = userData.user?.id;
    
    if (!user_id) throw new Error('User not authenticated');
    
    await supabase
      .from('dishes')
      .update({ source_id: null })
      .eq('source_id', id)
      .eq('user_id', user_id);
      
    // Then delete the source
    const { error } = await supabase
      .from('sources')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id);
      
    if (error) throw error;
    
    queryClient.invalidateQueries({ queryKey: ['sources'] });
    queryClient.invalidateQueries({ queryKey: ['dishes'] });
    return id;
  };

  // Merge two sources
  const mergeSources = async ({ 
    sourceToMergeId, 
    targetSourceId 
  }: { 
    sourceToMergeId: string, 
    targetSourceId: string 
  }) => {
    const { data: userData } = await supabase.auth.getUser();
    const user_id = userData.user?.id;
    
    if (!user_id) throw new Error('User not authenticated');
    
    // 1. Get all dishes linked to the source to be merged
    const { data: dishesData, error: dishesError } = await supabase
      .from('dishes')
      .select('*')
      .eq('source_id', sourceToMergeId)
      .eq('user_id', user_id);
      
    if (dishesError) throw dishesError;
    
    // 2. Update all dishes to the target source
    if (dishesData && dishesData.length > 0) {
      const { error: updateError } = await supabase
        .from('dishes')
        .update({ source_id: targetSourceId })
        .eq('source_id', sourceToMergeId)
        .eq('user_id', user_id);
        
      if (updateError) throw updateError;
    }
    
    // 3. Delete the source that is being merged
    const { error: deleteError } = await supabase
      .from('sources')
      .delete()
      .eq('id', sourceToMergeId)
      .eq('user_id', user_id);
      
    if (deleteError) throw deleteError;
    
    queryClient.invalidateQueries({ queryKey: ['sources'] });
    queryClient.invalidateQueries({ queryKey: ['dishes'] });
    
    return { 
      sourceToMergeId, 
      targetSourceId, 
      affectedDishesCount: dishesData?.length || 0 
    };
  };

  return {
    // Source queries
    sources,
    isLoadingSources,
    sourcesError,
    getSources: async () => sources,
    getSource,
    getDishesBySource,
    findSourceByName,
    
    // Source mutations
    addSource,
    updateSource,
    deleteSource,
    mergeSources
  };
}
