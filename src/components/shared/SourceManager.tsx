
import { useState } from "react";
import { Source } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth";
import { useSources } from "@/hooks/sources";

// Import our new components
import { AddSourceDialog, EditSourceDialog, DeleteSourceDialog } from "@/components/dialogs";
import { SourceTable, SourceEmptyState, SourceLoading } from "@/components/source";

const SourceManager = () => {
  const [currentSource, setCurrentSource] = useState<Source | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const { session } = useAuth();
  const { getSources } = useSources();

  // Use React Query to fetch sources
  const { data: sources = [], isLoading } = useQuery({
    queryKey: ['sources'],
    queryFn: getSources,
    enabled: !!session
  });

  const openEditDialog = (source: Source) => {
    setCurrentSource(source);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (source: Source) => {
    setCurrentSource(source);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Manage Sources</h3>
        <AddSourceDialog />
      </div>

      {isLoading ? (
        <SourceLoading />
      ) : sources && sources.length === 0 ? (
        <SourceEmptyState />
      ) : (
        <SourceTable 
          sources={sources}
          onEdit={openEditDialog}
          onDelete={openDeleteDialog}
        />
      )}

      {/* Edit Dialog */}
      <EditSourceDialog 
        source={currentSource}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteSourceDialog 
        source={currentSource}
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      />
    </div>
  );
};

export default SourceManager;
