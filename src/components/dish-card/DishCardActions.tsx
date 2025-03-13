
import { useState } from "react";
import { Trash } from "lucide-react";
import { CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import CookDishDialog from "../CookDishDialog";
import { Dish } from "@/types";
import { useDishes } from "@/hooks/useMeals";
import { useToast } from "@/hooks/use-toast";

interface DishCardActionsProps {
  dish: Dish;
  compact?: boolean;
  onDeleted?: () => void;
}

const DishCardActions = ({ dish, compact = false, onDeleted }: DishCardActionsProps) => {
  const { deleteDish } = useDishes();
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const handleDeleteDish = async () => {
    try {
      await deleteDish(dish.id);
      setIsDeleteDialogOpen(false);
      
      toast({
        title: "Dish deleted",
        description: `${dish.name} has been deleted from your dishes.`,
      });
      
      if (onDeleted) {
        onDeleted();
      }
    } catch (error) {
      console.error("Error deleting dish:", error);
      toast({
        title: "Error deleting dish",
        description: "There was a problem deleting this dish. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <CardFooter className={`border-t mt-auto ${compact ? "pt-2 pb-3 px-4" : "pt-3"}`}>
      <div className="flex justify-between w-full">
        <CookDishDialog 
          dish={dish}
          variant="outline"
          size={compact ? "sm" : "default"}
          compact={compact}
        />
        
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              size={compact ? "sm" : "default"} 
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <DialogTitle>Delete {dish.name}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>Are you sure you want to delete this dish? This action cannot be undone.</p>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleteDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteDish();
                }}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CardFooter>
  );
};

export default DishCardActions;
