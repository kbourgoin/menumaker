import { Dish } from "@/types";

// Mock function that was previously imported from dishUtils
const getDishes = (): Dish[] => [];

// Generate random dish suggestions weighted by frequency and recency
export const getRandomDishSuggestions = (count: number = 7): Dish[] => {
  const dishes = getDishes();
  if (dishes.length === 0) return [];
  if (dishes.length <= count) return [...dishes];

  // Calculate the 'weight' for each dish based on:
  // 1. How often it's been cooked (less is better)
  // 2. How recently it's been cooked (longer ago is better)
  const today = new Date();

  // Calculate weights
  const dishesWithWeights = dishes.map(dish => {
    // Frequency weight (inverse of timesCooked)
    const frequencyWeight =
      dish.timesCooked === 0 ? 5 : 10 / (dish.timesCooked + 1);

    // Recency weight (more days since last made = higher weight)
    let recencyWeight = 5; // Default for never made
    if (dish.lastMade) {
      const daysSinceLastMade = Math.max(
        1,
        Math.floor(
          (today.getTime() - new Date(dish.lastMade).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );
      recencyWeight = Math.min(10, daysSinceLastMade / 7); // Cap at 10 (about 10 weeks)
    }

    // Surface old favorites (high times cooked but not recent)
    const oldFavoriteBonus =
      dish.timesCooked > 3 &&
      dish.lastMade &&
      today.getTime() - new Date(dish.lastMade).getTime() >
        90 * 24 * 60 * 60 * 1000 // > 90 days
        ? 5
        : 0;

    const totalWeight = frequencyWeight + recencyWeight + oldFavoriteBonus;

    return {
      dish,
      weight: totalWeight,
    };
  });

  // Sort by weight (higher weights first)
  dishesWithWeights.sort((a, b) => b.weight - a.weight);

  // Get the top dishes by weight, but add some randomness by selecting from the top 60%
  const topDishes = dishesWithWeights.slice(
    0,
    Math.max(count * 2, Math.floor(dishes.length * 0.6))
  );

  // Randomly select from top-weighted dishes
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
