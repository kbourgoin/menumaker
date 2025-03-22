
import { Dish } from "@/types";
import { Card } from "@/components/ui/card";
import DishCardHeader from "./DishCardHeader";
import DishCardContent from "./DishCardContent";
import DishCardActions from "./DishCardActions";

interface DishCardProps {
  dish: Dish;
  showActions?: boolean;
  compact?: boolean;
  onDeleted?: () => void;
}

const DishCard = ({ dish, showActions = true, compact = false, onDeleted }: DishCardProps) => {
  // Safety check for valid dish object
  if (!dish || typeof dish !== 'object' || !dish.id) {
    console.error("Invalid dish passed to DishCard:", dish);
    return null;
  }

  return (
    <Card className="transition-all duration-300 hover:shadow-md overflow-hidden group flex flex-col h-full">
      <DishCardHeader 
        name={dish.name} 
        dishId={dish.id}
        compact={compact} 
      />
      
      <DishCardContent 
        cuisines={dish.cuisines || []}
        lastMade={dish.lastMade}
        timesCooked={dish.timesCooked || 0}
        sourceId={dish.sourceId}
        location={dish.location}
        compact={compact}
        lastComment={dish.lastComment}
      />
      
      {showActions && (
        <DishCardActions 
          dish={dish} 
          compact={compact} 
          onDeleted={onDeleted} 
        />
      )}
    </Card>
  );
};

export default DishCard;
