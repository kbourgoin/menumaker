/**
 * DEPRECATED: This file is deprecated in favor of centralized type mapping.
 * Use @/utils/typeMapping instead for all new code.
 * This file is kept for backward compatibility during migration.
 */

import { Database, Json, Tables } from "../types";
import { DBDish, DishSummary } from "./types";
import { Dish } from "@/types";

// Re-export the new standardized mappers
export {
  mapDishFromDB,
  mapDishFromSummary,
  mapDishToDB,
} from "@/utils/typeMapping";

// DEPRECATED: Legacy mapping functions below
// These are kept for backward compatibility only
// Use imports above for all new code

/**
 * @deprecated Use mapDishFromDB from @/utils/typeMapping instead
 */
export const mapDishFromDB_LEGACY = (
  dish: DBDish,
  mealHistory?: Tables<"meal_history">[]
): Dish => {
  // Default values for derived fields
  let timesCooked = 0;
  let lastMade: string | undefined = undefined;
  let lastComment: string | undefined = undefined;

  // If meal history is provided, use it to calculate timesCooked and lastMade
  if (mealHistory && mealHistory.length > 0) {
    timesCooked = mealHistory.length;

    // Find the most recent meal date
    const sortedHistory = [...mealHistory].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    if (sortedHistory.length > 0) {
      lastMade = sortedHistory[0].date;

      // Find the most recent non-empty comment
      const historyWithComments = sortedHistory.filter(
        entry => entry.notes && entry.notes.trim() !== ""
      );
      if (historyWithComments.length > 0) {
        lastComment = historyWithComments[0].notes;
      }
    }
  }

  return {
    id: dish.id,
    name: dish.name,
    createdAt: dish.createdat,
    cuisines: dish.cuisines,
    sourceId: dish.source_id,
    location: dish.location,
    lastMade, // Derived value
    timesCooked, // Derived value
    lastComment, // Derived value from most recent note
    userId: dish.user_id,
    tags: [], // Default empty array for dishes fetched without tags
  };
};

/**
 * @deprecated Use mapDishFromSummary from @/utils/typeMapping instead
 */
export const mapDishFromSummary_LEGACY = (summary: DishSummary): Dish => {
  return {
    id: summary.id,
    name: summary.name,
    createdAt: summary.createdat,
    cuisines: summary.cuisines,
    sourceId: summary.source_id,
    location: summary.location,
    lastMade: summary.last_made,
    timesCooked: summary.times_cooked || 0,
    lastComment: summary.last_comment,
    userId: summary.user_id,
    tags: summary.tags || [],
  };
};

/**
 * @deprecated Use mapDishToDB from @/utils/typeMapping instead
 */
export const mapDishToDB_LEGACY = (
  dish: Partial<Dish>
): Partial<Database["public"]["Tables"]["dishes"]["Insert"]> => {
  // Ensure required fields are present when inserting a new dish
  if (dish.name === undefined && !dish.id) {
    throw new Error("Name is required when creating a new dish");
  }

  return {
    id: dish.id,
    name: dish.name,
    createdat: dish.createdAt,
    cuisines: dish.cuisines,
    source_id: dish.sourceId,
    location: dish.location,
    user_id: dish.userId,
  };
};
