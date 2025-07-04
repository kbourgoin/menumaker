import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import DishCard from '../DishCard'
import { mockDish } from '@/test/test-utils'

// Mock the child components
vi.mock('../DishCardHeader', () => ({
  default: ({ name, dishId, compact }: { name: string; dishId: string; compact: boolean }) => (
    <div data-testid="dish-card-header">
      {name} - {dishId} - {compact ? 'compact' : 'normal'}
    </div>
  ),
}))

vi.mock('../DishCardContent', () => ({
  default: ({ cuisines, timesCooked }: { cuisines: string[]; timesCooked: number }) => (
    <div data-testid="dish-card-content">
      {cuisines.join(', ')} - Cooked {timesCooked} times
    </div>
  ),
}))

vi.mock('../DishCardActions', () => ({
  default: ({ dish, compact }: { dish: { name: string }; compact: boolean }) => (
    <div data-testid="dish-card-actions">
      Actions for {dish.name} - {compact ? 'compact' : 'normal'}
    </div>
  ),
}))

describe('DishCard', () => {
  it('renders with default props', () => {
    render(<DishCard dish={mockDish} />)
    
    expect(screen.getByTestId('dish-card-header')).toBeInTheDocument()
    expect(screen.getByTestId('dish-card-content')).toBeInTheDocument()
    expect(screen.getByTestId('dish-card-actions')).toBeInTheDocument()
  })

  it('passes correct props to child components', () => {
    render(<DishCard dish={mockDish} />)
    
    // Check header props
    expect(screen.getByTestId('dish-card-header')).toHaveTextContent(
      `${mockDish.name} - ${mockDish.id} - normal`
    )
    
    // Check content props
    expect(screen.getByTestId('dish-card-content')).toHaveTextContent(
      `${mockDish.cuisines.join(', ')} - Cooked ${mockDish.timesCooked} times`
    )
    
    // Check actions props
    expect(screen.getByTestId('dish-card-actions')).toHaveTextContent(
      `Actions for ${mockDish.name} - normal`
    )
  })

  it('renders in compact mode', () => {
    render(<DishCard dish={mockDish} compact={true} />)
    
    expect(screen.getByTestId('dish-card-header')).toHaveTextContent('compact')
    expect(screen.getByTestId('dish-card-actions')).toHaveTextContent('compact')
  })

  it('hides actions when showActions is false', () => {
    render(<DishCard dish={mockDish} showActions={false} />)
    
    expect(screen.getByTestId('dish-card-header')).toBeInTheDocument()
    expect(screen.getByTestId('dish-card-content')).toBeInTheDocument()
    expect(screen.queryByTestId('dish-card-actions')).not.toBeInTheDocument()
  })

  it('handles onDeleted callback', () => {
    const onDeleted = vi.fn()
    render(<DishCard dish={mockDish} onDeleted={onDeleted} />)
    
    // The onDeleted prop should be passed to DishCardActions
    expect(screen.getByTestId('dish-card-actions')).toBeInTheDocument()
  })

  it('returns null for invalid dish object', () => {
    // Test with null dish - DishCard returns null, so only test provider wrapper exists
    const { container } = render(<DishCard dish={null as unknown as typeof mockDish} />)
    expect(container.querySelector('[data-testid="mock-auth-provider"]')).toBeInTheDocument()
    expect(container.querySelector('[data-testid="dish-card-header"]')).not.toBeInTheDocument()
    
    // Test with dish without id - should also return null
    const invalidDish = { ...mockDish, id: '' }
    const { container: container2 } = render(<DishCard dish={invalidDish} />)
    expect(container2.querySelector('[data-testid="mock-auth-provider"]')).toBeInTheDocument()
    expect(container2.querySelector('[data-testid="dish-card-header"]')).not.toBeInTheDocument()
  })

  it('has correct CSS classes and structure', () => {
    render(<DishCard dish={mockDish} />)
    
    // Find the card element by its classes
    const cardElement = document.querySelector('.transition-all.duration-300.hover\\:shadow-md')
    expect(cardElement).toBeInTheDocument()
    expect(cardElement).toHaveClass('overflow-hidden', 'group', 'flex', 'flex-col', 'h-full')
  })
})