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
import { MergeSourceDialog } from "@/components/dialogs";
import { LinkedDishesSection } from "@/components/source";
import { SourceFormFields } from "@/components/source";
import { useSourceEdit, SourceFormData } from "@/hooks/source";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface EditSourceDialogProps {
  source: Source | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditSourceDialog = ({
  source,
  isOpen,
  onOpenChange,
}: EditSourceDialogProps) => {
  const [formData, setFormData] = useState<SourceFormData>({
    name: "",
    type: "book" as "book" | "website",
    description: "",
  });

  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");

  const { getDishesBySource, findSourceByName } = useSources();
  const { toast } = useToast();

  const {
    duplicateSource,
    affectedDishesCount,
    isMergeDialogOpen,
    setIsMergeDialogOpen,
    updateSourceMutation,
    handleSubmit,
    handleMergeConfirm,
  } = useSourceEdit(source, () => onOpenChange(false));

  useEffect(() => {
    if (source) {
      setFormData({
        name: source.name,
        type: source.type,
        description: source.description || "",
      });
      setShowWarning(false); // Reset warning when dialog opens
    }
  }, [source]);

  // Query to fetch linked dishes
  const { data: linkedDishes = [] } = useQuery({
    queryKey: ["sourceLinkedDishes", source?.id],
    queryFn: () =>
      source ? getDishesBySource(source.id) : Promise.resolve([]),
    enabled: isOpen && !!source?.id,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setShowWarning(false); // Clear warning when user makes changes
  };

  const handleTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      type: value as "book" | "website",
    }));
    setShowWarning(false); // Clear warning when user makes changes
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
      const existingSource = await findSourceByName(
        formData.name.trim(),
        source.id
      );

      if (existingSource) {
        // If source exists with same name but different type, just warn the user
        if (existingSource.type !== formData.type) {
          setWarningMessage(
            `A source with the name "${formData.name}" but different type already exists. Both will be kept as separate sources.`
          );
          setShowWarning(true);
          return;
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
            {showWarning && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertTitle className="text-amber-800">Warning</AlertTitle>
                <AlertDescription className="text-amber-700">
                  {warningMessage}
                </AlertDescription>
              </Alert>
            )}

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
            {showWarning && (
              <Button
                variant="default"
                className="bg-amber-500 hover:bg-amber-600"
                onClick={() => {
                  setShowWarning(false);
                  handleSubmit(formData);
                }}
              >
                Continue Anyway
              </Button>
            )}
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
