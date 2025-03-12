
import { useState } from "react";
import { Cookbook } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/AuthProvider";
import { useCookbooks } from "@/hooks/useCookbooks";

// Import our new components
import AddCookbookDialog from "./cookbook/AddCookbookDialog";
import EditCookbookDialog from "./cookbook/EditCookbookDialog";
import DeleteCookbookDialog from "./cookbook/DeleteCookbookDialog";
import CookbookTable from "./cookbook/CookbookTable";
import CookbookEmptyState from "./cookbook/CookbookEmptyState";
import CookbookLoading from "./cookbook/CookbookLoading";

const CookbookManager = () => {
  const [currentCookbook, setCurrentCookbook] = useState<Cookbook | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const { session } = useAuth();
  const { getCookbooks } = useCookbooks();

  // Use React Query to fetch cookbooks
  const { data: cookbooks = [], isLoading } = useQuery({
    queryKey: ['cookbooks'],
    queryFn: getCookbooks,
    enabled: !!session
  });

  const openEditDialog = (cookbook: Cookbook) => {
    setCurrentCookbook(cookbook);
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
        <AddCookbookDialog />
      </div>

      {isLoading ? (
        <CookbookLoading />
      ) : cookbooks.length === 0 ? (
        <CookbookEmptyState />
      ) : (
        <CookbookTable 
          cookbooks={cookbooks}
          onEdit={openEditDialog}
          onDelete={openDeleteDialog}
        />
      )}

      {/* Edit Dialog */}
      <EditCookbookDialog 
        cookbook={currentCookbook}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteCookbookDialog 
        cookbook={currentCookbook}
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      />
    </div>
  );
};

export default CookbookManager;
