import { describe, it, expect } from "vitest";
import {
  mapSourceFromDB,
  mapSourceToDB,
  type DBSource,
} from "../sourceMappers";
import type { Source } from "@/types";

describe("sourceMappers", () => {
  const mockDBSource: DBSource = {
    id: "test-source-1",
    name: "Test Cookbook",
    type: "book",
    description: "A great cookbook for testing",
    created_at: "2024-01-01T00:00:00Z",
    user_id: "test-user-1",
    url: "https://example.com",
  };

  describe("mapSourceFromDB", () => {
    it("should map database source to application format", () => {
      const result = mapSourceFromDB(mockDBSource);

      expect(result).toEqual({
        id: "test-source-1",
        name: "Test Cookbook",
        type: "book",
        description: "A great cookbook for testing",
        createdAt: "2024-01-01T00:00:00Z",
        userId: "test-user-1",
        url: "https://example.com",
      });
    });

    it("should handle website type", () => {
      const websiteSource = {
        ...mockDBSource,
        type: "website",
      };

      const result = mapSourceFromDB(websiteSource);

      expect(result.type).toBe("website");
    });

    it("should convert legacy document type to book", () => {
      const legacySource = {
        ...mockDBSource,
        type: "document", // Legacy type
      };

      const result = mapSourceFromDB(legacySource as DBSource);

      expect(result.type).toBe("book"); // Converted to book
    });

    it("should handle null values", () => {
      const sourceWithNulls: DBSource = {
        ...mockDBSource,
        description: null,
        url: undefined,
      };

      const result = mapSourceFromDB(sourceWithNulls);

      expect(result).toEqual({
        id: "test-source-1",
        name: "Test Cookbook",
        type: "book",
        description: undefined, // null converted to undefined
        createdAt: "2024-01-01T00:00:00Z",
        userId: "test-user-1",
        url: undefined,
      });
    });

    it("should handle missing url field", () => {
      const sourceWithoutUrl = {
        id: "test-source-1",
        name: "Test Cookbook",
        type: "book",
        description: "A great cookbook for testing",
        created_at: "2024-01-01T00:00:00Z",
        user_id: "test-user-1",
      } as DBSource;

      const result = mapSourceFromDB(sourceWithoutUrl);

      expect(result.url).toBeUndefined();
    });
  });

  describe("mapSourceToDB", () => {
    const mockAppSource: Partial<Source> = {
      id: "test-source-1",
      name: "Test Cookbook",
      type: "book",
      description: "A great cookbook for testing",
      createdAt: "2024-01-01T00:00:00Z",
      userId: "test-user-1",
      url: "https://example.com",
    };

    it("should map application source to database format", () => {
      const result = mapSourceToDB(mockAppSource);

      expect(result).toEqual({
        id: "test-source-1",
        name: "Test Cookbook",
        type: "book",
        description: "A great cookbook for testing",
        created_at: "2024-01-01T00:00:00Z",
        user_id: "test-user-1",
        url: "https://example.com",
      });
    });

    it("should handle website type", () => {
      const websiteSource = {
        ...mockAppSource,
        type: "website" as const,
      };

      const result = mapSourceToDB(websiteSource);

      expect(result.type).toBe("website");
    });

    it("should handle partial source object", () => {
      const partialSource: Partial<Source> = {
        id: "test-source-1",
        name: "Updated Name",
        userId: "test-user-1",
      };

      const result = mapSourceToDB(partialSource);

      expect(result).toEqual({
        id: "test-source-1",
        name: "Updated Name",
        type: undefined,
        description: undefined,
        created_at: undefined,
        user_id: "test-user-1",
        url: undefined,
      });
    });

    it("should throw error when name is missing for new source", () => {
      const sourceWithoutName: Partial<Source> = {
        type: "book",
        userId: "test-user-1",
      };

      expect(() => mapSourceToDB(sourceWithoutName)).toThrow(
        "Name is required when creating a new source"
      );
    });

    it("should throw error when type is missing for new source", () => {
      const sourceWithoutType: Partial<Source> = {
        name: "Test Source",
        userId: "test-user-1",
      };

      expect(() => mapSourceToDB(sourceWithoutType)).toThrow(
        "Type is required when creating a new source"
      );
    });

    it("should not throw error when name is missing but id exists", () => {
      const sourceWithId: Partial<Source> = {
        id: "existing-source",
        userId: "test-user-1",
      };

      expect(() => mapSourceToDB(sourceWithId)).not.toThrow();
    });

    it("should not throw error when type is missing but id exists", () => {
      const sourceWithId: Partial<Source> = {
        id: "existing-source",
        name: "Updated Name",
        userId: "test-user-1",
      };

      expect(() => mapSourceToDB(sourceWithId)).not.toThrow();
    });
  });

  describe("field naming consistency", () => {
    it("should consistently use camelCase for application types", () => {
      const result = mapSourceFromDB(mockDBSource);

      // Ensure all field names are camelCase
      expect(result).toHaveProperty("userId");
      expect(result).toHaveProperty("createdAt");

      // Ensure no snake_case field names exist
      expect(result).not.toHaveProperty("user_id");
      expect(result).not.toHaveProperty("created_at");
    });

    it("should consistently use snake_case for database types", () => {
      const appSource: Partial<Source> = {
        userId: "test-user-1",
        createdAt: "2024-01-01T00:00:00Z",
        name: "Test Source",
        type: "book",
      };

      const result = mapSourceToDB(appSource);

      // Ensure all field names are snake_case for database
      expect(result).toHaveProperty("user_id");
      expect(result).toHaveProperty("created_at");

      // Ensure no camelCase field names exist in DB mapping
      expect(result).not.toHaveProperty("userId");
      expect(result).not.toHaveProperty("createdAt");
    });
  });

  describe("type validation", () => {
    it("should accept valid source types", () => {
      const bookSource = { ...mockDBSource, type: "book" };
      const websiteSource = { ...mockDBSource, type: "website" };

      expect(() => mapSourceFromDB(bookSource)).not.toThrow();
      expect(() => mapSourceFromDB(websiteSource)).not.toThrow();
    });

    it("should handle unknown types gracefully", () => {
      const unknownTypeSource = { ...mockDBSource, type: "unknown" };

      const result = mapSourceFromDB(unknownTypeSource as DBSource);

      expect(result.type).toBe("book"); // Falls back to book
    });
  });

  describe("round-trip consistency", () => {
    it("should maintain data integrity through DB to App to DB mapping", () => {
      // Start with DB format
      const originalDB = mockDBSource;

      // Map to application format and back
      const app = mapSourceFromDB(originalDB);
      const backToDB = mapSourceToDB(app);

      // Should preserve all data (accounting for field name differences)
      expect(backToDB).toEqual({
        id: originalDB.id,
        name: originalDB.name,
        type: originalDB.type,
        description: originalDB.description,
        created_at: originalDB.created_at,
        user_id: originalDB.user_id,
        url: originalDB.url,
      });
    });

    it("should handle round-trip with legacy document type", () => {
      const legacyDB = { ...mockDBSource, type: "document" };

      const app = mapSourceFromDB(legacyDB as DBSource);
      const backToDB = mapSourceToDB(app);

      // Type should be converted to book in both directions
      expect(app.type).toBe("book");
      expect(backToDB.type).toBe("book");
    });
  });
});
