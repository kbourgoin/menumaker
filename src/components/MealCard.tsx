import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dish } from "@/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Trash, ExternalLink } from "lucide-react";
import CuisineTag from "./CuisineTag";
import SourceLink from "./SourceLink";
import { useDishes } from "@/hooks/useMeals";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import CookDishDialog from "./CookDishDialog";

interface DishCardProps {
  dish: Dish;
  showActions?: boolean;
  compact?: boolean;
  onDeleted?: () => void;
}

const DishCard = ({ dish, showActions = true, compact = false, onDeleted }: DishCardProps) => {
  const navigate = useNavigate();
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

  const handleCardClick = (e: React.MouseEvent) => {
    if (
      (e.target as HTMLElement).closest('button') || 
      (e.target as HTMLElement).closest('a') || 
      (e.target as HTMLElement).closest('[role="dialog"]')
    ) {
      return;
    }
    
    e.preventDefault();
    navigate(`/meal/${dish.id}`);
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

  const renderLocation = () => {
    if (!dish.location) return null;
    
    const isUrl = dish.location.startsWith('http') || 
                  dish.location.startsWith('www.') || 
                  dish.location.includes('.com') || 
                  dish.location.includes('.org') || 
                  dish.location.includes('.net');
    
    if (isUrl) {
      const href = dish.location.startsWith('http') 
        ? dish.location 
        : `https://${dish.location}`;
        
      return (
        <div className="mt-1 text-sm">
          <a 
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-terracotta-500 hover:text-terracotta-600 hover:underline inline-flex items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1" />
            <span className="truncate">Recipe Link</span>
          </a>
        </div>
      );
    }
    
    return (
      <div className="mt-1 text-sm text-muted-foreground">
        <span>Page: {dish.location}</span>
      </div>
    );
  };

  console.log(`Rendering dish card for ${dish.name} with times cooked:`, dish.timesCooked);

  return (
    <Card 
      className="transition-all duration-300 hover:shadow-md overflow-hidden group flex flex-col h-full" 
      onClick={handleCardClick}
    >
      <CardHeader className={compact ? "pb-2 pt-4 px-4" : "pb-4"}>
        <CardTitle className={`line-clamp-1 text-lg ${compact ? "text-base" : "text-xl"}`}>
          {dish.name}
        </CardTitle>
      </CardHeader>
      
      <CardContent className={`${compact ? "pb-2 px-4" : "pb-6"} flex-grow`}>
        <div className="space-y-3">
          {!compact && (
            <div className="flex flex-wrap gap-1.5">
              {dish.cuisines.map((cuisine) => (
                <CuisineTag key={cuisine} cuisine={cuisine} size={compact ? "sm" : "md"} />
              ))}
            </div>
          )}
          
          {compact && dish.cuisines.length > 0 && (
            <CuisineTag cuisine={dish.cuisines[0]} size="sm" />
          )}
          
          <div className={`text-sm text-muted-foreground ${compact ? "text-xs" : ""}`}>
            <div className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 mr-1" />
              <span>Last made: {formatDate(dish.lastMade)} {dish.lastMade && `(${formatTimeAgo(dish.lastMade)})`}</span>
            </div>
            <div className="mt-1">Made {dish.timesCooked || 0} {dish.timesCooked === 1 ? "time" : "times"}</div>
          </div>
          
          {dish.sourceId && (
            <div className="mt-2">
              <SourceLink sourceId={dish.sourceId} />
              {dish.location && renderLocation()}
            </div>
          )}
        </div>
      </CardContent>
      
      {showActions && (
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
      )}
    </Card>
  );
};

export default DishCard;
