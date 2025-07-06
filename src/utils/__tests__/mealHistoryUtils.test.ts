import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getMealHistory,
  saveMealHistory,
  logDishCooked,
} from "../mealHistoryUtils";

// Mock storageUtils
vi.mock("../storageUtils", () => ({
  getStorageItem: vi.fn(),
  saveStorageItem: vi.fn(),
}));

import { getStorageItem, saveStorageItem } from "../storageUtils";

describe("mealHistoryUtils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getMealHistory", () => {
    it("should return meal history from storage", () => {
      const mockHistory = [
        {
          date: "2024-01-01T00:00:00Z",
          dishId: "dish-1",
          notes: "Great meal!",
        },
        { date: "2024-01-02T00:00:00Z", dishId: "dish-2" },
      ];
      vi.mocked(getStorageItem).mockReturnValue(mockHistory);

      const result = getMealHistory();

      expect(getStorageItem).toHaveBeenCalledWith("mealHistory", []);
      expect(result).toEqual(mockHistory);
    });

    it("should return empty array if no history in storage", () => {
      vi.mocked(getStorageItem).mockReturnValue([]);

      const result = getMealHistory();

      expect(result).toEqual([]);
    });
  });

  describe("saveMealHistory", () => {
    it("should save meal history to storage", () => {
      const history = [
        {
          date: "2024-01-01T00:00:00Z",
          dishId: "dish-1",
          notes: "Great meal!",
        },
      ];

      saveMealHistory(history);

      expect(saveStorageItem).toHaveBeenCalledWith("mealHistory", history);
    });
  });

  describe("logDishCooked", () => {
    beforeEach(() => {
      // Mock getMealHistory to return empty array by default
      vi.mocked(getStorageItem).mockReturnValue([]);
    });

    it("should log dish cooked with provided date and notes", () => {
      const dishId = "dish-1";
      const date = "2024-01-01T12:00:00Z";
      const notes = "Delicious!";

      logDishCooked(dishId, date, notes);

      expect(saveStorageItem).toHaveBeenCalledWith("mealHistory", [
        { date, dishId, notes },
      ]);
    });

    it("should log dish cooked with current date when no date provided", () => {
      const dishId = "dish-1";
      const mockDate = new Date("2024-01-01T12:00:00Z");

      vi.spyOn(global, "Date").mockImplementation(() => mockDate);

      logDishCooked(dishId);

      expect(saveStorageItem).toHaveBeenCalledWith("mealHistory", [
        {
          date: "2024-01-01T12:00:00.000Z",
          dishId,
          notes: undefined,
        },
      ]);

      vi.restoreAllMocks();
    });

    it("should log dish cooked without notes", () => {
      const dishId = "dish-1";
      const date = "2024-01-01T12:00:00Z";

      logDishCooked(dishId, date);

      expect(saveStorageItem).toHaveBeenCalledWith("mealHistory", [
        { date, dishId, notes: undefined },
      ]);
    });

    it("should append to existing meal history", () => {
      const existingHistory = [
        { date: "2024-01-01T00:00:00Z", dishId: "dish-1" },
      ];
      vi.mocked(getStorageItem).mockReturnValue(existingHistory);

      const dishId = "dish-2";
      const date = "2024-01-02T12:00:00Z";
      const notes = "Second meal";

      logDishCooked(dishId, date, notes);

      expect(saveStorageItem).toHaveBeenCalledWith("mealHistory", [
        ...existingHistory,
        { date, dishId, notes },
      ]);
    });

    it("should handle logging multiple meals for the same dish", () => {
      const existingHistory = [
        { date: "2024-01-01T00:00:00Z", dishId: "dish-1", notes: "First time" },
      ];
      vi.mocked(getStorageItem).mockReturnValue(existingHistory);

      const dishId = "dish-1";
      const date = "2024-01-02T12:00:00Z";
      const notes = "Second time";

      logDishCooked(dishId, date, notes);

      expect(saveStorageItem).toHaveBeenCalledWith("mealHistory", [
        ...existingHistory,
        { date, dishId, notes },
      ]);
    });
  });
});
