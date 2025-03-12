
import { useState, useEffect } from "react";
import { Cookbook } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PencilIcon, Trash2Icon, PlusIcon, Book } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCookbooks } from "@/hooks/useCookbooks";
import { useAuth } from "@/components/AuthProvider";
import { supabase, mapCookbookToDB } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const CookbookManager = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentCookbook, setCurrentCookbook] = useState<Cookbook | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    author: "",
    description: "",
  });
  const { toast } = useToast();
  const { session } = useAuth();
  const { getCookbooks, getDishesByCookbook } = useCookbooks();
  const queryClient = useQueryClient();

  // Use React Query to fetch cookbooks
  const { data: cookbooks = [], isLoading } = useQuery({
    queryKey: ['cookbooks'],
    queryFn: getCookbooks,
    enabled: !!session
  });

  // Mutation for adding a cookbook
  const addCookbookMutation = useMutation({
    mutationFn: async (cookbook: Omit<Cookbook, "id" | "createdAt" | "user_id">) => {
      if (!session?.user?.id) {
        throw new Error("User not authenticated");
      }
      
      const { data, error } = await supabase
        .from('cookbooks')
        .insert(
          mapCookbookToDB({
            ...cookbook,
            user_id: session.user.id
          })
        )
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cookbooks'] });
      setIsAddDialogOpen(false);
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

  // Mutation for updating a cookbook
  const updateCookbookMutation = useMutation({
    mutationFn: async (cookbook: Partial<Cookbook> & { id: string, user_id?: string }) => {
      if (!session?.user?.id) {
        throw new Error("User not authenticated");
      }
      
      const { data, error } = await supabase
        .from('cookbooks')
        .update(mapCookbookToDB({
          ...cookbook,
          user_id: session.user.id
        }))
        .eq('id', cookbook.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cookbooks'] });
      setIsEditDialogOpen(false);
      setCurrentCookbook(null);
      
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
      setIsDeleteDialogOpen(false);
      setCurrentCookbook(null);
      
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddSubmit = () => {
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

  const handleEditSubmit = () => {
    if (!currentCookbook) return;
    
    if (!formData.name.trim()) {
      toast({
        title: "Name is required",
        description: "Please enter a cookbook name.",
        variant: "destructive",
      });
      return;
    }

    updateCookbookMutation.mutate({
      id: currentCookbook.id,
      name: formData.name,
      author: formData.author || undefined,
      description: formData.description || undefined,
    });
  };

  const handleDeleteSubmit = async () => {
    if (!currentCookbook) return;
    
    // Check if cookbook has linked dishes
    try {
      const linkedDishes = await getDishesByCookbook(currentCookbook.id);
      
      if (linkedDishes.length > 0) {
        toast({
          title: "Cannot delete cookbook",
          description: `This cookbook is linked to ${linkedDishes.length} dishes. Please unlink them first.`,
          variant: "destructive",
        });
        setIsDeleteDialogOpen(false);
        return;
      }

      deleteCookbookMutation.mutate(currentCookbook.id);
    } catch (error) {
      toast({
        title: "Error checking linked dishes",
        description: "Could not verify if cookbook has linked dishes.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (cookbook: Cookbook) => {
    setCurrentCookbook(cookbook);
    setFormData({
      name: cookbook.name,
      author: cookbook.author || "",
      description: cookbook.description || "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (cookbook: Cookbook) => {
    setCurrentCookbook(cookbook);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Manage Cookbooks</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddSubmit}
                disabled={addCookbookMutation.isPending}
              >
                {addCookbookMutation.isPending ? "Adding..." : "Add Cookbook"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center p-6 border rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta-500 mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading cookbooks...</p>
        </div>
      ) : cookbooks.length === 0 ? (
        <div className="text-center p-6 border rounded-lg">
          <Book className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">
            No cookbooks added yet. Add your first cookbook to get started.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Author</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cookbooks.map((cookbook) => (
                <TableRow key={cookbook.id}>
                  <TableCell className="font-medium">{cookbook.name}</TableCell>
                  <TableCell>{cookbook.author || "-"}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {cookbook.description ? (
                      <span className="line-clamp-1">{cookbook.description}</span>
                    ) : (
                      <span className="text-muted-foreground italic">No description</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(cookbook)}
                      >
                        <PencilIcon className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(cookbook)}
                      >
                        <Trash2Icon className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
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
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditSubmit}
              disabled={updateCookbookMutation.isPending}
            >
              {updateCookbookMutation.isPending ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Cookbook</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {currentCookbook?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteSubmit}
              disabled={deleteCookbookMutation.isPending}
            >
              {deleteCookbookMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CookbookManager;
