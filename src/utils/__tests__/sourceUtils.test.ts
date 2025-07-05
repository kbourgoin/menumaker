import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  getSources, 
  saveSources, 
  addSource, 
  getSourceById, 
  updateSource, 
  deleteSource,
  getDishesBySourceId 
} from '../sourceUtils'

// Mock storageUtils
vi.mock('../storageUtils', () => ({
  getStorageItem: vi.fn(),
  saveStorageItem: vi.fn(),
  generateId: vi.fn(() => 'test-generated-id')
}))

import { getStorageItem, saveStorageItem, generateId } from '../storageUtils'

describe('sourceUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getSources', () => {
    it('should return sources from storage', () => {
      const mockSources = [
        { id: 'source-1', name: 'Test Cookbook', type: 'book' as const, createdAt: '2024-01-01T00:00:00Z', userId: 'user-1' }
      ]
      vi.mocked(getStorageItem).mockReturnValue(mockSources)

      const result = getSources()

      expect(getStorageItem).toHaveBeenCalledWith('sources', [])
      expect(result).toEqual(mockSources)
    })

    it('should return empty array if no sources in storage', () => {
      vi.mocked(getStorageItem).mockReturnValue([])

      const result = getSources()

      expect(result).toEqual([])
    })
  })

  describe('saveSources', () => {
    it('should save sources to storage', () => {
      const sources = [
        { id: 'source-1', name: 'Test Cookbook', type: 'book' as const, createdAt: '2024-01-01T00:00:00Z', userId: 'user-1' }
      ]

      saveSources(sources)

      expect(saveStorageItem).toHaveBeenCalledWith('sources', sources)
    })
  })

  describe('addSource', () => {
    beforeEach(() => {
      // Mock getSources to return empty array by default
      vi.mocked(getStorageItem).mockReturnValue([])
    })

    it('should add a new source with generated ID and timestamp', () => {
      const newSourceData = {
        name: 'New Cookbook',
        type: 'book' as const,
        userId: 'user-1'
      }

      // Mock Date.now() for consistent testing
      const mockDate = new Date('2024-01-01T00:00:00Z')
      vi.spyOn(global, 'Date').mockImplementation(() => mockDate)

      const result = addSource(newSourceData)

      expect(generateId).toHaveBeenCalled()
      expect(saveStorageItem).toHaveBeenCalledWith('sources', [
        {
          id: 'test-generated-id',
          createdAt: '2024-01-01T00:00:00.000Z',
          ...newSourceData
        }
      ])
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: 'test-generated-id',
        name: 'New Cookbook',
        type: 'book'
      })

      vi.restoreAllMocks()
    })

    it('should add source to existing sources list', () => {
      const existingSources = [
        { id: 'source-1', name: 'Existing Book', type: 'book' as const, createdAt: '2024-01-01T00:00:00Z', userId: 'user-1' }
      ]
      vi.mocked(getStorageItem).mockReturnValue(existingSources)

      const newSourceData = {
        name: 'New Cookbook',
        type: 'website' as const,
        userId: 'user-1',
        url: 'https://example.com'
      }

      const result = addSource(newSourceData)

      expect(result).toHaveLength(2)
      expect(result[1].name).toBe('New Cookbook')
    })
  })

  describe('getSourceById', () => {
    it('should return source when found', () => {
      const sources = [
        { id: 'source-1', name: 'Test Cookbook', type: 'book' as const, createdAt: '2024-01-01T00:00:00Z', userId: 'user-1' },
        { id: 'source-2', name: 'Another Book', type: 'book' as const, createdAt: '2024-01-01T00:00:00Z', userId: 'user-1' }
      ]
      vi.mocked(getStorageItem).mockReturnValue(sources)

      const result = getSourceById('source-1')

      expect(result).toEqual(sources[0])
    })

    it('should return undefined when source not found', () => {
      const sources = [
        { id: 'source-1', name: 'Test Cookbook', type: 'book' as const, createdAt: '2024-01-01T00:00:00Z', userId: 'user-1' }
      ]
      vi.mocked(getStorageItem).mockReturnValue(sources)

      const result = getSourceById('nonexistent-id')

      expect(result).toBeUndefined()
    })
  })

  describe('updateSource', () => {
    it('should update existing source', () => {
      const sources = [
        { id: 'source-1', name: 'Test Cookbook', type: 'book' as const, createdAt: '2024-01-01T00:00:00Z', userId: 'user-1' },
        { id: 'source-2', name: 'Another Book', type: 'book' as const, createdAt: '2024-01-01T00:00:00Z', userId: 'user-1' }
      ]
      vi.mocked(getStorageItem).mockReturnValue(sources)

      const updates = { name: 'Updated Cookbook', description: 'New description' }
      const result = updateSource('source-1', updates)

      expect(saveStorageItem).toHaveBeenCalledWith('sources', expect.arrayContaining([
        expect.objectContaining({
          id: 'source-1',
          name: 'Updated Cookbook',
          description: 'New description'
        })
      ]))
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Updated Cookbook')
    })

    it('should not modify other sources when updating', () => {
      const sources = [
        { id: 'source-1', name: 'Test Cookbook', type: 'book' as const, createdAt: '2024-01-01T00:00:00Z', userId: 'user-1' },
        { id: 'source-2', name: 'Another Book', type: 'book' as const, createdAt: '2024-01-01T00:00:00Z', userId: 'user-1' }
      ]
      vi.mocked(getStorageItem).mockReturnValue(sources)

      const updates = { name: 'Updated Cookbook' }
      const result = updateSource('source-1', updates)

      expect(result[1]).toEqual(sources[1]) // Should remain unchanged
    })

    it('should return unchanged sources if ID not found', () => {
      const sources = [
        { id: 'source-1', name: 'Test Cookbook', type: 'book' as const, createdAt: '2024-01-01T00:00:00Z', userId: 'user-1' }
      ]
      vi.mocked(getStorageItem).mockReturnValue(sources)

      const updates = { name: 'Updated Cookbook' }
      const result = updateSource('nonexistent-id', updates)

      expect(result).toEqual(sources)
    })
  })

  describe('deleteSource', () => {
    it('should remove source by ID', () => {
      const sources = [
        { id: 'source-1', name: 'Test Cookbook', type: 'book' as const, createdAt: '2024-01-01T00:00:00Z', userId: 'user-1' },
        { id: 'source-2', name: 'Another Book', type: 'book' as const, createdAt: '2024-01-01T00:00:00Z', userId: 'user-1' }
      ]
      vi.mocked(getStorageItem).mockReturnValue(sources)

      const result = deleteSource('source-1')

      expect(saveStorageItem).toHaveBeenCalledWith('sources', [sources[1]])
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('source-2')
    })

    it('should return unchanged sources if ID not found', () => {
      const sources = [
        { id: 'source-1', name: 'Test Cookbook', type: 'book' as const, createdAt: '2024-01-01T00:00:00Z', userId: 'user-1' }
      ]
      vi.mocked(getStorageItem).mockReturnValue(sources)

      const result = deleteSource('nonexistent-id')

      expect(result).toEqual(sources)
    })

    it('should return empty array when deleting the last source', () => {
      const sources = [
        { id: 'source-1', name: 'Test Cookbook', type: 'book' as const, createdAt: '2024-01-01T00:00:00Z', userId: 'user-1' }
      ]
      vi.mocked(getStorageItem).mockReturnValue(sources)

      const result = deleteSource('source-1')

      expect(result).toEqual([])
    })
  })

  describe('getDishesBySourceId', () => {
    it('should return empty array (placeholder function)', () => {
      const result = getDishesBySourceId('any-source-id')
      
      expect(result).toEqual([])
    })
  })
})