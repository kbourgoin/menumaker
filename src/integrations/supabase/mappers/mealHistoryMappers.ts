/**
 * DEPRECATED: This file is deprecated in favor of centralized type mapping.
 * Use @/utils/typeMapping instead for all new code.
 * This file is kept for backward compatibility during migration.
 */

import { Database } from "../types";
import { DBMealHistory } from "./types";
import { MealHistory } from "@/types";

// Re-export the new standardized mappers
export { mapMealHistoryFromDB, mapMealHistoryToDB } from "@/utils/typeMapping";

// DEPRECATED: Legacy mapping functions below
// These are kept for backward compatibility only
// Use imports above for all new code

/**
 * @deprecated Use mapMealHistoryFromDB from @/utils/typeMapping instead
 */
export const mapMealHistoryFromDB_LEGACY = (
  history: DBMealHistory
): MealHistory => ({
  id: history.id,
  dishId: history.dishid,
  date: history.date,
  notes: history.notes || undefined,
  userId: history.user_id,
});

/**
 * @deprecated Use mapMealHistoryToDB from @/utils/typeMapping instead
 */
export const mapMealHistoryToDB_LEGACY = (
  history: Partial<MealHistory>
): Partial<Database["public"]["Tables"]["meal_history"]["Insert"]> => {
  // Ensure required fields are present when inserting a new meal history record
  if (history.dishId === undefined && !history.id) {
    throw new Error(
      "DishId is required when creating a new meal history record"
    );
  }

  return {
    id: history.id,
    dishid: history.dishId,
    date: history.date,
    notes: history.notes,
    user_id: history.userId,
  };
};
