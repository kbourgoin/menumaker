import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { renderHook, createTestQueryClient } from "@/test/test-utils";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock all dependencies with factories
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
  mapDishFromSummary: vi.fn(summary => ({
    id: summary.id,
    name: summary.name,
    createdAt: summary.createdat,
    cuisines: summary.cuisines,
    sourceId: summary.source_id,
    location: summary.location,
    userId: summary.user_id,
    lastMade: summary.last_made,
    timesCooked: summary.times_cooked,
    lastComment: summary.last_comment,
    tags: summary.tags || [],
  })),
}));

vi.mock("../utils/dishFetchUtils", () => ({
  fetchDishesOriginalMethod: vi.fn(),
  fetchDishById: vi.fn(),
  fetchMealHistoryForDish: vi.fn(),
}));

vi.mock("@/utils/errorHandling", () => ({
  classifyError: vi.fn(error => ({
    type: "UNKNOWN_ERROR",
    severity: "MEDIUM",
    message: error?.message || "Unknown error",
    originalError: error,
  })),
  logError: vi.fn(),
}));

vi.mock("@/utils/performance", () => ({
  measureAsync: vi.fn(async (name, fn) => await fn()),
  trackQuery: vi.fn(),
}));

// Import mocked modules
import { supabase, mapDishFromSummary } from "@/integrations/supabase/client";
import { fetchDishesOriginalMethod } from "../utils/dishFetchUtils";
import { classifyError, logError } from "@/utils/errorHandling";
import { measureAsync, trackQuery } from "@/utils/performance";
import { useDishQueries } from "../useDishQueries";

describe("useDishQueries", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe("successful data fetching", () => {
    it("should fetch dishes using materialized view by default", async () => {
      const mockDishSummary = {
        id: "dish-1",
        name: "Test Dish",
        createdat: "2024-01-01T00:00:00Z",
        cuisines: ["Italian"],
        source_id: "source-1",
        location: "Page 42",
        user_id: "user-1",
        last_made: "2024-01-15T00:00:00Z",
        times_cooked: 3,
        last_comment: "Delicious!",
        tags: ["favorite"],
      };

      // Mock successful auth
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: "user-1", email: "test@example.com" } },
        error: null,
      });

      // Mock successful materialized view query
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockDishSummary],
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder);

      const { result } = renderHook(() => useDishQueries(), { wrapper });

      // Wait for the query to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.dishes).toHaveLength(1);
      expect(result.current.dishes[0]).toMatchObject({
        id: "dish-1",
        name: "Test Dish",
        cuisines: ["Italian"],
        timesCooked: 3,
      });
      expect(result.current.error).toBeNull();
      expect(supabase.from).toHaveBeenCalledWith("dish_summary_secure");
    });

    it("should handle loading states correctly", async () => {
      // Mock delayed response
      let resolveAuth: (value: unknown) => void;
      const authPromise = new Promise(resolve => {
        resolveAuth = resolve;
      });

      vi.mocked(supabase.auth.getUser).mockReturnValue(authPromise);

      const { result } = renderHook(() => useDishQueries(), { wrapper });

      // Should start in loading state
      expect(result.current.isLoading).toBe(true);
      expect(result.current.dishes).toEqual([]);

      // Resolve the auth
      resolveAuth({
        data: { user: { id: "user-1" } },
        error: null,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should handle empty results", async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      });

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder);

      const { result } = renderHook(() => useDishQueries(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.dishes).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe("error handling and fallback", () => {
    it("should handle authentication errors", async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const { result } = renderHook(() => useDishQueries(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.dishes).toEqual([]);
      expect(classifyError).toHaveBeenCalled();
      expect(logError).toHaveBeenCalledWith(
        expect.any(Object),
        "useDishQueries:auth"
      );
    });

    it("should fallback to original method when materialized view fails", async () => {
      const fallbackDishes = [{ id: "fallback-dish", name: "Fallback Dish" }];

      // Mock successful auth
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      });

      // Mock materialized view failure
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "View not found" },
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder);

      // Mock successful fallback
      vi.mocked(fetchDishesOriginalMethod).mockResolvedValue(fallbackDishes);

      const { result } = renderHook(() => useDishQueries(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.dishes).toEqual(fallbackDishes);
      expect(fetchDishesOriginalMethod).toHaveBeenCalledWith("user-1");
      expect(logError).toHaveBeenCalledWith(
        expect.any(Object),
        "useDishQueries:view-failed"
      );
    });

    it("should handle both view and fallback failures gracefully", async () => {
      // Mock successful auth
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      });

      // Mock materialized view failure
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockRejectedValue(new Error("View error")),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder);

      // Mock fallback failure
      vi.mocked(fetchDishesOriginalMethod).mockRejectedValue(
        new Error("Fallback error")
      );

      const { result } = renderHook(() => useDishQueries(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.dishes).toEqual([]);
      expect(logError).toHaveBeenCalledWith(
        expect.any(Object),
        "useDishQueries:view-failed"
      );
      expect(logError).toHaveBeenCalledWith(
        expect.any(Object),
        "useDishQueries:fallback-failed"
      );
    });
  });

  describe("performance monitoring", () => {
    it("should track query performance metrics", async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      });

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [{ id: "dish-1", name: "Test Dish" }],
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder);

      const { result } = renderHook(() => useDishQueries(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(measureAsync).toHaveBeenCalledWith(
        "dishes-query",
        expect.any(Function)
      );
      expect(measureAsync).toHaveBeenCalledWith(
        "dishes-summary-view",
        expect.any(Function)
      );
      expect(trackQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryType: "dishes-summary-view",
          success: true,
          fallbackUsed: false,
        })
      );
    });
  });

  describe("return value structure", () => {
    it("should return all expected properties", async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      });

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder);

      const { result } = renderHook(() => useDishQueries(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toHaveProperty("dishes");
      expect(result.current).toHaveProperty("isLoading");
      expect(result.current).toHaveProperty("error");
      expect(result.current).toHaveProperty("getDish");
      expect(result.current).toHaveProperty("getMealHistoryForDish");

      expect(Array.isArray(result.current.dishes)).toBe(true);
      expect(typeof result.current.isLoading).toBe("boolean");
      expect(typeof result.current.getDish).toBe("function");
      expect(typeof result.current.getMealHistoryForDish).toBe("function");
    });
  });
});
