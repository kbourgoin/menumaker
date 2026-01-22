import { describe, it, expect } from "vitest";
import {
  generateId,
  clearAllData,
  getDishes,
  saveDishes,
  addDish,
  getDishById,
  updateDish,
  deleteDish,
  getMealHistory,
  saveMealHistory,
  logDishCooked,
  getSources,
  saveSources,
  addSource,
  updateSource,
  deleteSource,
  getSourceById,
  getCategorizedSuggestions,
  getDishStats,
} from "../mealUtils";

describe("mealUtils", () => {
  describe("exports", () => {
    it("should export storage utilities", () => {
      expect(typeof generateId).toBe("function");
      expect(typeof clearAllData).toBe("function");
    });

    it("should export mock dish utilities", () => {
      expect(typeof getDishes).toBe("function");
      expect(typeof saveDishes).toBe("function");
      expect(typeof addDish).toBe("function");
      expect(typeof getDishById).toBe("function");
      expect(typeof updateDish).toBe("function");
      expect(typeof deleteDish).toBe("function");
    });

    it("should export meal history utilities", () => {
      expect(typeof getMealHistory).toBe("function");
      expect(typeof saveMealHistory).toBe("function");
      expect(typeof logDishCooked).toBe("function");
    });

    it("should export source utilities", () => {
      expect(typeof getSources).toBe("function");
      expect(typeof saveSources).toBe("function");
      expect(typeof addSource).toBe("function");
      expect(typeof updateSource).toBe("function");
      expect(typeof deleteSource).toBe("function");
      expect(typeof getSourceById).toBe("function");
    });

    it("should export suggestion utilities", () => {
      expect(typeof getCategorizedSuggestions).toBe("function");
    });

    it("should export stats utilities", () => {
      expect(typeof getDishStats).toBe("function");
    });
  });

  describe("mock dish utilities behavior", () => {
    it("should return empty array for getDishes", () => {
      expect(getDishes()).toEqual([]);
    });

    it("should return undefined for mock functions", () => {
      expect(saveDishes()).toBeUndefined();
      expect(addDish()).toBeUndefined();
      expect(getDishById()).toBeUndefined();
      expect(updateDish()).toBeUndefined();
      expect(deleteDish()).toBeUndefined();
    });
  });
});
