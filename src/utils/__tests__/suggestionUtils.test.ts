import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getRandomDishSuggestions } from '../suggestionUtils'

describe('suggestionUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getRandomDishSuggestions', () => {
    it('should return empty array when no dishes available (default behavior)', () => {
      // Since the function uses mock getDishes() that returns [], 
      // we can test the default behavior
      const result = getRandomDishSuggestions(5)
      
      expect(result).toEqual([])
    })

    it('should handle default count parameter', () => {
      // Test that function accepts no parameters
      const result = getRandomDishSuggestions()
      
      expect(Array.isArray(result)).toBe(true)
      expect(result).toEqual([])
    })

    it('should handle zero count parameter', () => {
      const result = getRandomDishSuggestions(0)
      
      expect(Array.isArray(result)).toBe(true)
      expect(result).toEqual([])
    })

    it('should handle negative count parameter', () => {
      const result = getRandomDishSuggestions(-1)
      
      expect(Array.isArray(result)).toBe(true)
      expect(result).toEqual([])
    })

    it('should handle large count parameter', () => {
      const result = getRandomDishSuggestions(1000)
      
      expect(Array.isArray(result)).toBe(true)
      expect(result).toEqual([])
    })

    it('should be a function', () => {
      expect(typeof getRandomDishSuggestions).toBe('function')
    })

    it('should return consistent results for same input', () => {
      const result1 = getRandomDishSuggestions(5)
      const result2 = getRandomDishSuggestions(5)
      
      expect(result1).toEqual(result2)
    })

    it('should handle edge case inputs gracefully', () => {
      expect(() => getRandomDishSuggestions(0)).not.toThrow()
      expect(() => getRandomDishSuggestions(1)).not.toThrow()
      expect(() => getRandomDishSuggestions(100)).not.toThrow()
    })
  })
})