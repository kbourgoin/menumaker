
import { Source } from "@/types";
import { supabase, mapSourceFromDB, mapSourceToDB } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useSourceMutations() {
  const queryClient = useQueryClient();

  // Add a new source
  const addSource = useMutation({
    mutationFn: async (source: Omit<Source, 'id' | 'createdAt' | 'user_id'>) => {
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
      
      return mapSourceFromDB(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
    }
  });

  // Update an existing source
  const updateSource = useMutation({
    mutationFn: async (source: Partial<Source> & { id: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const user_id = userData.user?.id;
      
      if (!user_id) throw new Error('User not authenticated');
      
      // Only include properties that are present
      const sourceToUpdate = mapSourceToDB(source);
      
      const { data, error } = await supabase
        .from('sources')
        .update(sourceToUpdate)
        .eq('id', source.id)
        .select()
        .single();
        
      if (error) throw error;
      
      return mapSourceFromDB(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
    }
  });

  // Delete a source
  const deleteSource = useMutation({
    mutationFn: async (id: string) => {
      // First update any dishes that reference this source
      await supabase
        .from('dishes')
        .update({ source_id: null })
        .eq('source_id', id);
        
      // Then delete the source
      const { error } = await supabase
        .from('sources')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
    }
  });

  return {
    addSource: addSource.mutateAsync,
    updateSource: updateSource.mutateAsync,
    deleteSource: deleteSource.mutateAsync
  };
}
