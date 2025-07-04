import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { useStats } from '../useStats'
import { supabase } from '@/integrations/supabase/client'

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn()
  },
  mapDishFromDB: vi.fn()
}))

// Mock data
const mockDishes = [
  {
    id: 'dish-1',
    name: 'Pizza',
    createdat: '2024-01-01T00:00:00Z',
    cuisines: ['Italian'],
    source_id: null,
    location: null,
    user_id: 'user-1'
  },
  {
    id: 'dish-2',
    name: 'Burger',
    createdat: '2024-01-02T00:00:00Z',
    cuisines: ['American'],
    source_id: null,
    location: null,
    user_id: 'user-1'
  },
  {
    id: 'dish-3',
    name: 'Sushi',
    createdat: '2024-01-03T00:00:00Z',
    cuisines: ['Japanese'],
    source_id: null,
    location: null,
    user_id: 'user-1'
  }
]

const mockMealHistory = [
  {
    id: 'meal-1',
    dishid: 'dish-1',
    date: '2024-01-15T00:00:00Z',
    notes: 'Delicious!',
    user_id: 'user-1'
  },
  {
    id: 'meal-2',
    dishid: 'dish-1',
    date: '2024-01-10T00:00:00Z',
    notes: 'Good',
    user_id: 'user-1'
  },
  {
    id: 'meal-3',
    dishid: 'dish-2',
    date: '2024-01-12T00:00:00Z',
    notes: 'Tasty',
    user_id: 'user-1'
  },
  {
    id: 'meal-4',
    dishid: 'dish-1',
    date: '2024-01-08T00:00:00Z',
    notes: null,
    user_id: 'user-1'
  }
]

const mockRecentHistory = [
  {
    id: 'meal-1',
    dishid: 'dish-1',
    date: '2024-01-15T00:00:00Z',
    notes: 'Delicious!',
    user_id: 'user-1',
    dishes: mockDishes[0]
  },
  {
    id: 'meal-3',
    dishid: 'dish-2',
    date: '2024-01-12T00:00:00Z',
    notes: 'Tasty',
    user_id: 'user-1',
    dishes: mockDishes[1]
  }
]

const expectedMappedDishes = [
  {
    id: 'dish-1',
    name: 'Pizza',
    createdAt: '2024-01-01T00:00:00Z',
    cuisines: ['Italian'],
    sourceId: null,
    location: null,
    userId: 'user-1',
    lastMade: '2024-01-15T00:00:00Z',
    timesCooked: 3,
    lastComment: 'Delicious!',
    tags: []
  },
  {
    id: 'dish-2',
    name: 'Burger',
    createdAt: '2024-01-02T00:00:00Z',
    cuisines: ['American'],
    sourceId: null,
    location: null,
    userId: 'user-1',
    lastMade: '2024-01-12T00:00:00Z',
    timesCooked: 1,
    lastComment: 'Tasty',
    tags: []
  },
  {
    id: 'dish-3',
    name: 'Sushi',
    createdAt: '2024-01-03T00:00:00Z',
    cuisines: ['Japanese'],
    sourceId: null,
    location: null,
    userId: 'user-1',
    lastMade: undefined,
    timesCooked: 0,
    lastComment: undefined,
    tags: []
  }
]

describe('useStats', () => {
  let queryClient: QueryClient

  const createWrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  beforeEach(async () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    // Mock mapDishFromDB implementation
    const { mapDishFromDB } = vi.mocked(await import('@/integrations/supabase/client'))
    mapDishFromDB.mockImplementation((dish: Record<string, unknown>, history: Record<string, unknown>[] = []) => {
      const dishHistory = history.filter(h => h.dishid === dish.id)
      const timesCooked = dishHistory.length
      const lastMade = dishHistory.length > 0 
        ? dishHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
        : undefined
      const lastComment = dishHistory.find(h => h.notes)?.notes || undefined

      return {
        id: dish.id,
        name: dish.name,
        createdAt: dish.createdat,
        cuisines: dish.cuisines,
        sourceId: dish.source_id,
        location: dish.location,
        userId: dish.user_id,
        lastMade,
        timesCooked,
        lastComment,
        tags: []
      }
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch and calculate stats correctly', async () => {
    // Mock successful supabase calls
    const mockSelect = vi.fn().mockReturnThis()
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })
    const mockLt = vi.fn().mockReturnThis()
    const mockOrder = vi.fn().mockReturnThis()
    const mockLimit = vi.fn().mockResolvedValue({ data: [], error: null })

    // First call - dishes
    mockSelect.mockResolvedValueOnce({ data: mockDishes, error: null })
    
    // Second call onwards - meal history pagination (empty results to stop pagination)
    mockSelect.mockReturnValue({
      lt: mockLt.mockReturnValue({
        order: mockOrder.mockReturnValue({
          limit: mockLimit
        })
      }),
      order: mockOrder.mockReturnValue({
        limit: mockLimit
      })
    })

    // Recent history call
    mockSelect.mockResolvedValueOnce({ data: mockRecentHistory, error: null })

    ;(supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation(mockFrom)

    const { result } = renderHook(() => useStats(), { wrapper: createWrapper })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.stats).toBeDefined()
    expect(result.current.stats?.totalDishes).toBe(3)
    expect(result.current.stats?.totalTimesCooked).toBe(0) // Empty meal history
    expect(result.current.stats?.topDishes).toEqual([])
    expect(result.current.stats?.cuisineBreakdown).toEqual({
      Italian: 1,
      American: 1,
      Japanese: 1
    })
  })

  it('should handle meal history data correctly', async () => {
    // Mock successful supabase calls with meal history
    const mockSelect = vi.fn().mockReturnThis()
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })
    const mockLt = vi.fn().mockReturnThis()
    const mockOrder = vi.fn().mockReturnThis()
    const mockLimit = vi.fn()

    // First call - dishes
    mockSelect.mockResolvedValueOnce({ data: mockDishes, error: null })
    
    // Second call - meal history (first page)
    mockLimit.mockResolvedValueOnce({ data: mockMealHistory, error: null })
    
    // Third call - meal history (second page - empty to stop pagination)
    mockLimit.mockResolvedValueOnce({ data: [], error: null })

    mockSelect.mockReturnValue({
      lt: mockLt.mockReturnValue({
        order: mockOrder.mockReturnValue({
          limit: mockLimit
        })
      }),
      order: mockOrder.mockReturnValue({
        limit: mockLimit
      })
    })

    // Recent history call
    mockSelect.mockResolvedValueOnce({ data: mockRecentHistory, error: null })

    ;(supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation(mockFrom)

    const { result } = renderHook(() => useStats(), { wrapper: createWrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.stats).toBeDefined()
    expect(result.current.stats?.totalDishes).toBe(3)
    expect(result.current.stats?.totalTimesCooked).toBe(4) // Total meal history entries
    
    // Check top dishes (sorted by times cooked)
    const topDishes = result.current.stats?.topDishes || []
    expect(topDishes).toHaveLength(2) // Only dishes with timesCooked > 0
    expect(topDishes[0].name).toBe('Pizza') // Most cooked (3 times)
    expect(topDishes[0].timesCooked).toBe(3)
    expect(topDishes[1].name).toBe('Burger') // Second most cooked (1 time)
    expect(topDishes[1].timesCooked).toBe(1)
  })

  it('should calculate most cooked dish correctly', async () => {
    // Setup mock with meal history
    const mockSelect = vi.fn().mockReturnThis()
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })
    const mockLt = vi.fn().mockReturnThis()
    const mockOrder = vi.fn().mockReturnThis()
    const mockLimit = vi.fn()

    mockSelect.mockResolvedValueOnce({ data: mockDishes, error: null })
    mockLimit.mockResolvedValueOnce({ data: mockMealHistory, error: null })
    mockLimit.mockResolvedValueOnce({ data: [], error: null })
    mockSelect.mockResolvedValueOnce({ data: mockRecentHistory, error: null })

    mockSelect.mockReturnValue({
      lt: mockLt.mockReturnValue({
        order: mockOrder.mockReturnValue({
          limit: mockLimit
        })
      }),
      order: mockOrder.mockReturnValue({
        limit: mockLimit
      })
    })

    ;(supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation(mockFrom)

    const { result } = renderHook(() => useStats(), { wrapper: createWrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const mostCooked = result.current.stats?.mostCooked
    expect(mostCooked).toBeDefined()
    expect(mostCooked?.name).toBe('Pizza')
    expect(mostCooked?.timesCooked).toBe(3)
  })

  it('should handle dishes with no cuisine gracefully', async () => {
    const dishesWithNoCuisine = [
      {
        ...mockDishes[0],
        cuisines: null
      },
      {
        ...mockDishes[1],
        cuisines: []
      }
    ]

    const mockSelect = vi.fn().mockReturnThis()
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })
    const mockLt = vi.fn().mockReturnThis()
    const mockOrder = vi.fn().mockReturnThis()
    const mockLimit = vi.fn()

    mockSelect.mockResolvedValueOnce({ data: dishesWithNoCuisine, error: null })
    mockLimit.mockResolvedValueOnce({ data: [], error: null })
    mockSelect.mockResolvedValueOnce({ data: [], error: null })

    mockSelect.mockReturnValue({
      lt: mockLt.mockReturnValue({
        order: mockOrder.mockReturnValue({
          limit: mockLimit
        })
      }),
      order: mockOrder.mockReturnValue({
        limit: mockLimit
      })
    })

    ;(supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation(mockFrom)

    const { result } = renderHook(() => useStats(), { wrapper: createWrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const cuisineBreakdown = result.current.stats?.cuisineBreakdown || {}
    expect(cuisineBreakdown['Other']).toBe(2) // Both dishes should be categorized as 'Other'
  })

  it('should handle database errors gracefully', async () => {
    const mockSelect = vi.fn().mockRejectedValue(new Error('Database error'))
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })
    ;(supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation(mockFrom)

    const { result } = renderHook(() => useStats(), { wrapper: createWrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.stats).toBeUndefined()
  })

  it('should handle pagination correctly for large datasets', async () => {
    // Create large meal history dataset (>1000 entries)
    const largeMealHistory = Array.from({ length: 1500 }, (_, i) => ({
      id: `meal-${i}`,
      dishid: `dish-${i % 3}`, // Distribute across 3 dishes
      date: `2024-01-${String(i % 30 + 1).padStart(2, '0')}T00:00:00Z`,
      notes: `Note ${i}`,
      user_id: 'user-1'
    }))

    const firstPage = largeMealHistory.slice(0, 1000)
    const secondPage = largeMealHistory.slice(1000)

    const mockSelect = vi.fn().mockReturnThis()
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })
    const mockLt = vi.fn().mockReturnThis()
    const mockOrder = vi.fn().mockReturnThis()
    const mockLimit = vi.fn()

    // Dishes call
    mockSelect.mockResolvedValueOnce({ data: mockDishes, error: null })
    
    // First page of meal history
    mockLimit.mockResolvedValueOnce({ data: firstPage, error: null })
    
    // Second page of meal history
    mockLimit.mockResolvedValueOnce({ data: secondPage, error: null })

    // Recent history call
    mockSelect.mockResolvedValueOnce({ data: mockRecentHistory, error: null })

    mockSelect.mockReturnValue({
      lt: mockLt.mockReturnValue({
        order: mockOrder.mockReturnValue({
          limit: mockLimit
        })
      }),
      order: mockOrder.mockReturnValue({
        limit: mockLimit
      })
    })

    ;(supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation(mockFrom)

    const { result } = renderHook(() => useStats(), { wrapper: createWrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.stats?.totalTimesCooked).toBe(1500)
  })

  it('should return default stats when no data is available', async () => {
    const { result } = renderHook(() => useStats(), { wrapper: createWrapper })

    const defaultStats = await result.current.getStats()

    expect(defaultStats).toEqual({
      totalDishes: 0,
      totalTimesCooked: 0,
      mostCooked: null,
      topDishes: [],
      cuisineBreakdown: {},
      recentlyCooked: []
    })
  })
})