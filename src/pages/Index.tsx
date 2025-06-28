
import React from "react";
import { useToast } from "@/hooks/use-toast";
import { useDishes } from "@/hooks/useMeals";
import { useMealHistoryByDate } from "@/hooks/useMealHistoryByDate";
import Layout from "@/components/Layout";
import SEOHead, { getPageSEO } from "@/components/SEOHead";
import { Dish } from "@/types";

// Import our new component files
import TodaysMenu from "@/components/dashboard/TodaysMenu";
import ComingUp from "@/components/dashboard/ComingUp";
import StatsCard from "@/components/dashboard/StatsCard";

const Home = () => {
  const { stats, statsLoading } = useDishes();
  const { getTodaysMeals, getUpcomingMeals, isLoading: mealHistoryLoading } = useMealHistoryByDate();
  const { toast } = useToast();

  const isLoading = statsLoading || mealHistoryLoading;

  // Get today's and upcoming dishes from meal history
  const todaysDishes = getTodaysMeals();
  const upcomingDishes = getUpcomingMeals();

  return (
    <Layout>
      <SEOHead {...getPageSEO('home')} />
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Today's Menu - Hero Card */}
        <TodaysMenu 
          todaysDishes={todaysDishes}
          isLoading={isLoading}
        />
        
        {/* Secondary Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ComingUp 
            upcomingDishes={upcomingDishes}
            isLoading={isLoading}
          />
          <StatsCard stats={stats} isLoading={isLoading} />
        </div>
      </div>
    </Layout>
  );
};

export default Home;
