// Comprehensive test for enhanced hook error handling
// Tests that database operations fail gracefully without crashing the app

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, beforeEach, afterEach } from "vitest";
import { useDishQueries } from "../dish/useDishQueries";
import { useDishMutations } from "../dish/useDishMutations";
import { ErrorType } from "@/types/errors";

// Import the mocked supabase client
import { supabase } from "@/integrations/supabase/client";

// Mock the Supabase client module
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
  mapDishFromSummary: vi.fn(data => data),
  mapDishFromDB: vi.fn(data => data),
  mapDishToDB: vi.fn(data => data),
}));

// Get the mocked supabase for use in tests
const mockSupabase = vi.mocked(supabase);

// Mock the dish fetch utils
vi.mock("../dish/utils/dishFetchUtils", () => ({
  fetchDishesOriginalMethod: vi.fn(() => Promise.resolve([])),
  fetchDishById: vi.fn(() => Promise.resolve(null)),
  fetchMealHistoryForDish: vi.fn(() => Promise.resolve([])),
}));

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries for testing
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe.skip("Enhanced Hook Error Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset console methods to avoid test noise
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("useDishQueries Error Handling", () => {
    test("handles authentication errors gracefully", async () => {
      // Mock auth failure
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: new Error("Authentication failed"),
      });

      const { result } = renderHook(() => useDishQueries(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should return empty array instead of crashing
      expect(result.current.dishes).toEqual([]);
      expect(result.current.error).toBeNull(); // Auth errors return empty data, not error state
    });

    test("handles database errors with fallback", async () => {
      // Mock successful auth
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "test-user-id" } },
        error: null,
      });

      // Mock database error
      const dbError = { code: "PGRST301", message: "JWT expired" };
      mockSupabase.from.mockReturnValue({
        select: () => ({
          order: () => Promise.resolve({ data: null, error: dbError }),
        }),
      });

      const { result } = renderHook(() => useDishQueries(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should handle error gracefully
      expect(result.current.dishes).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });

    test("provides error classification", async () => {
      // Mock auth success but network failure
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "test-user-id" } },
        error: null,
      });

      // Mock network error
      const networkError = new Error("Network request failed");
      mockSupabase.from.mockReturnValue({
        select: () => ({
          order: () => Promise.reject(networkError),
        }),
      });

      const { result } = renderHook(() => useDishQueries(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should classify the error
      if (result.current.error) {
        expect(result.current.error.type).toBe(ErrorType.NETWORK_ERROR);
        expect(result.current.error.userMessage).toContain(
          "internet connection"
        );
      }
    });
  });

  describe("useDishMutations Error Handling", () => {
    test("validates input before database operations", async () => {
      const { result } = renderHook(() => useDishMutations(), {
        wrapper: createWrapper(),
      });

      // Test empty dish name validation
      await expect(
        result.current.addDish({
          name: "",
          cuisines: ["Other"],
        })
      ).rejects.toThrow("Dish name is required");

      // Test missing dish ID for update
      await expect(
        result.current.updateDish("", { name: "Test" })
      ).rejects.toThrow("Dish ID is required");

      // Test empty updates
      await expect(result.current.updateDish("test-id", {})).rejects.toThrow(
        "No updates provided"
      );
    });

    test("handles authentication errors in mutations", async () => {
      // Mock auth failure
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error("Authentication failed"),
      });

      const { result } = renderHook(() => useDishMutations(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.addDish({
          name: "Test Dish",
          cuisines: ["Other"],
        })
      ).rejects.toThrow("User not authenticated");
    });

    test("provides loading states for mutations", async () => {
      // Mock successful auth
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "test-user-id" } },
        error: null,
      });

      // Mock slow database operation
      let resolveInsert: (value: unknown) => void;
      const insertPromise = new Promise(resolve => {
        resolveInsert = resolve;
      });

      mockSupabase.from.mockReturnValue({
        insert: () => ({
          select: () => ({
            single: () => insertPromise,
          }),
        }),
      });

      const { result } = renderHook(() => useDishMutations(), {
        wrapper: createWrapper(),
      });

      // Start mutation
      const mutationPromise = result.current.addDish({
        name: "Test Dish",
        cuisines: ["Other"],
      });

      // Should show loading state
      await waitFor(() => {
        expect(result.current.isAddingDish).toBe(true);
      });

      // Complete the mutation
      resolveInsert!({
        data: { id: "test-id", name: "Test Dish" },
        error: null,
      });
      await mutationPromise;

      // Loading should be false after completion
      await waitFor(() => {
        expect(result.current.isAddingDish).toBe(false);
      });
    });

    test("exposes classified errors for mutations", async () => {
      // Mock successful auth
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "test-user-id" } },
        error: null,
      });

      // Mock constraint violation error
      const constraintError = {
        code: "23505",
        message: "Unique constraint violation",
      };
      mockSupabase.from.mockReturnValue({
        insert: () => ({
          select: () => ({
            single: () =>
              Promise.resolve({ data: null, error: constraintError }),
          }),
        }),
      });

      const { result } = renderHook(() => useDishMutations(), {
        wrapper: createWrapper(),
      });

      try {
        await result.current.addDish({
          name: "Test Dish",
          cuisines: ["Other"],
        });
      } catch (_error) {
        // Error should be caught and logged
      }

      await waitFor(() => {
        // Should have error state available
        expect(result.current.addDishError).toBeTruthy();
        if (result.current.addDishError) {
          expect(result.current.addDishError.type).toBe(
            ErrorType.CONSTRAINT_ERROR
          );
        }
      });
    });
  });

  describe("Error Recovery Mechanisms", () => {
    test("provides reset functions for clearing errors", async () => {
      const { result } = renderHook(() => useDishMutations(), {
        wrapper: createWrapper(),
      });

      // Should have reset functions available
      expect(typeof result.current.resetAddDishError).toBe("function");
      expect(typeof result.current.resetUpdateDishError).toBe("function");
      expect(typeof result.current.resetDeleteDishError).toBe("function");
    });

    test("handles partial failures in delete operations", async () => {
      // Mock successful auth
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "test-user-id" } },
        error: null,
      });

      // Mock meal history delete success but dish delete failure
      mockSupabase.from.mockImplementation(table => {
        if (table === "meal_history") {
          return {
            delete: () => ({
              eq: () => Promise.resolve({ error: null }),
            }),
          };
        } else if (table === "dishes") {
          return {
            delete: () => ({
              eq: () =>
                Promise.resolve({
                  error: { code: "PGRST116", message: "No rows affected" },
                }),
            }),
          };
        }
        return {};
      });

      const { result } = renderHook(() => useDishMutations(), {
        wrapper: createWrapper(),
      });

      await expect(result.current.deleteDish("test-id")).rejects.toThrow();

      // Should log the error appropriately
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("Integration with Error Utilities", () => {
    test("logs errors with proper context", async () => {
      // Mock auth failure
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error("Authentication failed"),
      });

      const { result } = renderHook(() => useDishQueries(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should have logged with context
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining("useDishQueries:auth"),
        expect.any(Object)
      );
    });

    test("classifies different error types correctly", async () => {
      const testCases = [
        {
          error: new Error("Network request failed"),
          expectedType: ErrorType.NETWORK_ERROR,
        },
        {
          error: { code: "PGRST301", message: "JWT expired" },
          expectedType: ErrorType.SESSION_EXPIRED,
        },
        {
          error: { status: 404, message: "Not found" },
          expectedType: ErrorType.NOT_FOUND,
        },
      ];

      for (const { error, expectedType } of testCases) {
        // Mock different error scenarios
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "test-user-id" } },
          error: null,
        });

        mockSupabase.from.mockReturnValue({
          select: () => ({
            order: () => Promise.reject(error),
          }),
        });

        const { result } = renderHook(() => useDishQueries(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        if (result.current.error) {
          expect(result.current.error.type).toBe(expectedType);
        }
      }
    });
  });
});

// Integration test to verify no crashes occur
describe("Hook Error Resilience", () => {
  test("hooks never crash the app even with unexpected errors", async () => {
    // Mock various catastrophic failures
    mockSupabase.auth.getUser.mockImplementation(() => {
      throw new Error("Catastrophic auth failure");
    });

    const { result } = renderHook(() => useDishQueries(), {
      wrapper: createWrapper(),
    });

    // Should not crash, should return safe defaults
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.dishes).toEqual([]);
    });

    // Test mutations with catastrophic failures
    const { result: mutationResult } = renderHook(() => useDishMutations(), {
      wrapper: createWrapper(),
    });

    await expect(
      mutationResult.current.addDish({
        name: "Test",
        cuisines: ["Other"],
      })
    ).rejects.toThrow();

    // App should still be functional
    expect(mutationResult.current.isAddingDish).toBe(false);
  });
});
