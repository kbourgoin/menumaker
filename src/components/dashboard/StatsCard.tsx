
import React from "react";
import { Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

// Define colors for the pie chart
const COLORS = ['#FF6B6B', '#4ECDC4', '#FFD166', '#F9F871', '#6A0572', '#AB83A1', '#15616D'];

import type { StatsData } from "@/types";

interface StatsCardProps {
  stats: StatsData | null;
  isLoading: boolean;
}

const StatsCard = ({ stats, isLoading }: StatsCardProps) => {
  // Prepare data for pie chart
  const pieData = stats && stats.cuisineBreakdown
    ? Object.entries(stats.cuisineBreakdown)
        .map(([name, value]) => ({ name, value }))
        .filter(item => (item.value as number) > 0)
        .sort((a, b) => (b.value as number) - (a.value as number))
    : [];

  return (
    <Card className="animate-slide-down delay-100">
      <CardHeader>
        <CardTitle className="text-xl">Your Stats</CardTitle>
        <CardDescription>Summary of your cooking data</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-2/3"></div>
            <div className="h-6 bg-slate-200 rounded w-3/4"></div>
            <div className="h-6 bg-slate-200 rounded w-1/2"></div>
          </div>
        ) : stats ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Dishes:</span>
              <span className="font-medium">{stats.totalDishes}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Times Cooked:</span>
              <span className="font-medium">{stats.totalTimesCooked}</span>
            </div>
            
            {stats.mostCooked && (
              <div className="pt-2">
                <span className="text-sm text-muted-foreground">Most Cooked:</span>
                <div className="mt-1 font-medium text-sm flex justify-between items-center">
                  <span>{stats.mostCooked.name}</span>
                  <span>{stats.mostCooked.timesCooked}x</span>
                </div>
              </div>
            )}
            
            {pieData.length > 0 && (
              <div className="mt-6">
                <span className="text-sm text-muted-foreground mb-2 block">Cuisine Distribution:</span>
                <div className="h-[150px] mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground">No stats available yet.</p>
            <p className="text-sm mt-1">Add some dishes to see your stats!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
