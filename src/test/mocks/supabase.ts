import { vi } from "vitest";
import type { Database } from "@/integrations/supabase/types";

// Mock data for testing
const mockDishes = [
  {
    id: "dish-1",
    name: "Spaghetti Carbonara",
    createdat: "2024-01-01T00:00:00Z",
    cuisines: ["Italian"],
    source_id: "source-1",
    location: "Page 42",
    user_id: "user-1",
  },
  {
    id: "dish-2",
    name: "Chicken Tacos",
    createdat: "2024-01-02T00:00:00Z",
    cuisines: ["Mexican"],
    source_id: "source-2",
    location: "Page 15",
    user_id: "user-1",
  },
];

const mockSources = [
  {
    id: "source-1",
    name: "Italian Cookbook",
    type: "book" as const,
    description: "Classic Italian recipes",
    created_at: "2024-01-01T00:00:00Z",
    user_id: "user-1",
  },
  {
    id: "source-2",
    name: "Mexican Food Blog",
    type: "website" as const,
    description: "Authentic Mexican recipes",
    url: "https://example.com",
    created_at: "2024-01-01T00:00:00Z",
    user_id: "user-1",
  },
];

const mockMealHistory = [
  {
    id: "meal-1",
    dishid: "dish-1",
    date: "2024-01-15T00:00:00Z",
    notes: "Great dinner!",
    user_id: "user-1",
  },
  {
    id: "meal-2",
    dishid: "dish-1",
    date: "2024-01-10T00:00:00Z",
    notes: "Perfect pasta",
    user_id: "user-1",
  },
];

const mockDishSummary = [
  {
    id: "dish-1",
    name: "Spaghetti Carbonara",
    createdat: "2024-01-01T00:00:00Z",
    cuisines: ["Italian"],
    source_id: "source-1",
    location: "Page 42",
    user_id: "user-1",
    last_made: "2024-01-15T00:00:00Z",
    times_cooked: 2,
    last_comment: "Great dinner!",
    tags: ["favorite"],
  },
];

// Mock Supabase client response structure
const createMockResponse = <T>(data: T, error: unknown = null) => ({
  data,
  error,
  count: Array.isArray(data) ? data.length : 1,
  status: error ? 400 : 200,
  statusText: error ? "Bad Request" : "OK",
});

// Mock query builder methods
const createMockQueryBuilder = (tableName: string) => {
  const mockData =
    {
      dishes: mockDishes,
      sources: mockSources,
      meal_history: mockMealHistory,
      dish_summary_secure: mockDishSummary,
    }[tableName] || [];

  return {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    rangeGt: vi.fn().mockReturnThis(),
    rangeGte: vi.fn().mockReturnThis(),
    rangeLt: vi.fn().mockReturnThis(),
    rangeLte: vi.fn().mockReturnThis(),
    rangeAdjacent: vi.fn().mockReturnThis(),
    overlaps: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    abortSignal: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(createMockResponse(mockData[0])),
    maybeSingle: vi.fn().mockResolvedValue(createMockResponse(mockData[0])),
    csv: vi.fn().mockResolvedValue(createMockResponse("")),
    geojson: vi.fn().mockResolvedValue(createMockResponse({})),
    explain: vi.fn().mockResolvedValue(createMockResponse({})),
    rollback: vi.fn().mockResolvedValue(createMockResponse(null)),
    returns: vi.fn().mockReturnThis(),
    then: vi.fn().mockResolvedValue(createMockResponse(mockData)),
  };
};

// Mock Supabase client
export const mockSupabase = {
  from: vi
    .fn()
    .mockImplementation((tableName: string) =>
      createMockQueryBuilder(tableName)
    ),
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: "user-1", email: "test@example.com" } },
      error: null,
    }),
    getSession: vi.fn().mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
      error: null,
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
  },
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: null, error: null }),
      download: vi.fn().mockResolvedValue({ data: null, error: null }),
      remove: vi.fn().mockResolvedValue({ data: null, error: null }),
      list: vi.fn().mockResolvedValue({ data: [], error: null }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: "https://example.com/file.jpg" },
      }),
    }),
  },
  functions: {
    invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
  realtime: {
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn().mockReturnThis(),
    }),
  },
};

// Export types for use in tests
export type MockSupabaseClient = typeof mockSupabase;

// Helper functions for testing
export const mockSupabaseSuccess = (data: unknown) => {
  return createMockResponse(data);
};

export const mockSupabaseError = (message: string) => {
  return createMockResponse(null, { message, code: "PGRST116" });
};

// Reset mocks between tests
export const resetSupabaseMocks = () => {
  vi.clearAllMocks();
};
