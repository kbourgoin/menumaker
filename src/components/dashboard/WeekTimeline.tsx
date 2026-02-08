import React from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, ChevronRight, ArrowUp, History } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dish } from "@/types";

interface DayGroup {
  date: string;
  dishes: Dish[];
}

interface WeekTimelineProps {
  recentMeals: DayGroup[];
  upcomingMeals: DayGroup[];
  isLoading: boolean;
}

const getDateLabel = (dateStr: string): string => {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const toKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dy = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dy}`;
  };

  if (dateStr === toKey(yesterday)) return "Yesterday";
  if (dateStr === toKey(tomorrow)) return "Tomorrow";

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const DishRow = ({ dish }: { dish: Dish }) => (
  <Link
    to={`/meal/${dish.id}`}
    className="flex items-center justify-between p-1.5 rounded hover:bg-slate-50 transition-colors group"
  >
    <span className="text-sm font-medium truncate">{dish.name}</span>
    <div className="flex items-center gap-1.5 flex-shrink-0">
      {dish.cuisines && dish.cuisines.length > 0 && (
        <Badge variant="secondary" className="text-xs">
          {dish.cuisines[0]}
        </Badge>
      )}
      <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  </Link>
);

const DaySection = ({ group }: { group: DayGroup }) => (
  <div className="space-y-0.5">
    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
      {getDateLabel(group.date)}
    </div>
    {group.dishes.map(dish => (
      <DishRow key={`${group.date}-${dish.id}`} dish={dish} />
    ))}
  </div>
);

const WeekTimeline = ({
  recentMeals,
  upcomingMeals,
  isLoading,
}: WeekTimelineProps) => {
  const hasRecent = recentMeals.length > 0;
  const hasUpcoming = upcomingMeals.length > 0;
  const isEmpty = !hasRecent && !hasUpcoming;

  return (
    <Card className="animate-slide-down delay-100">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-terracotta-500" />
          <div>
            <CardTitle className="text-lg">This Week</CardTitle>
            <CardDescription>Recent and upcoming meals</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                <div className="h-5 bg-slate-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <div className="text-center py-6">
            <Calendar className="mx-auto h-8 w-8 text-muted-foreground opacity-20" />
            <p className="text-sm text-muted-foreground mt-2">
              No meals this week yet
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {hasUpcoming && (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-terracotta-500 uppercase tracking-wide">
                  <ArrowUp className="h-3 w-3" />
                  Coming up
                </div>
                {upcomingMeals.map(group => (
                  <DaySection key={group.date} group={group} />
                ))}
              </div>
            )}

            {hasRecent && (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2 border-t">
                  <History className="h-3 w-3" />
                  Recently cooked
                </div>
                <div className="space-y-3 text-muted-foreground">
                  {recentMeals.map(group => (
                    <DaySection key={group.date} group={group} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeekTimeline;
