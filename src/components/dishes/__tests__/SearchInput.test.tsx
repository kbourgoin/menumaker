import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import SearchInput from '../SearchInput'

describe('SearchInput', () => {
  it('renders with correct accessibility attributes', () => {
    const setSearchQuery = vi.fn()
    render(<SearchInput searchQuery="" setSearchQuery={setSearchQuery} />)
    
    const input = screen.getByRole('searchbox')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('id', 'dish-search')
    expect(input).toHaveAttribute('type', 'search')
    expect(input).toHaveAttribute('placeholder', 'Search by dish name or cuisine...')
    expect(input).toHaveAttribute('aria-describedby', 'search-help')
    expect(input).toHaveAttribute('autoComplete', 'off')
  })

  it('has proper label and description for screen readers', () => {
    const setSearchQuery = vi.fn()
    render(<SearchInput searchQuery="" setSearchQuery={setSearchQuery} />)
    
    // Check for screen reader only label
    expect(screen.getByText('Search dishes by name or cuisine')).toBeInTheDocument()
    
    // Check for help text
    expect(screen.getByText('Type to search through your dishes by name or cuisine type')).toBeInTheDocument()
  })

  it('displays the current search query value', () => {
    const setSearchQuery = vi.fn()
    const query = 'pasta'
    render(<SearchInput searchQuery={query} setSearchQuery={setSearchQuery} />)
    
    const input = screen.getByRole('searchbox')
    expect(input).toHaveValue(query)
  })

  it('calls setSearchQuery when user types', async () => {
    const user = userEvent.setup()
    const setSearchQuery = vi.fn()
    render(<SearchInput searchQuery="" setSearchQuery={setSearchQuery} />)
    
    const input = screen.getByRole('searchbox')
    await user.type(input, 'pizza')
    
    // userEvent.type types individual characters, not cumulative strings
    expect(setSearchQuery).toHaveBeenCalledTimes(5)
    expect(setSearchQuery).toHaveBeenNthCalledWith(1, 'p')
    expect(setSearchQuery).toHaveBeenNthCalledWith(2, 'i')
    expect(setSearchQuery).toHaveBeenNthCalledWith(3, 'z')
    expect(setSearchQuery).toHaveBeenNthCalledWith(4, 'z')
    expect(setSearchQuery).toHaveBeenNthCalledWith(5, 'a')
  })

  it('calls setSearchQuery on onChange event', () => {
    const setSearchQuery = vi.fn()
    render(<SearchInput searchQuery="" setSearchQuery={setSearchQuery} />)
    
    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: 'chicken' } })
    
    expect(setSearchQuery).toHaveBeenCalledWith('chicken')
  })

  it('has a search icon that is hidden from screen readers', () => {
    const setSearchQuery = vi.fn()
    render(<SearchInput searchQuery="" setSearchQuery={setSearchQuery} />)
    
    const searchIcon = document.querySelector('.lucide-search')
    expect(searchIcon).toBeInTheDocument()
    expect(searchIcon).toHaveAttribute('aria-hidden', 'true')
  })

  it('clears the input when empty string is set', () => {
    const setSearchQuery = vi.fn()
    const { rerender } = render(
      <SearchInput searchQuery="initial" setSearchQuery={setSearchQuery} />
    )
    
    let input = screen.getByRole('searchbox')
    expect(input).toHaveValue('initial')
    
    rerender(<SearchInput searchQuery="" setSearchQuery={setSearchQuery} />)
    input = screen.getByRole('searchbox')
    expect(input).toHaveValue('')
  })

  it('handles special characters and numbers', async () => {
    const user = userEvent.setup()
    const setSearchQuery = vi.fn()
    render(<SearchInput searchQuery="" setSearchQuery={setSearchQuery} />)
    
    const input = screen.getByRole('searchbox')
    await user.type(input, 'café')
    
    // userEvent.type types individual characters
    expect(setSearchQuery).toHaveBeenCalledWith('c')
    expect(setSearchQuery).toHaveBeenCalledWith('a')
    expect(setSearchQuery).toHaveBeenCalledWith('f')
    expect(setSearchQuery).toHaveBeenCalledWith('é')
  })

  it('maintains focus after typing', async () => {
    const user = userEvent.setup()
    const setSearchQuery = vi.fn()
    render(<SearchInput searchQuery="" setSearchQuery={setSearchQuery} />)
    
    const input = screen.getByRole('searchbox')
    await user.click(input)
    await user.type(input, 'test')
    
    expect(input).toHaveFocus()
  })
})