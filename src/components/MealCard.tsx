
import { useState } from "react";
import { Meal } from "@/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Link, Trash } from "lucide-react";
import CuisineTag from "./CuisineTag";
import SourceLink from "./SourceLink";
import { useMeals } from "@/hooks/useMeals";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface MealCardProps {
  meal: Meal;
  showActions?: boolean;
  compact?: boolean;
  onDeleted?: () => void;
}

const MealCard = ({ meal, showActions = true, compact = false, onDeleted }: MealCardProps) => {
  const { recordMealCooked, deleteMeal } = useMeals();
  const { toast } = useToast();
  const [notes, setNotes] = useState("");
  const [isAddingMeal, setIsAddingMeal] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const handleLogMeal = () => {
    recordMealCooked(meal.id, new Date().toISOString(), notes || undefined);
    setNotes("");
    setIsAddingMeal(false);
    
    toast({
      title: "Meal logged",
      description: `${meal.name} has been added to your meal history.`,
    });
  };
  
  const handleDeleteMeal = () => {
    deleteMeal(meal.id);
    setIsDeleteDialogOpen(false);
    
    toast({
      title: "Meal deleted",
      description: `${meal.name} has been deleted from your meals.`,
    });
    
    if (onDeleted) {
      onDeleted();
    }
  };
  
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Never";
    try {
      return format(parseISO(dateString), "MMMM d, yyyy");
    } catch (e) {
      console.error("Error parsing date", e);
      return "Invalid date";
    }
  };
  
  const formatTimeAgo = (dateString: string | undefined) => {
    if (!dateString) return "";
    try {
      return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
    } catch (e) {
      console.error("Error parsing date", e);
      return "";
    }
  };

  return (
    <Card className="transition-all duration-300 hover:shadow-md overflow-hidden group">
      <CardHeader className={compact ? "pb-2 pt-4 px-4" : "pb-4"}>
        <CardTitle className={`line-clamp-1 text-lg ${compact ? "text-base" : "text-xl"}`}>
          {meal.name}
        </CardTitle>
      </CardHeader>
      
      <CardContent className={compact ? "pb-2 px-4" : "pb-6"}>
        <div className="space-y-3">
          {!compact && (
            <div className="flex flex-wrap gap-1.5">
              {meal.cuisines.map((cuisine) => (
                <CuisineTag key={cuisine} cuisine={cuisine} size={compact ? "sm" : "md"} />
              ))}
            </div>
          )}
          
          {compact && meal.cuisines.length > 0 && (
            <CuisineTag cuisine={meal.cuisines[0]} size="sm" />
          )}
          
          <div className={`text-sm text-muted-foreground ${compact ? "text-xs" : ""}`}>
            <div className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 mr-1" />
              <span>Last made: {formatDate(meal.lastMade)} {meal.lastMade && `(${formatTimeAgo(meal.lastMade)})`}</span>
            </div>
            <div className="mt-1">Made {meal.timesCooked} {meal.timesCooked === 1 ? "time" : "times"}</div>
          </div>
          
          {meal.source && meal.source.type !== 'none' && !compact && (
            <div className="mt-2">
              <SourceLink source={meal.source} />
            </div>
          )}
        </div>
      </CardContent>
      
      {showActions && (
        <CardFooter className={`border-t ${compact ? "pt-2 pb-3 px-4" : "pt-3"}`}>
          <div className="flex justify-between w-full">
            <Dialog open={isAddingMeal} onOpenChange={setIsAddingMeal}>
              <DialogTrigger asChild>
                <Button variant="outline" size={compact ? "sm" : "default"} className="text-terracotta-500 border-terracotta-200 hover:bg-terracotta-50 hover:text-terracotta-600">
                  <Plus className="mr-1 h-4 w-4" />
                  <span>{compact ? "Add" : "Cook This"}</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Log {meal.name}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <div className="space-y-2">
                    <label htmlFor="notes" className="text-sm font-medium">
                      Notes (optional)
                    </label>
                    <Textarea
                      id="notes"
                      placeholder="Any variations or notes about this meal..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddingMeal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleLogMeal} className="bg-terracotta-500 hover:bg-terracotta-600">
                    Log Meal
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size={compact ? "sm" : "default"} 
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete {meal.name}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p>Are you sure you want to delete this meal? This action cannot be undone.</p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteMeal}
                  >
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default MealCard;
