import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shuffle, CalendarPlus } from "lucide-react";
import DishCard from "@/components/dish-card";
import { Dish } from "@/types";

interface SuggestionCategoryProps {
  id: string;
  title: string;
  description: string;
  dishes: Dish[];
  emptyMessage: string;
  onShuffle: (categoryId: string) => void;
  onPlanMeal: (dish: Dish) => void;
  isShuffling?: boolean;
}

export function SuggestionCategory({
  id,
  title,
  description,
  dishes,
  emptyMessage,
  onShuffle,
  onPlanMeal,
  isShuffling = false,
}: SuggestionCategoryProps) {
  const hasDishes = dishes.length > 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl font-serif">{title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          {hasDishes && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onShuffle(id)}
              disabled={isShuffling}
              className="text-muted-foreground hover:text-foreground"
            >
              <Shuffle
                className={`h-4 w-4 ${isShuffling ? "animate-spin" : ""}`}
              />
              <span className="ml-2 hidden sm:inline">Shuffle</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {hasDishes ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dishes.map(dish => (
              <div key={dish.id} className="relative group">
                <DishCard dish={dish} showActions={false} compact />
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    onClick={() => onPlanMeal(dish)}
                    className="bg-terracotta-500 hover:bg-terracotta-600 shadow-md"
                  >
                    <CalendarPlus className="h-4 w-4 mr-1" />
                    Plan
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <p>{emptyMessage}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SuggestionCategory;
