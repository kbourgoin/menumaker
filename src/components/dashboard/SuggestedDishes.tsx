import React from "react";
import { Link } from "react-router-dom";
import { Plus, Shuffle, Utensils } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DishCard from "@/components/dish-card";
import { Dish } from "@/types";

interface SuggestedDishesProps {
  suggestedDishes: Dish[];
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
}

const SuggestedDishes = ({
  suggestedDishes,
  isLoading,
  isRefreshing,
  onRefresh,
}: SuggestedDishesProps) => {
  return (
    <Card className="mb-6 animate-slide-down delay-150">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">Suggested Dishes</CardTitle>
          <CardDescription>Try cooking one of these today</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing || isLoading}
          className="border-terracotta-200 text-terracotta-500 hover:bg-terracotta-50"
        >
          <Shuffle className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="animate-pulse space-y-3 border rounded-lg p-4"
              >
                <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                <div className="h-10 bg-slate-200 rounded w-full mt-4"></div>
              </div>
            ))}
          </div>
        ) : suggestedDishes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {suggestedDishes.map(dish => (
              <DishCard key={dish.id} dish={dish} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Utensils className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
            <h3 className="mt-4 text-lg font-medium mb-1">
              No dishes available
            </h3>
            <p className="text-muted-foreground mb-4">
              Add some dishes to get suggestions
            </p>
            <Link to="/add-meal">
              <Button className="bg-terracotta-500 hover:bg-terracotta-600">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Dish
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SuggestedDishes;
