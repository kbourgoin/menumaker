import { describe, it, expect } from "vitest";
import {
  mapMealHistoryFromDB,
  mapMealHistoryToDB,
} from "../mealHistoryMappers";
import type { Tables } from "../../types";
import type { MealHistory } from "@/types";

describe("mealHistoryMappers", () => {
  const mockDBMealHistory: Tables<"meal_history">["Row"] = {
    id: "test-meal-1",
    dishid: "test-dish-1",
    date: "2024-01-15T00:00:00Z",
    notes: "Delicious meal!",
    user_id: "test-user-1",
  };

  describe("mapMealHistoryFromDB", () => {
    it("should map database meal history to application format", () => {
      const result = mapMealHistoryFromDB(mockDBMealHistory);

      expect(result).toEqual({
        id: "test-meal-1",
        dishId: "test-dish-1",
        date: "2024-01-15T00:00:00Z",
        notes: "Delicious meal!",
        userId: "test-user-1",
      });
    });

    it("should handle null notes", () => {
      const historyWithNullNotes = {
        ...mockDBMealHistory,
        notes: null,
      };

      const result = mapMealHistoryFromDB(historyWithNullNotes);

      expect(result).toEqual({
        id: "test-meal-1",
        dishId: "test-dish-1",
        date: "2024-01-15T00:00:00Z",
        notes: undefined, // null converted to undefined
        userId: "test-user-1",
      });
    });

    it("should handle empty string notes", () => {
      const historyWithEmptyNotes = {
        ...mockDBMealHistory,
        notes: "",
      };

      const result = mapMealHistoryFromDB(historyWithEmptyNotes);

      expect(result).toEqual({
        id: "test-meal-1",
        dishId: "test-dish-1",
        date: "2024-01-15T00:00:00Z",
        notes: undefined, // Empty string converted to undefined by mapper
        userId: "test-user-1",
      });
    });
  });

  describe("mapMealHistoryToDB", () => {
    const mockAppMealHistory: Partial<MealHistory> = {
      id: "test-meal-1",
      dishId: "test-dish-1",
      date: "2024-01-15T00:00:00Z",
      notes: "Delicious meal!",
      userId: "test-user-1",
    };

    it("should map application meal history to database format", () => {
      const result = mapMealHistoryToDB(mockAppMealHistory);

      expect(result).toEqual({
        id: "test-meal-1",
        dishid: "test-dish-1",
        date: "2024-01-15T00:00:00Z",
        notes: "Delicious meal!",
        user_id: "test-user-1",
      });
    });

    it("should handle partial meal history object", () => {
      const partialMealHistory: Partial<MealHistory> = {
        id: "test-meal-1",
        dishId: "test-dish-1",
        userId: "test-user-1",
      };

      const result = mapMealHistoryToDB(partialMealHistory);

      expect(result).toEqual({
        id: "test-meal-1",
        dishid: "test-dish-1",
        date: undefined,
        notes: undefined,
        user_id: "test-user-1",
      });
    });

    it("should handle undefined notes", () => {
      const historyWithUndefinedNotes = {
        ...mockAppMealHistory,
        notes: undefined,
      };

      const result = mapMealHistoryToDB(historyWithUndefinedNotes);

      expect(result).toEqual({
        id: "test-meal-1",
        dishid: "test-dish-1",
        date: "2024-01-15T00:00:00Z",
        notes: undefined,
        user_id: "test-user-1",
      });
    });

    it("should throw error when dishId is missing for new meal history", () => {
      const historyWithoutDishId: Partial<MealHistory> = {
        userId: "test-user-1",
        date: "2024-01-15T00:00:00Z",
      };

      expect(() => mapMealHistoryToDB(historyWithoutDishId)).toThrow(
        "DishId is required when creating a new meal history record"
      );
    });

    it("should not throw error when dishId is missing but id exists", () => {
      const historyWithId: Partial<MealHistory> = {
        id: "existing-meal",
        userId: "test-user-1",
      };

      expect(() => mapMealHistoryToDB(historyWithId)).not.toThrow();
    });
  });

  describe("field naming consistency", () => {
    it("should consistently use camelCase for application types", () => {
      const result = mapMealHistoryFromDB(mockDBMealHistory);

      // Ensure all field names are camelCase
      expect(result).toHaveProperty("dishId");
      expect(result).toHaveProperty("userId");

      // Ensure no snake_case field names exist
      expect(result).not.toHaveProperty("dish_id");
      expect(result).not.toHaveProperty("user_id");
    });

    it("should consistently use snake_case for database types", () => {
      const appMealHistory: Partial<MealHistory> = {
        dishId: "test-dish-1",
        userId: "test-user-1",
        date: "2024-01-15T00:00:00Z",
      };

      const result = mapMealHistoryToDB(appMealHistory);

      // Ensure all field names are snake_case for database
      expect(result).toHaveProperty("dishid");
      expect(result).toHaveProperty("user_id");

      // Ensure no camelCase field names exist in DB mapping
      expect(result).not.toHaveProperty("dishId");
      expect(result).not.toHaveProperty("userId");
    });
  });

  describe("round-trip consistency", () => {
    it("should maintain data integrity through DB to App to DB mapping", () => {
      // Start with DB format
      const originalDB = mockDBMealHistory;

      // Map to application format and back
      const app = mapMealHistoryFromDB(originalDB);
      const backToDB = mapMealHistoryToDB(app);

      // Should preserve all data (accounting for field name differences and type conversions)
      expect(backToDB).toEqual({
        id: originalDB.id,
        dishid: originalDB.dishid,
        date: originalDB.date,
        notes: originalDB.notes,
        user_id: originalDB.user_id,
      });
    });
  });
});
