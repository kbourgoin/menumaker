
import { useState, useEffect } from "react";
import { Source } from "@/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSources } from "@/hooks/useSources";
import { useAuth } from "@/components/AuthProvider";

interface EditSourceDialogProps {
  source: Source | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditSourceDialog = ({ source, isOpen, onOpenChange }: EditSourceDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "book" as 'book' | 'website' | 'document',
    description: "",
  });
  
  const { toast } = useToast();
  const { session } = useAuth();
  const { updateSource } = useSources();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (source) {
      setFormData({
        name: source.name,
        type: source.type,
        description: source.description || "",
      });
    }
  }, [source]);

  // Mutation for updating a source
  const updateSourceMutation = useMutation({
    mutationFn: async (data: Partial<Source> & { id: string }) => {
      if (!session?.user?.id) {
        throw new Error("User not authenticated");
      }
      
      return updateSource(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      onOpenChange(false);
      
      toast({
        title: "Source updated",
        description: `${formData.name} has been updated.`,
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTypeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      type: value as 'book' | 'website' | 'document',
    }));
  };

  const handleSubmit = () => {
    if (!source) return;
    
    if (!formData.name.trim()) {
      toast({
        title: "Name is required",
        description: "Please enter a source name.",
        variant: "destructive",
      });
      return;
    }

    updateSourceMutation.mutate({
      id: source.id,
      name: formData.name,
      type: formData.type,
      description: formData.description || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Source</DialogTitle>
          <DialogDescription>
            Update the details for this source
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
            <label htmlFor="edit-type" className="text-sm font-medium">
              Type <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.type}
              onValueChange={handleTypeChange}
            >
              <SelectTrigger id="edit-type">
                <SelectValue placeholder="Select source type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="book">Book</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="document">Document</SelectItem>
              </SelectContent>
            </Select>
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
            disabled={updateSourceMutation.isPending}
          >
            {updateSourceMutation.isPending ? "Updating..." : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditSourceDialog;
