
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useDishes } from "@/hooks/useMeals";
import Layout from "@/components/Layout";
import SEOHead, { getPageSEO } from "@/components/SEOHead";

// Import our new component files
import QuickActions from "@/components/dashboard/QuickActions";
import StatsCard from "@/components/dashboard/StatsCard";
import SuggestedDishes from "@/components/dashboard/SuggestedDishes";
import RecentlyCooked from "@/components/dashboard/RecentlyCooked";

const Home = () => {
  const { getWeeklyDishSuggestions, getStats } = useDishes();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // Use React Query for suggestion data with reduced staleTime
  const { data: suggestedDishes = [], isLoading: suggestionsLoading, refetch: refetchSuggestions } = 
    useQuery({
      queryKey: ['suggestedDishes'],
      queryFn: () => getWeeklyDishSuggestions(3),
      staleTime: 30 * 1000, // 30 seconds instead of 5 minutes
      refetchOnMount: true, // Refetch when component mounts
      refetchOnWindowFocus: true, // Refetch when window gets focus
    });
  
  // Use React Query for stats data with reduced staleTime
  const { data: stats, isLoading: statsLoading } = 
    useQuery({
      queryKey: ['dashboardStats'],
      queryFn: getStats,
      staleTime: 30 * 1000, // 30 seconds instead of 5 minutes
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    });

  const isLoading = suggestionsLoading || statsLoading;
  
  // Add effect to invalidate the cache if data is empty when loaded
  useEffect(() => {
    if (!suggestionsLoading && suggestedDishes && suggestedDishes.length === 0) {
      // If we've finished loading and still have no suggestions, invalidate the cache
      queryClient.invalidateQueries({ queryKey: ['suggestedDishes'] });
    }
    
    if (!statsLoading && (!stats || !stats.totalDishes)) {
      // If we've finished loading and have empty stats, invalidate the cache
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    }
  }, [suggestionsLoading, statsLoading, suggestedDishes, stats, queryClient]);
  
  const handleSuggestMoreDishes = async () => {
    try {
      setIsRefreshing(true);
      await refetchSuggestions();
      
      toast({
        title: "New suggestions generated",
        description: "Here are some fresh dish ideas for you to cook."
      });
    } catch (error) {
      console.error("Error generating suggestions:", error);
      toast({
        title: "Error generating suggestions",
        description: "There was a problem generating new suggestions.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Layout>
      <SEOHead {...getPageSEO('home')} />
      <div className="max-w-6xl mx-auto">
        {/* Quick actions and Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <QuickActions />
          <StatsCard stats={stats} isLoading={isLoading} />
        </div>
        
        {/* Suggested Dishes */}
        <SuggestedDishes 
          suggestedDishes={suggestedDishes}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          onRefresh={handleSuggestMoreDishes}
        />
        
        {/* Recently Cooked */}
        <RecentlyCooked 
          recentlyCooked={stats?.recentlyCooked || []}
          isLoading={isLoading}
        />
      </div>
    </Layout>
  );
};

export default Home;
