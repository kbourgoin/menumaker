
import { useState } from "react";
import { Source } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useSources } from "@/hooks/useSources";

export function useSourceMerge(onCompleteMerge: () => void) {
  const [duplicateSource, setDuplicateSource] = useState<Source | null>(null);
  const [affectedDishesCount, setAffectedDishesCount] = useState(0);
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const { mergeSources } = useSources();

  const handleMergeConfirm = async (sourceToMergeId: string) => {
    if (!duplicateSource) return;
    
    try {
      await mergeSources({
        sourceToMergeId,
        targetSourceId: duplicateSource.id
      });
      
      toast({
        title: "Sources merged",
        description: `Sources have been merged successfully.`,
      });
      
      onCompleteMerge();
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
    setDuplicateSource,
    affectedDishesCount,
    setAffectedDishesCount,
    isMergeDialogOpen,
    setIsMergeDialogOpen,
    handleMergeConfirm
  };
}
