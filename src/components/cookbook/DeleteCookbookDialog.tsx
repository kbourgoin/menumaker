
import { Cookbook } from "@/types";
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
import { useCookbooks } from "@/hooks/useCookbooks";
import { supabase } from "@/integrations/supabase/client";

interface DeleteCookbookDialogProps {
  cookbook: Cookbook | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const DeleteCookbookDialog = ({ cookbook, isOpen, onOpenChange }: DeleteCookbookDialogProps) => {
  const { toast } = useToast();
  const { getDishesByCookbook } = useCookbooks();
  const queryClient = useQueryClient();

  // Mutation for deleting a cookbook
  const deleteCookbookMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cookbooks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cookbooks'] });
      onOpenChange(false);
      
      toast({
        title: "Cookbook deleted",
        description: `The cookbook has been deleted.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting cookbook",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleDelete = async () => {
    if (!cookbook) return;
    
    // Check if cookbook has linked dishes
    try {
      const linkedDishes = await getDishesByCookbook(cookbook.id);
      
      if (linkedDishes.length > 0) {
        toast({
          title: "Cannot delete cookbook",
          description: `This cookbook is linked to ${linkedDishes.length} dishes. Please unlink them first.`,
          variant: "destructive",
        });
        onOpenChange(false);
        return;
      }

      deleteCookbookMutation.mutate(cookbook.id);
    } catch (error) {
      toast({
        title: "Error checking linked dishes",
        description: "Could not verify if cookbook has linked dishes.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Cookbook</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {cookbook?.name}? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deleteCookbookMutation.isPending}
          >
            {deleteCookbookMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteCookbookDialog;
