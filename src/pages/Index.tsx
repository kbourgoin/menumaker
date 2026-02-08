import React from "react";
import { useToast } from "@/hooks/use-toast";
import { useDishes } from "@/hooks/useMeals";
import { useMealHistoryByDate } from "@/hooks/meal-history/useMealHistoryByDate";
import { useStats } from "@/hooks/stats/useStats";
import { Layout } from "@/components/layout";
import { SEOHead, getPageSEO } from "@/components/shared";
import { ErrorMessage, ErrorFallback } from "@/components/shared";
import { isNetworkError } from "@/utils/errorHandling";

// Import our new component files
import TodaysMenu from "@/components/dashboard/TodaysMenu";
import WeekTimeline from "@/components/dashboard/WeekTimeline";
import StatsCard from "@/components/dashboard/StatsCard";

const Home = () => {
  const { isLoading: dishesLoading, error: dishesError } = useDishes();
  const {
    getTodaysMeals,
    getRecentMeals,
    getUpcomingMeals,
    isLoading: mealHistoryLoading,
  } = useMealHistoryByDate();
  const { stats, isLoading: statsLoading } = useStats();
  const { toast } = useToast();

  const isLoading = dishesLoading || mealHistoryLoading;

  // Get today's, recent, and upcoming dishes from meal history
  const todaysDishes = getTodaysMeals();
  const recentMeals = getRecentMeals(3);
  const upcomingMeals = getUpcomingMeals();

  // Handle critical errors that prevent page from loading
  if (dishesError && !isLoading) {
    return (
      <Layout>
        <SEOHead {...getPageSEO("home")} />
        <ErrorFallback
          error={dishesError}
          onRetry={() => window.location.reload()}
          onGoHome={() => (window.location.href = "/")}
          context="dashboard"
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead {...getPageSEO("home")} />
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Show error message for non-critical errors */}
        {dishesError && isNetworkError(dishesError) && (
          <ErrorMessage
            error={dishesError}
            onRetry={() => window.location.reload()}
            onDismiss={() => {
              // In a real app, you might want to retry the specific query
              toast({
                title: "Error dismissed",
                description: "Some data may be incomplete.",
              });
            }}
            compact
          />
        )}

        {/* Today's Menu - Hero Card */}
        <TodaysMenu todaysDishes={todaysDishes} isLoading={isLoading} />

        {/* Secondary Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <WeekTimeline recentMeals={recentMeals} upcomingMeals={upcomingMeals} isLoading={isLoading} />
          <StatsCard stats={stats} isLoading={statsLoading} />
        </div>
      </div>
    </Layout>
  );
};

export default Home;
