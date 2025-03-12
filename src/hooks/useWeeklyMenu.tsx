
import { Dish } from "@/types";
import { supabase, mapDishFromDB } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export function useWeeklyMenu() {
  // Get dish data using React Query
  const { data: allDishes = [] } = useQuery({
    queryKey: ['dishes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dishes')
        .select('*');
      
      if (error) throw error;
      return data.map(mapDishFromDB);
    }
  });

  // Get weekly dish suggestions
  const getWeeklyDishSuggestions = async (count: number = 7): Promise<Dish[]> => {
    if (!allDishes || allDishes.length === 0) return [];
    if (allDishes.length <= count) return allDishes;
    
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
    getWeeklyDishSuggestions
  };
}
