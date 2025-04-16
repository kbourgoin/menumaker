
import { format, parseISO } from "date-fns";
import { Clock, MessageSquare, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import CookDishDialog from "@/components/CookDishDialog";
import { useState } from "react";
import { useMeals } from "@/hooks/useMeals";
import { useToast } from "@/hooks/use-toast";
import { MealHistory } from "@/types";

interface CookingHistoryTabProps {
  history: MealHistory[];
  dishId: string;
  dishName: string;
  onHistoryUpdated?: () => void;
}

const CookingHistoryTab = ({ 
  history, 
  dishId, 
  dishName,
  onHistoryUpdated 
}: CookingHistoryTabProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const { toast } = useToast();
  const { deleteMealHistory } = useMeals();

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "MMMM d, yyyy");
    } catch (e) {
      console.error("Error parsing date", e);
      return "Invalid date";
    }
  };

  const handleDelete = async () => {
    if (!selectedEntryId) return;
    
    try {
      await deleteMealHistory(selectedEntryId);
      toast({
        title: "Entry deleted",
        description: "The cooking history entry has been deleted.",
      });
      
      // Notify parent component that history was updated
      if (onHistoryUpdated) {
        onHistoryUpdated();
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast({
        title: "Error",
        description: "Failed to delete the entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedEntryId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Cooking History</CardTitle>
          <CookDishDialog
            dish={{ id: dishId, name: dishName }}
            variant="outline"
            size="sm"
            onSuccess={onHistoryUpdated}
          />
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <div className="space-y-4">
              {history.map((entry) => (
                <div key={entry.id} className="p-4 border rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 mr-2" />
                      {formatDate(entry.date)}
                    </div>
                    <div className="flex gap-2">
                      <CookDishDialog
                        dish={{ id: dishId, name: dishName }}
                        variant="ghost"
                        size="icon"
                        initialDate={new Date(entry.date)}
                        initialNotes={entry.notes}
                        editMode
                        historyEntryId={entry.id}
                        onSuccess={onHistoryUpdated}
                      >
                        <Pencil className="w-4 h-4" />
                      </CookDishDialog>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setSelectedEntryId(entry.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {entry.notes && (
                    <div className="mt-2 flex items-start">
                      <MessageSquare className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground" />
                      <div className="text-sm">{entry.notes}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No cooking history recorded yet.
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete cooking history entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this cooking history entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CookingHistoryTab;
