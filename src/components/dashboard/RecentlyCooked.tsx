import React from "react";
import { Link } from "react-router-dom";
import { Check, ChevronRight, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import type { MealHistoryWithDish } from "@/types";

interface RecentlyCookedProps {
  recentlyCooked: MealHistoryWithDish[];
  isLoading: boolean;
}

const RecentlyCooked = React.memo<RecentlyCookedProps>(
  ({ recentlyCooked, isLoading }) => {
    return (
      <Card className="animate-slide-down delay-200">
        <CardHeader>
          <CardTitle className="text-xl">Recently Cooked</CardTitle>
          <CardDescription>Your meal history</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="flex items-center border rounded-lg p-3"
                >
                  <div className="w-8 h-8 bg-slate-200 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentlyCooked && recentlyCooked.length > 0 ? (
            <div className="space-y-3">
              {recentlyCooked.map(
                (item: MealHistoryWithDish, index: number) => (
                  <div
                    key={index}
                    className="flex items-center border rounded-lg p-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-terracotta-100 flex items-center justify-center mr-3 text-terracotta-500">
                      <Check className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">
                        {item.dish ? item.dish.name : "Unknown Dish"}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(item.date).toLocaleDateString()}
                      </div>
                    </div>
                    {item.dish && (
                      <Link to={`/meal/${item.dish.id}`}>
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
              <h3 className="mt-4 text-lg font-medium mb-1">
                No cooking history yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Record when you cook a dish to see your history
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);

RecentlyCooked.displayName = "RecentlyCooked";

export default RecentlyCooked;
