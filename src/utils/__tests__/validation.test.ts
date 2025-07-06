import { describe, it, expect } from "vitest";
import {
  ValidationError,
  isString,
  isStringArray,
  isValidCuisine,
  validateEntity,
  validateDish,
  validateMealHistory,
  validateSource,
  validateProfile,
} from "../validation";

describe("validation utilities", () => {
  describe("ValidationError", () => {
    it("should create error with message", () => {
      const error = new ValidationError("Test error");
      expect(error.message).toBe("Test error");
      expect(error.name).toBe("ValidationError");
      expect(error instanceof Error).toBe(true);
    });

    it("should create error with field and code", () => {
      const error = new ValidationError("Test error", "name", "REQUIRED");
      expect(error.message).toBe("Test error");
      expect(error.field).toBe("name");
      expect(error.code).toBe("REQUIRED");
    });
  });

  describe("type guards", () => {
    describe("isString", () => {
      it("should return true for strings", () => {
        expect(isString("hello")).toBe(true);
        expect(isString("")).toBe(true);
        expect(isString("123")).toBe(true);
      });

      it("should return false for non-strings", () => {
        expect(isString(123)).toBe(false);
        expect(isString(null)).toBe(false);
        expect(isString(undefined)).toBe(false);
        expect(isString([])).toBe(false);
        expect(isString({})).toBe(false);
        expect(isString(true)).toBe(false);
      });
    });

    describe("isStringArray", () => {
      it("should return true for string arrays", () => {
        expect(isStringArray(["a", "b", "c"])).toBe(true);
        expect(isStringArray([])).toBe(true);
        expect(isStringArray(["single"])).toBe(true);
      });

      it("should return false for mixed arrays", () => {
        expect(isStringArray(["a", 1, "c"])).toBe(false);
        expect(isStringArray([1, 2, 3])).toBe(false);
        expect(isStringArray([null, "a"])).toBe(false);
      });

      it("should return false for non-arrays", () => {
        expect(isStringArray("string")).toBe(false);
        expect(isStringArray(null)).toBe(false);
        expect(isStringArray({})).toBe(false);
      });
    });

    describe("isValidCuisine", () => {
      it("should return true for valid cuisines", () => {
        expect(isValidCuisine("Italian")).toBe(true);
        expect(isValidCuisine("Mexican")).toBe(true);
        expect(isValidCuisine("Asian")).toBe(true);
        expect(isValidCuisine("American")).toBe(true);
      });

      it("should return false for invalid cuisines", () => {
        expect(isValidCuisine("invalid")).toBe(false);
        expect(isValidCuisine("")).toBe(false);
        expect(isValidCuisine("italian")).toBe(false); // case sensitive
      });
    });
  });

  describe("validateDish", () => {
    const validDish = {
      id: "test-dish-1",
      name: "Test Dish",
      createdAt: "2024-01-01T00:00:00Z",
      cuisines: ["Italian"],
      userId: "test-user-1",
      timesCooked: 0,
      tags: [],
    };

    it("should validate a valid dish", () => {
      expect(() => validateDish(validDish)).not.toThrow();
    });

    it("should throw for missing required fields", () => {
      expect(() => validateDish({ ...validDish, id: "" })).toThrow(
        "Dish ID is required"
      );

      expect(() => validateDish({ ...validDish, name: "" })).toThrow(
        "Dish name is required"
      );

      expect(() => validateDish({ ...validDish, userId: "" })).toThrow(
        "User ID is required"
      );
    });

    it("should throw for invalid field types", () => {
      expect(() => validateDish({ ...validDish, name: 123 })).toThrow(
        "dish.name.trim is not a function"
      );

      expect(() => validateDish({ ...validDish, cuisines: "Italian" })).toThrow(
        "Cuisines must be an array of strings"
      );

      expect(() => validateDish({ ...validDish, timesCooked: -1 })).toThrow(
        "Times cooked cannot be negative"
      );
    });

    it("should validate name length", () => {
      const longName = "a".repeat(256);
      expect(() => validateDish({ ...validDish, name: longName })).toThrow(
        "Dish name cannot exceed 255 characters"
      );
    });

    it("should validate cuisines", () => {
      expect(() =>
        validateDish({ ...validDish, cuisines: ["Invalid"] })
      ).toThrow("Invalid cuisine type: Invalid");
    });

    it("should allow optional fields to be undefined", () => {
      const dishWithOptionals = {
        ...validDish,
        sourceId: undefined,
        location: undefined,
        lastMade: undefined,
        lastComment: undefined,
      };
      expect(() => validateDish(dishWithOptionals)).not.toThrow();
    });

    it("should validate dates when provided", () => {
      expect(() =>
        validateDish({ ...validDish, createdAt: "invalid-date" })
      ).toThrow("Invalid created date format");

      expect(() =>
        validateDish({ ...validDish, lastMade: "invalid-date" })
      ).toThrow("Invalid last made date format");
    });
  });

  describe("validateMealHistory", () => {
    const validMealHistory = {
      id: "test-meal-1",
      dishId: "test-dish-1",
      date: "2024-01-01T00:00:00Z",
      userId: "test-user-1",
    };

    it("should validate a valid meal history", () => {
      expect(() => validateMealHistory(validMealHistory)).not.toThrow();
    });

    it("should throw for missing required fields", () => {
      expect(() =>
        validateMealHistory({ ...validMealHistory, id: "" })
      ).toThrow("Meal history ID is required");

      expect(() =>
        validateMealHistory({ ...validMealHistory, dishId: "" })
      ).toThrow("Dish ID is required");

      expect(() =>
        validateMealHistory({ ...validMealHistory, userId: "" })
      ).toThrow("User ID is required");
    });

    it("should validate date format", () => {
      expect(() =>
        validateMealHistory({ ...validMealHistory, date: "invalid-date" })
      ).toThrow("Invalid date format");
    });

    it("should allow optional notes", () => {
      const withNotes = { ...validMealHistory, notes: "Great dinner!" };
      const withoutNotes = { ...validMealHistory, notes: undefined };

      expect(() => validateMealHistory(withNotes)).not.toThrow();
      expect(() => validateMealHistory(withoutNotes)).not.toThrow();
    });

    it("should validate notes length when provided", () => {
      const longNotes = "a".repeat(1001);
      expect(() =>
        validateMealHistory({ ...validMealHistory, notes: longNotes })
      ).toThrow("Notes cannot exceed 1000 characters");
    });
  });

  describe("validateSource", () => {
    const validSource = {
      id: "test-source-1",
      name: "Test Cookbook",
      type: "book" as const,
      createdAt: "2024-01-01T00:00:00Z",
      userId: "test-user-1",
    };

    it("should validate a valid source", () => {
      expect(() => validateSource(validSource)).not.toThrow();
    });

    it("should throw for missing required fields", () => {
      expect(() => validateSource({ ...validSource, id: "" })).toThrow(
        "Source ID is required"
      );

      expect(() => validateSource({ ...validSource, name: "" })).toThrow(
        "Source name is required"
      );

      expect(() =>
        validateSource({ ...validSource, type: "" as never })
      ).toThrow("Source type is required");
    });

    it("should validate source type", () => {
      expect(() =>
        validateSource({ ...validSource, type: "invalid" as never })
      ).toThrow('Source type must be "book" or "website"');
    });

    it("should validate name length", () => {
      const longName = "a".repeat(256);
      expect(() => validateSource({ ...validSource, name: longName })).toThrow(
        "Source name cannot exceed 255 characters"
      );
    });

    it("should validate both book and website types", () => {
      const bookSource = { ...validSource, type: "book" as const };
      const websiteSource = {
        ...validSource,
        type: "website" as const,
        url: "https://example.com",
      };

      expect(() => validateSource(bookSource)).not.toThrow();
      expect(() => validateSource(websiteSource)).not.toThrow();
    });

    it("should validate URL format for websites", () => {
      const websiteSource = {
        ...validSource,
        type: "website" as const,
        url: "invalid-url",
      };
      expect(() => validateSource(websiteSource)).toThrow("Invalid URL format");
    });
  });

  describe("validateProfile", () => {
    const validProfile = {
      id: "test-user-1",
      username: "testuser",
      cuisines: ["Italian", "Mexican"],
      updatedAt: "2024-01-01T00:00:00Z",
    };

    it("should validate a valid profile", () => {
      expect(() => validateProfile(validProfile)).not.toThrow();
    });

    it("should throw for missing required fields", () => {
      expect(() => validateProfile({ ...validProfile, id: "" })).toThrow(
        "Profile ID is required"
      );
    });

    it("should allow optional fields", () => {
      const minimalProfile = { id: "test-user-1" };
      expect(() => validateProfile(minimalProfile)).not.toThrow();
    });

    it("should validate username format when provided", () => {
      expect(() =>
        validateProfile({ ...validProfile, username: "ab" })
      ).toThrow("Username must be at least 3 characters long");

      const longUsername = "a".repeat(51);
      expect(() =>
        validateProfile({ ...validProfile, username: longUsername })
      ).toThrow("Username cannot exceed 50 characters");
    });

    it("should validate cuisines when provided", () => {
      expect(() =>
        validateProfile({ ...validProfile, cuisines: ["Invalid"] })
      ).toThrow("Invalid cuisine type: Invalid");
    });
  });

  describe("validateEntity", () => {
    it("should route to appropriate validator based on type", () => {
      const dish = {
        id: "test-dish-1",
        name: "Test Dish",
        createdAt: "2024-01-01T00:00:00Z",
        cuisines: ["Italian"],
        userId: "test-user-1",
        timesCooked: 0,
        tags: [],
      };

      expect(() => validateEntity("dish", dish)).not.toThrow();
    });

    it("should throw for unknown entity types", () => {
      expect(() => validateEntity("unknown" as never, {})).toThrow(
        "Unknown entity type: unknown"
      );
    });

    it("should throw for null/undefined entities", () => {
      expect(() => validateEntity("dish", null)).toThrow(
        "Entity cannot be null or undefined"
      );

      expect(() => validateEntity("dish", undefined)).toThrow(
        "Entity cannot be null or undefined"
      );
    });
  });

  describe("edge cases and error handling", () => {
    it("should handle malformed data gracefully", () => {
      const malformedDish = {
        id: null,
        name: 123,
        cuisines: "not-an-array",
        timesCooked: "not-a-number",
      };

      expect(() => validateDish(malformedDish as never)).toThrow(); // Should throw some validation error
    });

    it("should provide specific error messages", () => {
      try {
        validateDish({
          id: "",
          name: "Test",
          userId: "test-user-1",
          cuisines: [],
          timesCooked: 0,
          tags: [],
          createdAt: "2024-01-01T00:00:00Z",
        });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toContain("Dish ID is required");
      }
    });

    it("should handle circular references safely", () => {
      const circular: Record<string, unknown> = { id: "test-dish-1" };
      circular.self = circular;

      // Should not crash even with circular references
      expect(() => validateEntity("dish", circular)).toThrow();
    });
  });
});
