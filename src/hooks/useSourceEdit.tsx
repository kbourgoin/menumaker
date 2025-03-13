
import { useState } from "react";
import { Source, Dish } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useSources } from "@/hooks/useSources";

export interface SourceFormData {
  name: string;
  type: 'book' | 'website' | 'document';
  description: string;
}

export function useSourceEdit(
  source: Source | null,
  onComplete: () => void
) {
  const [duplicateSource, setDuplicateSource] = useState<Source | null>(null);
  const [affectedDishesCount, setAffectedDishesCount] = useState(0);
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { updateSource, findSourceByName, mergeSources, getDishesBySource } = useSources();

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
    
    // Check if the name has changed and if there's a duplicate
    if (formData.name.trim() !== source.name) {
      const existingSource = await findSourceByName(formData.name.trim(), source.id);
      
      if (existingSource) {
        // Get the number of dishes affected by the merge
        const dishes = await getDishesBySource(source.id);
        setAffectedDishesCount(dishes.length);
        setDuplicateSource(existingSource);
        setIsMergeDialogOpen(true);
        return;
      }
    }

    // If no duplicate, just update the source
    updateSourceMutation.mutate({
      id: source.id,
      name: formData.name,
      type: formData.type,
      description: formData.description || undefined,
    });
  };
  
  const handleMergeConfirm = async () => {
    if (!source || !duplicateSource) return;
    
    try {
      await mergeSources({
        sourceToMergeId: source.id,
        targetSourceId: duplicateSource.id
      });
      
      toast({
        title: "Sources merged",
        description: `Sources have been merged successfully.`,
      });
      
      onComplete();
    } catch (error) {
      console.error('Error merging sources:', error);
      toast({
        title: "Error merging sources",
        description: "There was a problem merging the sources.",
        variant: "destructive",
      });
    }
  };

  return {
    duplicateSource,
    affectedDishesCount,
    isMergeDialogOpen,
    setIsMergeDialogOpen,
    updateSourceMutation,
    handleSubmit,
    handleMergeConfirm
  };
}
