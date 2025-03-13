
import { Dish } from "@/types";
import { Card } from "@/components/ui/card";
import { 
  DishCardHeader, 
  DishCardContent 
} from "@/components/dish-card";

interface DishDetailsCardProps {
  dish: Dish;
}

const DishDetailsCard = ({ dish }: DishDetailsCardProps) => {
  return (
    <Card className="overflow-hidden mb-6">
      <DishCardHeader 
        name={dish.name} 
        dishId={dish.id}
        compact={false} 
      />
      
      <DishCardContent 
        cuisines={dish.cuisines}
        lastMade={dish.lastMade}
        timesCooked={dish.timesCooked}
        sourceId={dish.sourceId}
        location={dish.location}
        compact={false}
      />
    </Card>
  );
};

export default DishDetailsCard;
