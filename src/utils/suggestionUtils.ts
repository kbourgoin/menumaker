import { Dish } from "@/types";

/**
 * Category-based dish suggestion utilities
 *
 * Categories:
 * - Reliable Favorites: timesCooked >= 5, made within 60 days
 * - Blast from the Past: timesCooked >= 3, last made 60+ days ago
 * - Give It Another Shot: timesCooked 1-2, last made 30+ days ago
 * - Cuisine You're Missing: dishes from cuisines not cooked in 14+ days
 */

// Constants for category thresholds
const RELIABLE_FAVORITES_MIN_COOKED = 5;
const RELIABLE_FAVORITES_MAX_DAYS = 60;
const BLAST_FROM_PAST_MIN_COOKED = 3;
const BLAST_FROM_PAST_MIN_DAYS = 60;
const GIVE_IT_ANOTHER_SHOT_MIN_COOKED = 1;
const GIVE_IT_ANOTHER_SHOT_MAX_COOKED = 2;
const GIVE_IT_ANOTHER_SHOT_MIN_DAYS = 30;
const CUISINE_MISSING_MIN_DAYS = 14;

/** Calculate days since a date string, returns Infinity if no date */
export const daysSince = (dateStr?: string): number => {
  if (!dateStr) return Infinity;
  const date = new Date(dateStr);
  const today = new Date();
  return Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
};

/** Randomly shuffle an array and return first N items */
export const pickRandom = <T>(items: T[], count: number): T[] => {
  if (items.length <= count) return [...items];
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

/**
 * Reliable Favorites: Dishes you cook often and recently
 * timesCooked >= 5, last made within 60 days
 */
export const getReliableFavorites = (dishes: Dish[]): Dish[] => {
  return dishes.filter(dish => {
    const days = daysSince(dish.lastMade);
    return (
      dish.timesCooked >= RELIABLE_FAVORITES_MIN_COOKED &&
      days <= RELIABLE_FAVORITES_MAX_DAYS
    );
  });
};

/**
 * Blast from the Past: Old favorites you haven't made in a while
 * timesCooked >= 3, last made 60+ days ago
 */
export const getBlastFromPast = (dishes: Dish[]): Dish[] => {
  return dishes.filter(dish => {
    const days = daysSince(dish.lastMade);
    return (
      dish.timesCooked >= BLAST_FROM_PAST_MIN_COOKED &&
      days >= BLAST_FROM_PAST_MIN_DAYS
    );
  });
};

/**
 * Give It Another Shot: Dishes tried once or twice but not recently
 * timesCooked 1-2, last made 30+ days ago
 */
export const getGiveItAnotherShot = (dishes: Dish[]): Dish[] => {
  return dishes.filter(dish => {
    const days = daysSince(dish.lastMade);
    return (
      dish.timesCooked >= GIVE_IT_ANOTHER_SHOT_MIN_COOKED &&
      dish.timesCooked <= GIVE_IT_ANOTHER_SHOT_MAX_COOKED &&
      days >= GIVE_IT_ANOTHER_SHOT_MIN_DAYS
    );
  });
};

/**
 * Cuisine You're Missing: Find cuisines not cooked recently, return dishes from them
 * Returns dishes from cuisines where no dish has been cooked in 14+ days
 */
export const getCuisineYoureMissing = (dishes: Dish[]): Dish[] => {
  // Build a map of cuisine -> most recent cook date
  const cuisineLastCooked = new Map<string, number>();

  dishes.forEach(dish => {
    const days = daysSince(dish.lastMade);
    dish.cuisines.forEach(cuisine => {
      const existing = cuisineLastCooked.get(cuisine);
      if (existing === undefined || days < existing) {
        cuisineLastCooked.set(cuisine, days);
      }
    });
  });

  // Find cuisines not cooked in 14+ days
  const missingCuisines = new Set<string>();
  cuisineLastCooked.forEach((days, cuisine) => {
    if (days >= CUISINE_MISSING_MIN_DAYS) {
      missingCuisines.add(cuisine);
    }
  });

  // Return dishes that have at least one missing cuisine
  return dishes.filter(dish =>
    dish.cuisines.some(cuisine => missingCuisines.has(cuisine))
  );
};

/** Category metadata for UI display */
export interface SuggestionCategory {
  id: string;
  title: string;
  description: string;
  dishes: Dish[];
  emptyMessage: string;
}

/** Get all categorized suggestions */
export const getCategorizedSuggestions = (
  dishes: Dish[],
  countPerCategory: number = 3
): SuggestionCategory[] => {
  const reliableFavorites = getReliableFavorites(dishes);
  const blastFromPast = getBlastFromPast(dishes);
  const giveItAnotherShot = getGiveItAnotherShot(dishes);
  const cuisineYoureMissing = getCuisineYoureMissing(dishes);

  return [
    {
      id: "reliable-favorites",
      title: "Reliable Favorites",
      description: "Dishes you know and love",
      dishes: pickRandom(reliableFavorites, countPerCategory),
      emptyMessage: "Cook your favorites more to see them here!",
    },
    {
      id: "blast-from-past",
      title: "Blast from the Past",
      description: "Old favorites you haven't made in a while",
      dishes: pickRandom(blastFromPast, countPerCategory),
      emptyMessage:
        "Your favorites will appear here once they're due for a comeback",
    },
    {
      id: "give-it-another-shot",
      title: "Give It Another Shot",
      description: "Tried once or twice — worth revisiting?",
      dishes: pickRandom(giveItAnotherShot, countPerCategory),
      emptyMessage: "Dishes you've only tried once will appear here",
    },
    {
      id: "cuisine-youre-missing",
      title: "Cuisine You're Missing",
      description: "Shake up your routine with something different",
      dishes: pickRandom(cuisineYoureMissing, countPerCategory),
      emptyMessage: "You're cooking a good variety!",
    },
  ];
};

/** Refresh a single category with new random picks */
export const refreshCategory = (
  dishes: Dish[],
  categoryId: string,
  count: number = 3
): Dish[] => {
  switch (categoryId) {
    case "reliable-favorites":
      return pickRandom(getReliableFavorites(dishes), count);
    case "blast-from-past":
      return pickRandom(getBlastFromPast(dishes), count);
    case "give-it-another-shot":
      return pickRandom(getGiveItAnotherShot(dishes), count);
    case "cuisine-youre-missing":
      return pickRandom(getCuisineYoureMissing(dishes), count);
    default:
      return [];
  }
};
