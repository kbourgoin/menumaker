import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'

// Mock AuthProvider for tests
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="mock-auth-provider">{children}</div>
}

// Create a test wrapper with all necessary providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <MockAuthProvider>
            {children}
          </MockAuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Mock data helpers
export const mockDish = {
  id: 'test-dish-1',
  name: 'Test Dish',
  createdAt: '2024-01-01T00:00:00Z',
  cuisines: ['Italian', 'Comfort Food'],
  sourceId: 'test-source-1',
  lastMade: '2024-01-15T00:00:00Z',
  timesCooked: 3,
  user_id: 'test-user-1',
  location: 'Page 42',
  lastComment: 'Delicious!',
  tags: ['favorite', 'quick'],
}

export const mockMealHistory = {
  id: 'test-history-1',
  dishId: 'test-dish-1',
  date: '2024-01-15T00:00:00Z',
  notes: 'Great dinner',
  user_id: 'test-user-1',
}

export const mockSource = {
  id: 'test-source-1',
  name: 'Test Cookbook',
  type: 'book' as const,
  description: 'A great cookbook',
  url: undefined,
  createdAt: '2024-01-01T00:00:00Z',
  user_id: 'test-user-1',
}

export const mockStats = {
  totalDishes: 10,
  totalTimesCooked: 25,
  mostCooked: {
    name: 'Pasta',
    timesCooked: 5,
  },
  cuisineBreakdown: {
    Italian: 4,
    Mexican: 3,
    American: 2,
    Asian: 1,
  },
}