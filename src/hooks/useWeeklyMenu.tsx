
import { Dish } from "@/types";
import { supabase, mapDishFromSummary } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export function useWeeklyMenu() {
  // Get dish data using React Query and the materialized view
  const { data: allDishes = [], isLoading } = useQuery({
    queryKey: ['dishes'],
    queryFn: async () => {
      const user = await supabase.auth.getUser();
      const user_id = user.data.user?.id;
      
      if (!user_id) {
        return [];
      }
      
      // Use the materialized view for much faster performance
      const { data: summaryData, error: summaryError } = await supabase
        .from('dish_summary')
        .select('*')
        .eq('user_id', user_id);
      
      if (summaryError) {
        console.error("Error fetching from dish_summary:", summaryError);
        return [];
      }
      
      // Map the summary data to our Dish type
      return summaryData ? summaryData.map(summary => mapDishFromSummary(summary)) : [];
    },
    // Enable stale time for caching
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get weekly dish suggestions
  const getWeeklyDishSuggestions = async (count: number = 7): Promise<Dish[]> => {
    if (!allDishes || allDishes.length === 0) return [];
    if (allDishes.length <= count) return [...allDishes];
    
    // Calculate weights for dish suggestions
    const today = new Date();
    
    // Weight calculations
    const dishesWithWeights = allDishes.map(dish => {
      const frequencyWeight = dish.timesCooked === 0 ? 5 : (10 / (dish.timesCooked + 1));
      
      let recencyWeight = 5; // Default for never made
      if (dish.lastMade) {
        const daysSinceLastMade = Math.max(
          1, 
          Math.floor((today.getTime() - new Date(dish.lastMade).getTime()) / (1000 * 60 * 60 * 24))
        );
        recencyWeight = Math.min(10, daysSinceLastMade / 7);
      }
      
      const oldFavoriteBonus = 
        dish.timesCooked > 3 && 
        dish.lastMade && 
        (today.getTime() - new Date(dish.lastMade).getTime()) > (90 * 24 * 60 * 60 * 1000)
          ? 5 
          : 0;
      
      return {
        dish,
        weight: frequencyWeight + recencyWeight + oldFavoriteBonus
      };
    });
    
    // Sort by weight (higher weights first)
    dishesWithWeights.sort((a, b) => b.weight - a.weight);
    
    // Get the top dishes by weight with some randomness
    const topDishes = dishesWithWeights.slice(0, Math.max(count * 2, Math.floor(allDishes.length * 0.6)));
    
    const suggestions: Dish[] = [];
    const selectedIndexes = new Set<number>();
    
    while (suggestions.length < count && suggestions.length < topDishes.length) {
      const randomIndex = Math.floor(Math.random() * topDishes.length);
      if (!selectedIndexes.has(randomIndex)) {
        selectedIndexes.add(randomIndex);
        suggestions.push(topDishes[randomIndex].dish);
      }
    }
    
    return suggestions;
  };

  return {
    allDishes,
    isLoading,
    getWeeklyDishSuggestions
  };
}
