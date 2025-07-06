import React from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, ChefHat } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dish } from "@/types";

interface ComingUpProps {
  upcomingDishes: Array<{ date: string; dishes: Dish[] }>;
  isLoading: boolean;
}

const ComingUp = ({ upcomingDishes, isLoading }: ComingUpProps) => {
  const getDateLabel = (dateStr: string) => {
    // Parse the YYYY-MM-DD string manually to avoid timezone issues
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Compare using local date strings to avoid timezone issues
    const getLocalDateString = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dy = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${dy}`;
    };

    const tomorrowStr = getLocalDateString(tomorrow);

    if (dateStr === tomorrowStr) {
      return "Tomorrow";
    }

    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card className="animate-slide-down delay-100">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-terracotta-500" />
          <div>
            <CardTitle className="text-lg">Coming Up</CardTitle>
            <CardDescription>All upcoming meals</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                <div className="h-6 bg-slate-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : upcomingDishes.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {upcomingDishes.map(({ date, dishes }, index) => (
              <div key={index} className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  {getDateLabel(date)}
                </div>
                <div className="space-y-1">
                  {dishes.map(dish => (
                    <Link
                      key={dish.id}
                      to={`/meal/${dish.id}`}
                      className="block p-2 rounded hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">
                          {dish.name}
                        </span>
                        {dish.cuisines && dish.cuisines.length > 0 && (
                          <Badge
                            variant="secondary"
                            className="text-xs ml-2 flex-shrink-0"
                          >
                            {dish.cuisines[0]}
                          </Badge>
                        )}
                      </div>
                    </Link>
                  ))}
                  {dishes.length > 2 && (
                    <div className="text-xs text-muted-foreground px-2">
                      +{dishes.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Calendar className="mx-auto h-8 w-8 text-muted-foreground opacity-20" />
            <p className="text-sm text-muted-foreground mt-2">
              No upcoming meals planned
            </p>
            <Link to="/weekly-menu">
              <Button variant="ghost" size="sm" className="mt-2 text-xs">
                Plan ahead
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ComingUp;
