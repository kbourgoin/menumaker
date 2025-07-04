import { describe, it, expect } from 'vitest'
import { mapDishFromDB, mapDishFromSummary, mapDishToDB } from '../dishMappers'
import type { Tables } from '../../types'
import type { Dish } from '@/types'

describe('dishMappers', () => {
  const mockDBDish: Tables<'dishes'>['Row'] = {
    id: 'test-dish-1',
    name: 'Test Dish',
    createdat: '2024-01-01T00:00:00Z',
    cuisines: ['Italian', 'Comfort Food'],
    source_id: 'test-source-1',
    location: 'Page 42',
    user_id: 'test-user-1'
  }

  const mockMealHistory: Tables<'meal_history'>['Row'][] = [
    {
      id: 'meal-1',
      dishid: 'test-dish-1',
      date: '2024-01-15T00:00:00Z',
      notes: 'Delicious!',
      user_id: 'test-user-1'
    },
    {
      id: 'meal-2',
      dishid: 'test-dish-1',
      date: '2024-01-10T00:00:00Z',
      notes: 'Good',
      user_id: 'test-user-1'
    },
    {
      id: 'meal-3',
      dishid: 'test-dish-1',
      date: '2024-01-05T00:00:00Z',
      notes: null,
      user_id: 'test-user-1'
    }
  ]

  const mockDishSummary = {
    id: 'test-dish-1',
    name: 'Test Dish',
    createdat: '2024-01-01T00:00:00Z',
    cuisines: ['Italian', 'Comfort Food'],
    source_id: 'test-source-1',
    location: 'Page 42',
    user_id: 'test-user-1',
    last_made: '2024-01-15T00:00:00Z',
    times_cooked: 3,
    last_comment: 'Delicious!',
    tags: ['favorite', 'quick']
  }

  describe('mapDishFromDB', () => {
    it('should map database dish to application format with default values', () => {
      const result = mapDishFromDB(mockDBDish)

      expect(result).toEqual({
        id: 'test-dish-1',
        name: 'Test Dish',
        createdAt: '2024-01-01T00:00:00Z',
        cuisines: ['Italian', 'Comfort Food'],
        sourceId: 'test-source-1',
        location: 'Page 42',
        userId: 'test-user-1',
        lastMade: undefined,
        timesCooked: 0,
        lastComment: undefined,
        tags: []
      })
    })

    it('should map database dish with meal history', () => {
      const result = mapDishFromDB(mockDBDish, mockMealHistory)

      expect(result).toEqual({
        id: 'test-dish-1',
        name: 'Test Dish',
        createdAt: '2024-01-01T00:00:00Z',
        cuisines: ['Italian', 'Comfort Food'],
        sourceId: 'test-source-1',
        location: 'Page 42',
        userId: 'test-user-1',
        lastMade: '2024-01-15T00:00:00Z', // Most recent date
        timesCooked: 3, // Total count
        lastComment: 'Delicious!', // Most recent non-empty comment
        tags: []
      })
    })

    it('should handle empty meal history', () => {
      const result = mapDishFromDB(mockDBDish, [])

      expect(result).toEqual({
        id: 'test-dish-1',
        name: 'Test Dish',
        createdAt: '2024-01-01T00:00:00Z',
        cuisines: ['Italian', 'Comfort Food'],
        sourceId: 'test-source-1',
        location: 'Page 42',
        userId: 'test-user-1',
        lastMade: undefined,
        timesCooked: 0,
        lastComment: undefined,
        tags: []
      })
    })

    it('should handle null values correctly', () => {
      const dishWithNulls: Tables<'dishes'>['Row'] = {
        ...mockDBDish,
        cuisines: null,
        source_id: null,
        location: null
      }

      const result = mapDishFromDB(dishWithNulls)

      expect(result).toEqual({
        id: 'test-dish-1',
        name: 'Test Dish',
        createdAt: '2024-01-01T00:00:00Z',
        cuisines: null,
        sourceId: null,
        location: null,
        userId: 'test-user-1',
        lastMade: undefined,
        timesCooked: 0,
        lastComment: undefined,
        tags: []
      })
    })

    it('should find most recent comment from meal history', () => {
      const historyWithMixedComments = [
        { ...mockMealHistory[0], notes: null }, // Most recent but no comment
        { ...mockMealHistory[1], notes: 'Second comment' }, // Has comment
        { ...mockMealHistory[2], notes: 'Oldest comment' } // Has comment but older
      ]

      const result = mapDishFromDB(mockDBDish, historyWithMixedComments)

      expect(result.lastComment).toBe('Second comment')
    })
  })

  describe('mapDishFromSummary', () => {
    it('should map dish summary to application format', () => {
      const result = mapDishFromSummary(mockDishSummary)

      expect(result).toEqual({
        id: 'test-dish-1',
        name: 'Test Dish',
        createdAt: '2024-01-01T00:00:00Z',
        cuisines: ['Italian', 'Comfort Food'],
        sourceId: 'test-source-1',
        location: 'Page 42',
        userId: 'test-user-1',
        lastMade: '2024-01-15T00:00:00Z',
        timesCooked: 3,
        lastComment: 'Delicious!',
        tags: ['favorite', 'quick']
      })
    })

    it('should handle null values in summary', () => {
      const summaryWithNulls = {
        ...mockDishSummary,
        cuisines: null,
        source_id: null,
        location: null,
        last_made: null,
        times_cooked: null,
        last_comment: null,
        tags: null
      }

      const result = mapDishFromSummary(summaryWithNulls)

      expect(result).toEqual({
        id: 'test-dish-1',
        name: 'Test Dish',
        createdAt: '2024-01-01T00:00:00Z',
        cuisines: null,
        sourceId: null,
        location: null,
        userId: 'test-user-1',
        lastMade: null,
        timesCooked: 0, // Default value when null
        lastComment: null,
        tags: [] // Default empty array when null
      })
    })
  })

  describe('mapDishToDB', () => {
    const mockAppDish: Partial<Dish> = {
      id: 'test-dish-1',
      name: 'Test Dish',
      createdAt: '2024-01-01T00:00:00Z',
      cuisines: ['Italian', 'Comfort Food'],
      sourceId: 'test-source-1',
      location: 'Page 42',
      userId: 'test-user-1'
    }

    it('should map application dish to database format', () => {
      const result = mapDishToDB(mockAppDish)

      expect(result).toEqual({
        id: 'test-dish-1',
        name: 'Test Dish',
        createdat: '2024-01-01T00:00:00Z',
        cuisines: ['Italian', 'Comfort Food'],
        source_id: 'test-source-1',
        location: 'Page 42',
        user_id: 'test-user-1'
      })
    })

    it('should handle partial dish object', () => {
      const partialDish: Partial<Dish> = {
        id: 'test-dish-1',
        name: 'Updated Name',
        userId: 'test-user-1'
      }

      const result = mapDishToDB(partialDish)

      expect(result).toEqual({
        id: 'test-dish-1',
        name: 'Updated Name',
        createdat: undefined,
        cuisines: undefined,
        source_id: undefined,
        location: undefined,
        user_id: 'test-user-1'
      })
    })

    it('should throw error when name is missing for new dish', () => {
      const dishWithoutName: Partial<Dish> = {
        userId: 'test-user-1'
      }

      expect(() => mapDishToDB(dishWithoutName)).toThrow('Name is required when creating a new dish')
    })

    it('should not throw error when name is missing but id exists', () => {
      const dishWithId: Partial<Dish> = {
        id: 'existing-dish',
        userId: 'test-user-1'
      }

      expect(() => mapDishToDB(dishWithId)).not.toThrow()
    })
  })

  describe('field naming consistency', () => {
    it('should consistently use camelCase for application types', () => {
      const result = mapDishFromDB(mockDBDish, mockMealHistory)

      // Ensure all field names are camelCase
      expect(result).toHaveProperty('userId')
      expect(result).toHaveProperty('sourceId')
      expect(result).toHaveProperty('createdAt')
      expect(result).toHaveProperty('lastMade')
      expect(result).toHaveProperty('timesCooked')
      expect(result).toHaveProperty('lastComment')

      // Ensure no snake_case field names exist
      expect(result).not.toHaveProperty('user_id')
      expect(result).not.toHaveProperty('source_id')
      expect(result).not.toHaveProperty('created_at')
      expect(result).not.toHaveProperty('last_made')
      expect(result).not.toHaveProperty('times_cooked')
      expect(result).not.toHaveProperty('last_comment')
    })

    it('should consistently use snake_case for database types', () => {
      const appDish: Partial<Dish> = {
        userId: 'test-user-1',
        sourceId: 'test-source-1',
        createdAt: '2024-01-01T00:00:00Z',
        name: 'Test Dish'
      }

      const result = mapDishToDB(appDish)

      // Ensure all field names are snake_case for database
      expect(result).toHaveProperty('user_id')
      expect(result).toHaveProperty('source_id')
      expect(result).toHaveProperty('createdat')

      // Ensure no camelCase field names exist in DB mapping
      expect(result).not.toHaveProperty('userId')
      expect(result).not.toHaveProperty('sourceId')
      expect(result).not.toHaveProperty('createdAt')
    })
  })
})