
import { Dish } from "@/types";
import { supabase, mapDishFromDB } from "@/integrations/supabase/client";

export function useWeeklyMenu() {
  // Get weekly dish suggestions
  const getWeeklyDishSuggestions = async (count: number = 7): Promise<Dish[]> => {
    // This is complex logic that would be better as a Postgres function
    // For now, we'll fetch all dishes and calculate client-side
    const { data: allDishes, error } = await supabase
      .from('dishes')
      .select('*');
      
    if (error) throw error;
    
    if (!allDishes || allDishes.length === 0) return [];
    if (allDishes.length <= count) return allDishes.map(mapDishFromDB);
    
    // The weighted random logic would be similar to the localStorage version
    // but can be moved to a database function later
    const today = new Date();
    
    // Calculate weights (simplified version of the original logic)
    const dishesWithWeights = allDishes.map(dish => {
      const mappedDish = mapDishFromDB(dish);
      const frequencyWeight = mappedDish.timesCooked === 0 ? 5 : (10 / (mappedDish.timesCooked + 1));
      
      let recencyWeight = 5; // Default for never made
      if (mappedDish.lastMade) {
        const daysSinceLastMade = Math.max(
          1, 
          Math.floor((today.getTime() - new Date(mappedDish.lastMade).getTime()) / (1000 * 60 * 60 * 24))
        );
        recencyWeight = Math.min(10, daysSinceLastMade / 7);
      }
      
      const oldFavoriteBonus = 
        mappedDish.timesCooked > 3 && 
        mappedDish.lastMade && 
        (today.getTime() - new Date(mappedDish.lastMade).getTime()) > (90 * 24 * 60 * 60 * 1000)
          ? 5 
          : 0;
      
      return {
        dish: mappedDish,
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
