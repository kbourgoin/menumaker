
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

// Error types for better error handling
export interface SourceMergeError extends Error {
  code?: string;
  details?: string;
  hint?: string;
}

// Type guard for error objects
const isErrorWithCode = (error: unknown): error is { code?: string; details?: string; hint?: string; message?: string } => {
  return error !== null && typeof error === 'object';
};

// Helper function to create standardized error objects
const createSourceMergeError = (message: string, originalError?: unknown): SourceMergeError => {
  const error = new Error(message) as SourceMergeError;
  if (originalError && isErrorWithCode(originalError)) {
    error.code = originalError.code;
    error.details = originalError.details;
    error.hint = originalError.hint;
    error.cause = originalError;
  }
  return error;
};

// Helper function to handle authentication errors
const handleAuthError = (error: unknown): never => {
  if (isErrorWithCode(error) && 
      (error.message?.includes('JWT') || error.code === 'PGRST301')) {
    throw createSourceMergeError('Authentication failed. Please log in again.', error);
  }
  throw error;
};

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
      // Validate input
      if (!sourceToMergeId || !targetSourceId) {
        throw createSourceMergeError('Both source IDs are required for merge operation');
      }
      
      if (sourceToMergeId === targetSourceId) {
        throw createSourceMergeError('Cannot merge a source with itself');
      }

      try {
        const { data: userData, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          handleAuthError(authError);
        }
        
        const user_id = userData.user?.id;
        
        if (!user_id) {
          throw createSourceMergeError('User not authenticated');
        }
        
        // 1. Verify both sources exist and belong to the user
        const { data: sourceToMerge, error: sourceToMergeError } = await supabase
          .from('sources')
          .select('id, name')
          .eq('id', sourceToMergeId)
          .eq('user_id', user_id)
          .maybeSingle();
          
        if (sourceToMergeError) {
          throw createSourceMergeError(`Failed to verify source to merge: ${sourceToMergeError.message}`, sourceToMergeError);
        }
        
        if (!sourceToMerge) {
          throw createSourceMergeError('Source to merge not found or you do not have permission to access it');
        }

        const { data: targetSource, error: targetSourceError } = await supabase
          .from('sources')
          .select('id, name')
          .eq('id', targetSourceId)
          .eq('user_id', user_id)
          .maybeSingle();
          
        if (targetSourceError) {
          throw createSourceMergeError(`Failed to verify target source: ${targetSourceError.message}`, targetSourceError);
        }
        
        if (!targetSource) {
          throw createSourceMergeError('Target source not found or you do not have permission to access it');
        }
        
        // 2. Get all dishes linked to the source to be merged
        const { data: dishesData, error: dishesError } = await supabase
          .from('dishes')
          .select('*')
          .eq('source_id', sourceToMergeId)
          .eq('user_id', user_id);
          
        if (dishesError) {
          throw createSourceMergeError(`Failed to fetch dishes to merge: ${dishesError.message}`, dishesError);
        }
        
        // 3. Update all dishes to the target source
        if (dishesData && dishesData.length > 0) {
          const { error: updateError } = await supabase
            .from('dishes')
            .update({ source_id: targetSourceId })
            .eq('source_id', sourceToMergeId)
            .eq('user_id', user_id);
            
          if (updateError) {
            throw createSourceMergeError(`Failed to update dishes during merge: ${updateError.message}`, updateError);
          }
        }
        
        // 4. Delete the source that is being merged
        const { error: deleteError } = await supabase
          .from('sources')
          .delete()
          .eq('id', sourceToMergeId)
          .eq('user_id', user_id);
          
        if (deleteError) {
          throw createSourceMergeError(`Failed to delete merged source: ${deleteError.message}`, deleteError);
        }
        
        return { 
          sourceToMergeId, 
          targetSourceId, 
          affectedDishesCount: dishesData?.length || 0,
          sourceToMergeName: sourceToMerge.name,
          targetSourceName: targetSource.name
        };
      } catch (error) {
        console.error('Error merging sources:', error);
        throw error instanceof Error ? error : createSourceMergeError('Unknown error occurred while merging sources');
      }
    },
    onSuccess: (data) => {
      logger.operation(`Successfully merged "${data.sourceToMergeName}" into "${data.targetSourceName}", affecting ${data.affectedDishesCount} dishes`, 'source-merge');
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
    },
    onError: (error) => {
      console.error('Source merge failed:', error);
    }
  });

  return {
    // Mutation function
    mergeSources: mergeSources.mutateAsync,
    
    // Mutation state
    isMergingSources: mergeSources.isPending,
    
    // Error utilities
    createSourceMergeError
  };
}
