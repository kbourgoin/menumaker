
import { useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSources } from "@/hooks/useSources";
import { useAuth } from "@/components/AuthProvider";

interface AddSourceDialogProps {
  className?: string;
}

const AddSourceDialog = ({ className = "" }: AddSourceDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "book", // Default type
    description: "",
  });
  
  const { toast } = useToast();
  const { session } = useAuth();
  const { addSource } = useSources();
  const queryClient = useQueryClient();

  // Mutation for adding a source
  const addSourceMutation = useMutation({
    mutationFn: async (source: Omit<Source, "id" | "createdAt" | "user_id">) => {
      if (!session?.user?.id) {
        throw new Error("User not authenticated");
      }
      
      return addSource(source);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      setIsOpen(false);
      setFormData({ name: "", type: "book", description: "" });
      
      toast({
        title: "Source added",
        description: `${formData.name} has been added to your sources.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding source",
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
    if (!formData.name.trim()) {
      toast({
        title: "Name is required",
        description: "Please enter a source name.",
        variant: "destructive",
      });
      return;
    }

    addSourceMutation.mutate({
      name: formData.name,
      type: formData.type as 'book' | 'website' | 'document',
      description: formData.description || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className={`flex items-center gap-1 ${className}`}>
          <PlusIcon className="h-4 w-4" /> Add Source
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Source</DialogTitle>
          <DialogDescription>
            Enter the details for your new recipe source
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., The Joy of Cooking"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="type" className="text-sm font-medium">
              Type <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.type}
              onValueChange={handleTypeChange}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select source type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="book">Book</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="document">Document</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {formData.type === 'book' ? "Book or cookbook" : 
               formData.type === 'website' ? "Online recipe source" : 
               "Any other document type source"}
            </p>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Notes about this source..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={addSourceMutation.isPending}
          >
            {addSourceMutation.isPending ? "Adding..." : "Add Source"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddSourceDialog;
