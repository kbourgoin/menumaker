
import { useState, useEffect } from "react";
import { Cookbook } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { useAuth } from "@/components/AuthProvider";

interface EditCookbookDialogProps {
  cookbook: Cookbook | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditCookbookDialog = ({ cookbook, isOpen, onOpenChange }: EditCookbookDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    author: "",
    description: "",
  });
  
  const { toast } = useToast();
  const { session } = useAuth();
  const { updateCookbook } = useCookbooks();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (cookbook) {
      setFormData({
        name: cookbook.name,
        author: cookbook.author || "",
        description: cookbook.description || "",
      });
    }
  }, [cookbook]);

  // Mutation for updating a cookbook
  const updateCookbookMutation = useMutation({
    mutationFn: async (data: Partial<Cookbook> & { id: string }) => {
      if (!session?.user?.id) {
        throw new Error("User not authenticated");
      }
      
      return updateCookbook(data, session.user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cookbooks'] });
      onOpenChange(false);
      
      toast({
        title: "Cookbook updated",
        description: `${formData.name} has been updated.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating cookbook",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    if (!cookbook) return;
    
    if (!formData.name.trim()) {
      toast({
        title: "Name is required",
        description: "Please enter a cookbook name.",
        variant: "destructive",
      });
      return;
    }

    updateCookbookMutation.mutate({
      id: cookbook.id,
      name: formData.name,
      author: formData.author || undefined,
      description: formData.description || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Cookbook</DialogTitle>
          <DialogDescription>
            Update the details for this cookbook
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="edit-name" className="text-sm font-medium">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="edit-name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="edit-author" className="text-sm font-medium">
              Author
            </label>
            <Input
              id="edit-author"
              name="author"
              value={formData.author}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="edit-description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="edit-description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={updateCookbookMutation.isPending}
          >
            {updateCookbookMutation.isPending ? "Updating..." : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditCookbookDialog;
