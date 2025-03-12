
import { useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCookbooks } from "@/hooks/useCookbooks";
import { useAuth } from "@/components/AuthProvider";

const AddCookbookDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    author: "",
    description: "",
  });
  
  const { toast } = useToast();
  const { session } = useAuth();
  const { createCookbook } = useCookbooks();
  const queryClient = useQueryClient();

  // Mutation for adding a cookbook
  const addCookbookMutation = useMutation({
    mutationFn: async (cookbook: Omit<Cookbook, "id" | "createdAt" | "user_id">) => {
      if (!session?.user?.id) {
        throw new Error("User not authenticated");
      }
      
      return createCookbook(cookbook, session.user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cookbooks'] });
      setIsOpen(false);
      setFormData({ name: "", author: "", description: "" });
      
      toast({
        title: "Cookbook added",
        description: `${formData.name} has been added to your cookbooks.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding cookbook",
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
    if (!formData.name.trim()) {
      toast({
        title: "Name is required",
        description: "Please enter a cookbook name.",
        variant: "destructive",
      });
      return;
    }

    addCookbookMutation.mutate({
      name: formData.name,
      author: formData.author || undefined,
      description: formData.description || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="flex items-center gap-1">
          <PlusIcon className="h-4 w-4" /> Add Cookbook
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Cookbook</DialogTitle>
          <DialogDescription>
            Enter the details for your new cookbook
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
            <label htmlFor="author" className="text-sm font-medium">
              Author
            </label>
            <Input
              id="author"
              name="author"
              value={formData.author}
              onChange={handleInputChange}
              placeholder="e.g., Julia Child"
            />
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
              placeholder="Notes about this cookbook..."
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
            disabled={addCookbookMutation.isPending}
          >
            {addCookbookMutation.isPending ? "Adding..." : "Add Cookbook"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddCookbookDialog;
