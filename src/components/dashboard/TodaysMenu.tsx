import React from "react";
import { Calendar, ChefHat } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import DishCard from "@/components/dish-card";
import { AddCookedDishDialog } from "@/components/dialogs";
import { Dish } from "@/types";

interface TodaysMenuProps {
  todaysDishes: Dish[];
  isLoading: boolean;
}

const TodaysMenu = ({ todaysDishes, isLoading }: TodaysMenuProps) => {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <Card className="md:col-span-2 animate-slide-down delay-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-terracotta-500" />
          <div>
            <CardTitle className="text-2xl">Today's Menu</CardTitle>
            <CardDescription>{today}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map(i => (
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
        ) : todaysDishes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {todaysDishes.map(dish => (
              <DishCard
                key={dish.id}
                dish={dish}
                showActions={false}
                compact={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <ChefHat className="mx-auto h-16 w-16 text-muted-foreground opacity-20" />
            <h3 className="mt-4 text-xl font-medium mb-2">
              Nothing planned for today
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Record something you cooked or browse your dishes for inspiration
            </p>
            <AddCookedDishDialog />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TodaysMenu;
