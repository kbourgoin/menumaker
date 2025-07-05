import { describe, it, expect } from 'vitest'
import { getDishStats } from '../statsUtils'

describe('statsUtils', () => {
  describe('getDishStats', () => {
    it('should return correct default stats structure', () => {
      const stats = getDishStats()
      
      expect(stats).toHaveProperty('totalDishes')
      expect(stats).toHaveProperty('totalTimesCooked')
      expect(stats).toHaveProperty('mostCooked')
      expect(stats).toHaveProperty('cuisineBreakdown')
      expect(stats).toHaveProperty('recentlyCooked')
      
      expect(typeof stats.totalDishes).toBe('number')
      expect(typeof stats.totalTimesCooked).toBe('number')
      expect(typeof stats.cuisineBreakdown).toBe('object')
      expect(Array.isArray(stats.recentlyCooked)).toBe(true)
    })

    it('should return zero values for empty data', () => {
      const stats = getDishStats()
      
      // Since this uses mock functions that return empty arrays
      expect(stats.totalDishes).toBe(0)
      expect(stats.totalTimesCooked).toBe(0)
      expect(stats.mostCooked).toBeUndefined()
      expect(Object.keys(stats.cuisineBreakdown)).toHaveLength(0)
      expect(stats.recentlyCooked).toHaveLength(0)
    })

    it('should handle the structure correctly even with mock data', () => {
      const stats = getDishStats()
      
      // Test the structure is correct
      expect(stats.recentlyCooked.every(item => 
        typeof item === 'object' && 
        Object.prototype.hasOwnProperty.call(item, 'date') && 
        Object.prototype.hasOwnProperty.call(item, 'dish')
      )).toBe(true)
    })
  })
})