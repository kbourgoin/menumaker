
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useSourceMerge() {
  const queryClient = useQueryClient();

  // Merge two sources
  const mergeSources = useMutation({
    mutationFn: async ({ 
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
      
      return { 
        sourceToMergeId, 
        targetSourceId, 
        affectedDishesCount: dishesData?.length || 0 
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
    }
  });

  return {
    mergeSources: mergeSources.mutateAsync
  };
}
