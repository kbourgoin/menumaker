import { describe, it, expect } from 'vitest'
import { sortDishes } from '../dishUtils'
import type { Dish } from '@/types'

const mockDishes: Dish[] = [
  {
    id: '1',
    name: 'Pizza',
    createdAt: '2024-01-01T00:00:00Z',
    cuisines: ['Italian'],
    timesCooked: 5,
    lastMade: '2024-01-15T00:00:00Z',
    userId: 'user1',
    tags: [],
  },
  {
    id: '2',
    name: 'Burger',
    createdAt: '2024-01-02T00:00:00Z',
    cuisines: ['American'],
    timesCooked: 3,
    lastMade: '2024-01-10T00:00:00Z',
    userId: 'user1',
    tags: [],
  },
  {
    id: '3',
    name: 'Salad',
    createdAt: '2024-01-03T00:00:00Z',
    cuisines: ['Healthy'],
    timesCooked: 1,
    lastMade: '2024-01-20T00:00:00Z',
    userId: 'user1',
    tags: [],
  },
]

describe('dishUtils', () => {
  describe('sortDishes', () => {
    it('should sort by name alphabetically', () => {
      const sorted = sortDishes(mockDishes, 'name')
      expect(sorted[0].name).toBe('Burger')
      expect(sorted[1].name).toBe('Pizza')
      expect(sorted[2].name).toBe('Salad')
    })

    it('should sort by times cooked (most to least)', () => {
      const sorted = sortDishes(mockDishes, 'timesCooked')
      expect(sorted[0].timesCooked).toBe(5)
      expect(sorted[1].timesCooked).toBe(3)
      expect(sorted[2].timesCooked).toBe(1)
    })

    it('should sort by last cooked date (most recent first)', () => {
      const sorted = sortDishes(mockDishes, 'lastCooked')
      expect(sorted[0].name).toBe('Salad') // 2024-01-20
      expect(sorted[1].name).toBe('Pizza') // 2024-01-15
      expect(sorted[2].name).toBe('Burger') // 2024-01-10
    })

    it('should return original array for newest sort option', () => {
      const sorted = sortDishes(mockDishes, 'newest')
      // 'newest' is not implemented in sortDishes, should return unchanged
      expect(sorted).toEqual(mockDishes)
    })

    it('should handle dishes with no lastMade date', () => {
      const dishesWithoutLastMade = [
        ...mockDishes,
        {
          id: '4',
          name: 'New Dish',
          createdAt: '2024-01-04T00:00:00Z',
          cuisines: ['Test'],
          timesCooked: 0,
          userId: 'user1',
          tags: [],
        }
      ]
      
      const sorted = sortDishes(dishesWithoutLastMade, 'lastCooked')
      // Dishes without lastMade should appear at the end
      expect(sorted[sorted.length - 1].name).toBe('New Dish')
    })

    it('should return original array for unknown sort option', () => {
      const sorted = sortDishes(mockDishes, 'unknown')
      expect(sorted).toEqual(mockDishes)
    })
  })
})