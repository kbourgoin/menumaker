
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dish } from "@/types";
import CuisineTag from "../CuisineTag";
import SourceLink from "../SourceLink";
import { MapPin, Calendar, UtensilsCrossed } from "lucide-react";

interface DishDetailsCardProps {
  dish: Dish;
}

const DishDetailsCard = ({ dish }: DishDetailsCardProps) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-terracotta-50 pb-4">
        <CardTitle className="text-2xl font-serif">{dish.name}</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {dish.cuisines?.map((cuisine) => (
              <CuisineTag key={cuisine} cuisine={cuisine} />
            ))}
          </div>
          
          <div className="space-y-2">
            {dish.location && (
              <div className="flex items-center text-sm text-gray-500">
                <MapPin className="w-4 h-4 mr-1.5" />
                <span>{dish.location}</span>
              </div>
            )}
            
            {dish.sourceId && (
              <div className="flex items-center">
                <SourceLink sourceId={dish.sourceId} />
              </div>
            )}
            
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="w-4 h-4 mr-1.5" />
              <span>Added {format(new Date(dish.createdAt), "MMMM d, yyyy")}</span>
            </div>
            
            <div className="flex items-center text-sm text-gray-500">
              <UtensilsCrossed className="w-4 h-4 mr-1.5" />
              <span>Cooked {dish.timesCooked} {dish.timesCooked === 1 ? "time" : "times"}</span>
            </div>
            
            {dish.lastMade && (
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-1.5" />
                <span>Last made {format(new Date(dish.lastMade), "MMMM d, yyyy")}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DishDetailsCard;
