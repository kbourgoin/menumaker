
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

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

  return (
    <Card 
      className="transition-all duration-300 hover:shadow-md overflow-hidden group flex flex-col h-full" 
      onClick={handleCardClick}
    >
      <DishCardHeader name={dish.name} compact={compact} />
      
      <DishCardContent 
        cuisines={dish.cuisines}
        lastMade={dish.lastMade}
        timesCooked={dish.timesCooked}
        sourceId={dish.sourceId}
        location={dish.location}
        compact={compact}
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
