import { vi } from 'vitest'
import { mockSupabase } from './supabase'

// Re-export all mocks for easy importing
export * from './supabase'
export * from './factories'

// Mock setup function to be called in test setup
export const setupMocks = () => {
  // Mock Supabase client
  vi.mock('@/integrations/supabase/client', () => ({
    supabase: mockSupabase
  }))

  // Mock environment variables
  vi.mock('@/integrations/supabase/types', () => ({
    // Mock any types that might be needed
  }))

  // Mock router
  vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
      ...actual,
      useNavigate: () => vi.fn(),
      useLocation: () => ({ pathname: '/', search: '', hash: '', state: null, key: 'default' }),
      useParams: () => ({}),
    }
  })

  // Mock logger to avoid console spam in tests
  vi.mock('@/utils/logger', () => ({
    log: {
      debug: vi.fn(),
      info: vi.fn(), 
      warn: vi.fn(),
      error: vi.fn()
    }
  }))
}