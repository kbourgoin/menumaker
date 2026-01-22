import { describe, it, expect } from "vitest";
import {
  daysSince,
  pickRandom,
  getReliableFavorites,
  getBlastFromPast,
  getGiveItAnotherShot,
  getCuisineYoureMissing,
  getCategorizedSuggestions,
  refreshCategory,
} from "../suggestionUtils";
import { Dish } from "@/types";

// Helper to create test dishes
const createDish = (overrides: Partial<Dish> = {}): Dish => ({
  id: "test-id",
  name: "Test Dish",
  createdAt: "2024-01-01",
  cuisines: ["Italian"],
  userId: "user-1",
  tags: [],
  timesCooked: 0,
  ...overrides,
});

// Helper to create a date string N days ago
const daysAgo = (n: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date.toISOString();
};

describe("suggestionUtils", () => {
  describe("daysSince", () => {
    it("should return Infinity for undefined date", () => {
      expect(daysSince(undefined)).toBe(Infinity);
    });

    it("should return 0 for today", () => {
      const today = new Date().toISOString();
      expect(daysSince(today)).toBe(0);
    });

    it("should return correct days for past dates", () => {
      const tenDaysAgo = daysAgo(10);
      expect(daysSince(tenDaysAgo)).toBe(10);
    });
  });

  describe("pickRandom", () => {
    it("should return empty array for empty input", () => {
      expect(pickRandom([], 5)).toEqual([]);
    });

    it("should return all items if count >= length", () => {
      const items = [1, 2, 3];
      const result = pickRandom(items, 5);
      expect(result).toHaveLength(3);
      expect(result.sort()).toEqual([1, 2, 3]);
    });

    it("should return requested count if count < length", () => {
      const items = [1, 2, 3, 4, 5];
      const result = pickRandom(items, 2);
      expect(result).toHaveLength(2);
    });

    it("should not mutate original array", () => {
      const items = [1, 2, 3, 4, 5];
      const original = [...items];
      pickRandom(items, 2);
      expect(items).toEqual(original);
    });
  });

  describe("getReliableFavorites", () => {
    it("should return dishes cooked 5+ times within 60 days", () => {
      const dishes = [
        createDish({ id: "1", timesCooked: 5, lastMade: daysAgo(30) }),
        createDish({ id: "2", timesCooked: 10, lastMade: daysAgo(10) }),
        createDish({ id: "3", timesCooked: 3, lastMade: daysAgo(10) }), // not enough cooks
        createDish({ id: "4", timesCooked: 5, lastMade: daysAgo(90) }), // too old
      ];

      const result = getReliableFavorites(dishes);
      expect(result.map(d => d.id)).toEqual(["1", "2"]);
    });

    it("should return empty array for no qualifying dishes", () => {
      const dishes = [createDish({ timesCooked: 2, lastMade: daysAgo(10) })];
      expect(getReliableFavorites(dishes)).toEqual([]);
    });
  });

  describe("getBlastFromPast", () => {
    it("should return dishes cooked 3+ times, not made in 60+ days", () => {
      const dishes = [
        createDish({ id: "1", timesCooked: 3, lastMade: daysAgo(70) }),
        createDish({ id: "2", timesCooked: 5, lastMade: daysAgo(100) }),
        createDish({ id: "3", timesCooked: 3, lastMade: daysAgo(30) }), // too recent
        createDish({ id: "4", timesCooked: 2, lastMade: daysAgo(90) }), // not enough cooks
      ];

      const result = getBlastFromPast(dishes);
      expect(result.map(d => d.id)).toEqual(["1", "2"]);
    });
  });

  describe("getGiveItAnotherShot", () => {
    it("should return dishes cooked 1-2 times, not made in 30+ days", () => {
      const dishes = [
        createDish({ id: "1", timesCooked: 1, lastMade: daysAgo(40) }),
        createDish({ id: "2", timesCooked: 2, lastMade: daysAgo(60) }),
        createDish({ id: "3", timesCooked: 1, lastMade: daysAgo(10) }), // too recent
        createDish({ id: "4", timesCooked: 3, lastMade: daysAgo(40) }), // too many cooks
        createDish({ id: "5", timesCooked: 0, lastMade: undefined }), // never cooked
      ];

      const result = getGiveItAnotherShot(dishes);
      expect(result.map(d => d.id)).toEqual(["1", "2"]);
    });
  });

  describe("getCuisineYoureMissing", () => {
    it("should return dishes from cuisines not cooked in 14+ days", () => {
      const dishes = [
        createDish({ id: "1", cuisines: ["Italian"], lastMade: daysAgo(20) }),
        createDish({ id: "2", cuisines: ["Mexican"], lastMade: daysAgo(5) }),
        createDish({ id: "3", cuisines: ["Italian"], lastMade: daysAgo(25) }),
      ];

      const result = getCuisineYoureMissing(dishes);
      // Italian hasn't been cooked in 14+ days (most recent is 20 days ago)
      // Mexican was cooked 5 days ago, so not missing
      expect(result.map(d => d.id).sort()).toEqual(["1", "3"]);
    });

    it("should return empty if all cuisines are recent", () => {
      const dishes = [
        createDish({ id: "1", cuisines: ["Italian"], lastMade: daysAgo(5) }),
        createDish({ id: "2", cuisines: ["Mexican"], lastMade: daysAgo(7) }),
      ];

      expect(getCuisineYoureMissing(dishes)).toEqual([]);
    });
  });

  describe("getCategorizedSuggestions", () => {
    it("should return all four categories", () => {
      const dishes: Dish[] = [];
      const result = getCategorizedSuggestions(dishes);

      expect(result).toHaveLength(4);
      expect(result.map(c => c.id)).toEqual([
        "reliable-favorites",
        "blast-from-past",
        "give-it-another-shot",
        "cuisine-youre-missing",
      ]);
    });

    it("should have correct metadata for each category", () => {
      const result = getCategorizedSuggestions([]);

      expect(result[0].title).toBe("Reliable Favorites");
      expect(result[1].title).toBe("Blast from the Past");
      expect(result[2].title).toBe("Give It Another Shot");
      expect(result[3].title).toBe("Cuisine You're Missing");
    });

    it("should limit dishes per category to countPerCategory", () => {
      const dishes = Array.from({ length: 10 }, (_, i) =>
        createDish({
          id: `dish-${i}`,
          timesCooked: 5,
          lastMade: daysAgo(30),
        })
      );

      const result = getCategorizedSuggestions(dishes, 2);
      expect(result[0].dishes.length).toBeLessThanOrEqual(2);
    });
  });

  describe("refreshCategory", () => {
    it("should return dishes for valid category id", () => {
      const dishes = [
        createDish({ id: "1", timesCooked: 5, lastMade: daysAgo(30) }),
      ];

      const result = refreshCategory(dishes, "reliable-favorites", 3);
      expect(result).toHaveLength(1);
    });

    it("should return empty array for invalid category id", () => {
      const dishes = [createDish()];
      const result = refreshCategory(dishes, "invalid-category", 3);
      expect(result).toEqual([]);
    });
  });
});
