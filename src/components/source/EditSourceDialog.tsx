
import { useState, useEffect } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { useSources } from "@/hooks/sources";
import { useAuth } from "@/components/AuthProvider";
import MergeSourceDialog from "./MergeSourceDialog";
import LinkedDishesSection from "./LinkedDishesSection";
import SourceFormFields from "./SourceFormFields";
import { useSourceEdit, SourceFormData } from "@/hooks/source";
import { useToast } from "@/hooks/use-toast";

interface EditSourceDialogProps {
  source: Source | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditSourceDialog = ({ source, isOpen, onOpenChange }: EditSourceDialogProps) => {
  const [formData, setFormData] = useState<SourceFormData>({
    name: "",
    type: "book" as 'book' | 'website',
    description: "",
  });
  
  const { session } = useAuth();
  const { getDishesBySource, findSourceByName } = useSources();
  const { toast } = useToast();
  
  const {
    duplicateSource,
    affectedDishesCount,
    isMergeDialogOpen,
    setIsMergeDialogOpen,
    updateSourceMutation,
    handleSubmit,
    handleMergeConfirm
  } = useSourceEdit(source, () => onOpenChange(false));

  useEffect(() => {
    if (source) {
      setFormData({
        name: source.name,
        type: source.type,
        description: source.description || "",
      });
    }
  }, [source]);

  // Query to fetch linked dishes
  const { data: linkedDishes = [] } = useQuery({
    queryKey: ['sourceLinkedDishes', source?.id],
    queryFn: () => source ? getDishesBySource(source.id) : Promise.resolve([]),
    enabled: isOpen && !!source?.id,
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
      type: value as 'book' | 'website',
    }));
  };

  const handleFormSubmit = async () => {
    if (!source) return;
    
    if (!formData.name.trim()) {
      toast({
        title: "Name is required",
        description: "Please enter a source name.",
        variant: "destructive",
      });
      return;
    }
    
    // First check if name has changed
    if (formData.name.trim() !== source.name) {
      // Check for existing sources with the same name
      const existingSource = await findSourceByName(formData.name.trim(), source.id);
      
      if (existingSource) {
        // If source exists with same name but different type, just warn the user
        if (existingSource.type !== formData.type) {
          toast({
            title: "Warning",
            description: `A source with the name "${formData.name}" but different type already exists. Both will be kept as separate sources.`,
            variant: "warning",
          });
        }
      }
    }
    
    // Continue with normal submit process which will handle merge if needed
    handleSubmit(formData);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Source</DialogTitle>
            <DialogDescription>
              Update the details for this source
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <SourceFormFields 
              formData={formData}
              handleInputChange={handleInputChange}
              handleTypeChange={handleTypeChange}
            />
            
            {/* Linked Dishes Section */}
            <LinkedDishesSection dishes={linkedDishes} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleFormSubmit}
              disabled={updateSourceMutation.isPending}
            >
              {updateSourceMutation.isPending ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <MergeSourceDialog
        sourceToEdit={source}
        duplicateSource={duplicateSource}
        affectedDishesCount={affectedDishesCount}
        isOpen={isMergeDialogOpen}
        onOpenChange={setIsMergeDialogOpen}
        onConfirm={handleMergeConfirm}
      />
    </>
  );
};

export default EditSourceDialog;
