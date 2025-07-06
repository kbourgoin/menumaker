import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSources } from "@/hooks/sources";
import { AlertCircle } from "lucide-react";

interface MergeSourceDialogProps {
  sourceToEdit: Source | null;
  duplicateSource: Source | null;
  affectedDishesCount: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

const MergeSourceDialog = ({
  sourceToEdit,
  duplicateSource,
  affectedDishesCount,
  isOpen,
  onOpenChange,
  onConfirm,
}: MergeSourceDialogProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    try {
      setIsProcessing(true);
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error merging sources",
        description: "There was a problem merging the sources.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!sourceToEdit || !duplicateSource) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Merge Sources
          </DialogTitle>
          <DialogDescription>
            A source with the same name and type already exists. Would you like
            to merge these sources?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="space-y-2">
            <h4 className="font-medium">What will happen:</h4>
            <ul className="list-disc ml-5 space-y-1 text-sm">
              <li>
                All dishes ({affectedDishesCount}) currently linked to{" "}
                <strong>"{sourceToEdit.name}"</strong> will be linked to{" "}
                <strong>"{duplicateSource.name}"</strong> instead
              </li>
              <li>
                The source <strong>"{sourceToEdit.name}"</strong> will be
                deleted
              </li>
              <li>
                Any unique information in the description field will be lost
              </li>
            </ul>
          </div>

          <div className="space-y-2 pt-2">
            <h4 className="font-medium">Source details:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="space-y-1">
                <p className="font-medium">Original source:</p>
                <p>Name: {sourceToEdit.name}</p>
                <p>Type: {sourceToEdit.type}</p>
                {sourceToEdit.description && (
                  <p className="truncate max-w-[200px]">
                    Description: {sourceToEdit.description}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <p className="font-medium">Target source:</p>
                <p>Name: {duplicateSource.name}</p>
                <p>Type: {duplicateSource.type}</p>
                {duplicateSource.description && (
                  <p className="truncate max-w-[200px]">
                    Description: {duplicateSource.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleConfirm}
            disabled={isProcessing}
            className="bg-amber-500 hover:bg-amber-600"
          >
            {isProcessing ? "Merging..." : "Merge Sources"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MergeSourceDialog;
