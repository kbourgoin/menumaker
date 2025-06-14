import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import ViewToggle from '../ViewToggle'

describe('ViewToggle', () => {
  it('renders with correct accessibility attributes', () => {
    const setViewMode = vi.fn()
    render(<ViewToggle viewMode="cards" setViewMode={setViewMode} />)
    
    // Check for group role and aria-label
    const group = screen.getByRole('group', { name: 'View mode selection' })
    expect(group).toBeInTheDocument()
    
    // Check for individual toggle buttons
    const cardsToggle = screen.getByRole('button', { name: 'Switch to cards view' })
    const tableToggle = screen.getByRole('button', { name: 'Switch to table view' })
    
    expect(cardsToggle).toBeInTheDocument()
    expect(tableToggle).toBeInTheDocument()
  })

  it('shows correct pressed state for cards view', () => {
    const setViewMode = vi.fn()
    render(<ViewToggle viewMode="cards" setViewMode={setViewMode} />)
    
    const cardsToggle = screen.getByRole('button', { name: 'Switch to cards view' })
    const tableToggle = screen.getByRole('button', { name: 'Switch to table view' })
    
    expect(cardsToggle).toHaveAttribute('aria-pressed', 'true')
    expect(tableToggle).toHaveAttribute('aria-pressed', 'false')
  })

  it('shows correct pressed state for table view', () => {
    const setViewMode = vi.fn()
    render(<ViewToggle viewMode="table" setViewMode={setViewMode} />)
    
    const cardsToggle = screen.getByRole('button', { name: 'Switch to cards view' })
    const tableToggle = screen.getByRole('button', { name: 'Switch to table view' })
    
    expect(cardsToggle).toHaveAttribute('aria-pressed', 'false')
    expect(tableToggle).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls setViewMode with "cards" when cards toggle is clicked', async () => {
    const user = userEvent.setup()
    const setViewMode = vi.fn()
    render(<ViewToggle viewMode="table" setViewMode={setViewMode} />)
    
    const cardsToggle = screen.getByRole('button', { name: 'Switch to cards view' })
    await user.click(cardsToggle)
    
    expect(setViewMode).toHaveBeenCalledWith('cards')
  })

  it('calls setViewMode with "table" when table toggle is clicked', async () => {
    const user = userEvent.setup()
    const setViewMode = vi.fn()
    render(<ViewToggle viewMode="cards" setViewMode={setViewMode} />)
    
    const tableToggle = screen.getByRole('button', { name: 'Switch to table view' })
    await user.click(tableToggle)
    
    expect(setViewMode).toHaveBeenCalledWith('table')
  })

  it('has screen reader only text for each toggle', () => {
    const setViewMode = vi.fn()
    render(<ViewToggle viewMode="cards" setViewMode={setViewMode} />)
    
    expect(screen.getByText('Cards view')).toBeInTheDocument()
    expect(screen.getByText('Table view')).toBeInTheDocument()
  })

  it('has help description for screen readers', () => {
    const setViewMode = vi.fn()
    render(<ViewToggle viewMode="cards" setViewMode={setViewMode} />)
    
    expect(screen.getByText('Choose how to display your dishes: cards or table format')).toBeInTheDocument()
  })

  it('has icons with aria-hidden attribute', () => {
    const setViewMode = vi.fn()
    render(<ViewToggle viewMode="cards" setViewMode={setViewMode} />)
    
    // Check for Lucide icons with aria-hidden
    const icons = document.querySelectorAll('[aria-hidden="true"]')
    expect(icons).toHaveLength(2) // Should have 2 icons (LayoutGrid and Table)
  })

  it('applies correct CSS classes', () => {
    const setViewMode = vi.fn()
    render(<ViewToggle viewMode="cards" setViewMode={setViewMode} />)
    
    const container = document.querySelector('.flex.justify-end.mb-4')
    expect(container).toBeInTheDocument()
    
    const toggleGroup = document.querySelector('.bg-muted.rounded-md.p-1')
    expect(toggleGroup).toBeInTheDocument()
  })

  it('can be navigated with keyboard', async () => {
    const user = userEvent.setup()
    const setViewMode = vi.fn()
    render(<ViewToggle viewMode="cards" setViewMode={setViewMode} />)
    
    const cardsToggle = screen.getByRole('button', { name: 'Switch to cards view' })
    const tableToggle = screen.getByRole('button', { name: 'Switch to table view' })
    
    // Tab to first toggle
    await user.tab()
    expect(cardsToggle).toHaveFocus()
    
    // Tab to second toggle
    await user.tab()
    expect(tableToggle).toHaveFocus()
    
    // Press Enter on table toggle
    await user.keyboard('{Enter}')
    expect(setViewMode).toHaveBeenCalledWith('table')
  })
})