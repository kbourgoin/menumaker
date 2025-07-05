/**
 * Main Types Export
 * 
 * This file re-exports all entity types from the unified type system.
 * Use this file as the main import point for all application types.
 */

// Re-export all entity types from the new unified system
export * from './entities';

// Re-export database types for convenience
export * from './database';

// DEPRECATED: Legacy type definitions below
// These are kept for backward compatibility only
// All new code should use imports from ./entities

/**
 * @deprecated Use Dish from './entities' instead
 */
export interface DishLegacy {
  id: string;
  name: string;
  createdAt: string;
  cuisines: string[];
  sourceId?: string;
  lastMade?: string;
  timesCooked: number;
  userId: string;
  location?: string;
  lastComment?: string;
  tags: string[];
}

/**
 * @deprecated Use MealHistory from './entities' instead
 */
export interface MealHistoryLegacy {
  id: string;
  dishId: string;
  date: string;
  notes?: string;
  userId: string;
}

/**
 * @deprecated Use Source from './entities' instead
 */
export interface SourceLegacy {
  id: string;
  name: string;
  type: 'book' | 'website';  // Removed 'document' from the type options
  description?: string;
  url?: string;
  createdAt: string;
  userId: string;
}

/**
 * @deprecated Use Tag from './entities' instead
 */
export interface TagLegacy {
  id: string;
  name: string;
  category: TagCategory;
  color?: string;
  description?: string;
  userId: string;
  createdAt: string;
}
