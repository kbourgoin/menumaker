
import { Dish } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CuisineTag from "@/components/CuisineTag";
import SourceLink from "@/components/SourceLink";

interface DishDetailsCardProps {
  dish: Dish;
}

const DishDetailsCard = ({ dish }: DishDetailsCardProps) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-2xl font-serif">{dish.name}</CardTitle>
        <div className="flex flex-wrap gap-2 mt-2">
          {dish.cuisines.map(cuisine => (
            <CuisineTag key={cuisine} cuisine={cuisine} />
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground mb-4">
          <div className="mb-2">Cooked {dish.timesCooked} {dish.timesCooked === 1 ? "time" : "times"}</div>
          {dish.source && dish.source.type !== 'none' && (
            <div className="mt-2">
              <SourceLink source={dish.source} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DishDetailsCard;
