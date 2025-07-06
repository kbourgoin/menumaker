import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Define colors for the charts
const COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#FFD166",
  "#F9F871",
  "#6A0572",
  "#AB83A1",
  "#15616D",
];

import type { StatsData } from "@/types";

interface StatsCardProps {
  stats: StatsData | null;
  isLoading: boolean;
}

const StatsCard = React.memo<StatsCardProps>(({ stats, isLoading }) => {
  const navigate = useNavigate();
  const [showAllCuisines, setShowAllCuisines] = useState(false);

  // Prepare cuisine data
  const cuisineData = React.useMemo(() => {
    return stats && stats.cuisineBreakdown
      ? Object.entries(stats.cuisineBreakdown)
          .map(([name, value]) => ({ name, value }))
          .filter(item => (item.value as number) > 0)
          .sort((a, b) => (b.value as number) - (a.value as number))
      : [];
  }, [stats]);

  // Get top dishes from stats data
  const topDishes = React.useMemo(() => {
    return stats?.topDishes || [];
  }, [stats]);

  const handleCuisineClick = (cuisine: string) => {
    navigate(`/all-meals?tag=${encodeURIComponent(cuisine)}`);
  };

  const cuisinesToShow = showAllCuisines
    ? cuisineData
    : cuisineData.slice(0, 5);

  return (
    <Card className="animate-slide-down delay-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Your Stats</CardTitle>
        <CardDescription>Cooking summary</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-5 bg-slate-200 rounded w-2/3"></div>
            <div className="h-5 bg-slate-200 rounded w-3/4"></div>
            <div className="h-5 bg-slate-200 rounded w-1/2"></div>
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">
                  Total Dishes:
                </span>
                <span className="font-medium">{stats.totalDishes}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">
                  Times Cooked:
                </span>
                <span className="font-medium">{stats.totalTimesCooked}</span>
              </div>
            </div>

            {topDishes.length > 0 && (
              <div>
                <span className="text-sm text-muted-foreground mb-2 block">
                  Top 5 Most Cooked:
                </span>
                <div className="space-y-1">
                  {topDishes.map((dish, _index) => (
                    <div
                      key={dish.id}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="truncate font-medium">{dish.name}</span>
                      <span className="text-muted-foreground ml-2">
                        {dish.timesCooked}x
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cuisineData.length > 0 && (
              <div>
                <span className="text-sm text-muted-foreground mb-2 block">
                  Top 5 Cuisines:
                </span>
                <div className="space-y-1.5">
                  {cuisinesToShow.map((item, index) => {
                    const total = cuisineData.reduce(
                      (sum, curr) => sum + (curr.value as number),
                      0
                    );
                    const percentage = Math.round(
                      ((item.value as number) / total) * 100
                    );
                    return (
                      <div key={item.name} className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <button
                              onClick={() => handleCuisineClick(item.name)}
                              className="text-sm font-medium truncate hover:text-terracotta-600 transition-colors cursor-pointer text-left"
                            >
                              {item.name}
                            </button>
                            <span className="text-xs text-muted-foreground ml-2">
                              {percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1 mt-0.5">
                            <div
                              className="h-1 rounded-full transition-all duration-300"
                              style={{
                                backgroundColor: COLORS[index % COLORS.length],
                                width: `${percentage}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {cuisineData.length > 5 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllCuisines(!showAllCuisines)}
                      className="w-full text-xs text-muted-foreground hover:text-terracotta-600 p-1 h-auto"
                    >
                      {showAllCuisines ? (
                        <>
                          <ChevronUp className="w-3 h-3 mr-1" />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3 mr-1" />+
                          {cuisineData.length - 5} more cuisines
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-3">
            <p className="text-muted-foreground">No stats available yet.</p>
            <p className="text-sm mt-1">Add some dishes to see your stats!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

StatsCard.displayName = "StatsCard";

export default StatsCard;
