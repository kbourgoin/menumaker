
import { Source } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useSources } from "@/hooks/sources";
import { useSourceValidation, SourceFormData } from "./useSourceValidation";
import { useSourceMerge } from "./useSourceMerge";

export function useSourceEdit(
  source: Source | null,
  onComplete: () => void
) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { updateSource } = useSources();
  const { validateSourceName } = useSourceValidation();
  
  const {
    duplicateSource,
    setDuplicateSource,
    affectedDishesCount,
    setAffectedDishesCount,
    isMergeDialogOpen,
    setIsMergeDialogOpen,
    handleMergeConfirm
  } = useSourceMerge(onComplete);

  // Mutation for updating a source
  const updateSourceMutation = useMutation({
    mutationFn: async (data: Partial<Source> & { id: string }) => {
      return updateSource(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      onComplete();
      
      toast({
        title: "Source updated",
        description: `${variables.name} has been updated.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating source",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async (formData: SourceFormData) => {
    if (!source) return;
    
    if (!formData.name.trim()) {
      toast({
        title: "Name is required",
        description: "Please enter a source name.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate the source name for duplicates
    const isValid = await validateSourceName(
      formData, 
      source, 
      (duplicate, dishCount) => {
        setDuplicateSource(duplicate);
        setAffectedDishesCount(dishCount);
        setIsMergeDialogOpen(true);
      }
    );
    
    if (!isValid) return;

    // If no duplicate, just update the source
    updateSourceMutation.mutate({
      id: source.id,
      name: formData.name,
      type: formData.type,
      description: formData.description || undefined,
    });
  };
  
  const handleMergeConfirmWithSource = async () => {
    if (!source) return;
    await handleMergeConfirm(source.id);
  };

  return {
    duplicateSource,
    affectedDishesCount,
    isMergeDialogOpen,
    setIsMergeDialogOpen,
    updateSourceMutation,
    handleSubmit,
    handleMergeConfirm: handleMergeConfirmWithSource
  };
}

// Re-export the SourceFormData type
export type { SourceFormData } from "./useSourceValidation";
