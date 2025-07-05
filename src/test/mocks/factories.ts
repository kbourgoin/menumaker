import type { Dish, Source, MealHistory, Profile } from '@/types/entities'
import type { DBDish, DBSource, DBMealHistory, DBProfile } from '@/types/database'

// Application entity factories
export const createMockDish = (overrides: Partial<Dish> = {}): Dish => ({
  id: 'test-dish-1',
  name: 'Test Dish',
  createdAt: '2024-01-01T00:00:00Z',
  cuisines: ['Italian'],
  sourceId: 'test-source-1',
  location: 'Page 42',
  lastMade: '2024-01-15T00:00:00Z',
  timesCooked: 3,
  lastComment: 'Delicious!',
  userId: 'test-user-1',
  tags: ['favorite'],
  ...overrides
})

export const createMockSource = (overrides: Partial<Source> = {}): Source => ({
  id: 'test-source-1',
  name: 'Test Cookbook',
  type: 'book',
  description: 'A great cookbook for testing',
  url: undefined,
  createdAt: '2024-01-01T00:00:00Z',
  userId: 'test-user-1',
  ...overrides
})

export const createMockMealHistory = (overrides: Partial<MealHistory> = {}): MealHistory => ({
  id: 'test-history-1',
  dishId: 'test-dish-1',
  date: '2024-01-15T00:00:00Z',
  notes: 'Great dinner',
  userId: 'test-user-1',
  ...overrides
})

export const createMockProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: 'test-user-1',
  username: 'testuser',
  avatarUrl: 'https://example.com/avatar.jpg',
  cuisines: ['Italian', 'Mexican', 'Asian'],
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides
})

// Database entity factories (snake_case)
export const createMockDBDish = (overrides: Partial<DBDish> = {}): DBDish => ({
  id: 'test-dish-1',
  name: 'Test Dish',
  createdat: '2024-01-01T00:00:00Z',
  cuisines: ['Italian'],
  source_id: 'test-source-1',
  location: 'Page 42',
  user_id: 'test-user-1',
  ...overrides
})

export const createMockDBSource = (overrides: Partial<DBSource> = {}): DBSource => ({
  id: 'test-source-1',
  name: 'Test Cookbook',
  type: 'book',
  description: 'A great cookbook for testing',
  created_at: '2024-01-01T00:00:00Z',
  user_id: 'test-user-1',
  ...overrides
})

export const createMockDBMealHistory = (overrides: Partial<DBMealHistory> = {}): DBMealHistory => ({
  id: 'test-history-1',
  dishid: 'test-dish-1',
  date: '2024-01-15T00:00:00Z',
  notes: 'Great dinner',
  user_id: 'test-user-1',
  ...overrides
})

export const createMockDBProfile = (overrides: Partial<DBProfile> = {}): DBProfile => ({
  id: 'test-user-1',
  username: 'testuser',
  avatar_url: 'https://example.com/avatar.jpg',
  cuisines: ['Italian', 'Mexican', 'Asian'],
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides
})

// Collection factories for creating multiple items
export const createMockDishes = (count: number = 3): Dish[] => {
  return Array.from({ length: count }, (_, index) => createMockDish({
    id: `dish-${index + 1}`,
    name: `Test Dish ${index + 1}`,
    cuisines: ['Italian', 'Mexican', 'Asian'][index % 3] ? [['Italian', 'Mexican', 'Asian'][index % 3]] : ['Italian'],
    timesCooked: index + 1,
    lastMade: new Date(2024, 0, index + 1).toISOString()
  }))
}

export const createMockSources = (count: number = 2): Source[] => {
  return Array.from({ length: count }, (_, index) => createMockSource({
    id: `source-${index + 1}`,
    name: `Test Source ${index + 1}`,
    type: index % 2 === 0 ? 'book' : 'website',
    url: index % 2 === 1 ? `https://example${index}.com` : undefined
  }))
}

export const createMockMealHistoryEntries = (dishId: string, count: number = 3): MealHistory[] => {
  return Array.from({ length: count }, (_, index) => createMockMealHistory({
    id: `history-${dishId}-${index + 1}`,
    dishId,
    date: new Date(2024, 0, index + 1).toISOString(),
    notes: `Note ${index + 1} for ${dishId}`
  }))
}

// Stats mock data
export const createMockStats = () => ({
  totalDishes: 15,
  totalTimesCooked: 42,
  mostCooked: {
    name: 'Spaghetti Carbonara',
    timesCooked: 8
  },
  cuisineBreakdown: {
    Italian: 6,
    Mexican: 4,
    Asian: 3,
    American: 2
  },
  recentActivity: [
    { dishName: 'Chicken Tacos', date: '2024-01-15T00:00:00Z' },
    { dishName: 'Pasta Primavera', date: '2024-01-14T00:00:00Z' },
    { dishName: 'Stir Fry', date: '2024-01-13T00:00:00Z' }
  ]
})

// Helper for creating dish with meal history
export const createMockDishWithHistory = (historyCount: number = 3) => {
  const dish = createMockDish()
  const history = createMockMealHistoryEntries(dish.id, historyCount)
  
  return {
    dish: {
      ...dish,
      timesCooked: historyCount,
      lastMade: history[0]?.date,
      lastComment: history[0]?.notes
    },
    history
  }
}

// Error simulation factories
export const createMockError = (message: string = 'Test error', code: string = 'TEST_ERROR') => ({
  message,
  code,
  details: 'Test error details',
  hint: 'This is a test error'
})

export const createMockAuthError = () => createMockError('Authentication failed', 'AUTH_ERROR')
export const createMockNetworkError = () => createMockError('Network request failed', 'NETWORK_ERROR')
export const createMockValidationError = () => createMockError('Validation failed', 'VALIDATION_ERROR')