import { Source } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSources } from "@/hooks/sources";
import { supabase } from "@/integrations/supabase/client";

interface DeleteSourceDialogProps {
  source: Source | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const DeleteSourceDialog = ({
  source,
  isOpen,
  onOpenChange,
}: DeleteSourceDialogProps) => {
  const { toast } = useToast();
  const { getDishesBySource } = useSources();
  const queryClient = useQueryClient();

  // Mutation for deleting a source
  const deleteSourceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sources").delete().eq("id", id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources"] });
      onOpenChange(false);

      toast({
        title: "Source deleted",
        description: `The source has been deleted.`,
      });
    },
    onError: error => {
      toast({
        title: "Error deleting source",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = async () => {
    if (!source) return;

    // Check if source has linked dishes
    try {
      const linkedDishes = await getDishesBySource(source.id);

      if (linkedDishes.length > 0) {
        toast({
          title: "Cannot delete source",
          description: `This source is linked to ${linkedDishes.length} dishes. Please unlink them first.`,
          variant: "destructive",
        });
        onOpenChange(false);
        return;
      }

      deleteSourceMutation.mutate(source.id);
    } catch (error) {
      toast({
        title: "Error checking linked dishes",
        description: "Could not verify if source has linked dishes.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Source</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {source?.name}? This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteSourceMutation.isPending}
          >
            {deleteSourceMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteSourceDialog;
