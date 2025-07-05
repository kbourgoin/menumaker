/**
 * Unified Entity Type Definitions
 * 
 * This file serves as the single source of truth for all application entity types.
 * These types represent the canonical structure used throughout the application layer.
 * 
 * Naming Convention:
 * - camelCase for all field names
 * - Consistent field naming patterns across entities
 * - Clear separation between base entities and computed/derived fields
 */

// Base entity interfaces - core data structure
export interface DishEntity {
  id: string;
  name: string;
  createdAt: string;
  cuisines: string[];
  sourceId?: string;
  location?: string;
  userId: string;
  tags: string[];
}

// Extended dish with computed fields from meal history
export interface Dish extends DishEntity {
  lastMade?: string;      // Computed from meal_history
  timesCooked: number;    // Computed from meal_history
  lastComment?: string;   // Computed from meal_history
}

export interface MealHistoryEntity {
  id: string;
  dishId: string;
  date: string;
  notes?: string;
  userId: string;
}

// Alias for consistency - no computed fields needed for meal history
export type MealHistory = MealHistoryEntity;

export interface SourceEntity {
  id: string;
  name: string;
  type: 'book' | 'website';
  description?: string;
  url?: string;
  createdAt: string;
  userId: string;
}

// Alias for consistency - no computed fields needed for sources
export type Source = SourceEntity;

export interface TagEntity {
  id: string;
  name: string;
  category: TagCategory;
  color?: string;
  description?: string;
  userId: string;
  createdAt: string;
}

// Alias for consistency
export type Tag = TagEntity;

// Profile entity for user settings
export interface ProfileEntity {
  id: string;
  username?: string;
  avatarUrl?: string;
  cuisines?: string[];
  updatedAt?: string;
}

// Alias for consistency
export type Profile = ProfileEntity;

// Type definitions
export type TagCategory = 'cuisine' | 'general';

export type CuisineType = 
  | 'Italian' 
  | 'Mexican' 
  | 'American' 
  | 'Asian' 
  | 'Mediterranean' 
  | 'Indian' 
  | 'French'
  | 'Greek'
  | 'Thai'
  | 'Japanese'
  | 'Chinese'
  | 'Korean'
  | 'Middle Eastern'
  | 'Vietnamese'
  | 'Spanish'
  | 'Caribbean'
  | 'German'
  | 'British'
  | 'Fusion'
  | 'Other';

// Composite types for complex operations
export interface MealHistoryWithDish extends MealHistoryEntity {
  dish?: Dish;
}

export interface StatsData {
  totalDishes: number;
  totalTimesCooked: number;
  mostCooked?: {
    name: string;
    timesCooked: number;
  };
  topDishes: Dish[];
  cuisineBreakdown: Record<string, number>;
  recentlyCooked: Array<{
    date: string;
    dish: Dish | null;
    notes?: string;
  }>;
}

// Field mapping documentation for developers
export const FIELD_MAPPING_CONVENTIONS = {
  /**
   * Entity ID Fields:
   * - Application: Always 'id'
   * - Database: Usually 'id', except for foreign keys
   */
  
  /**
   * User Reference Fields:
   * - Application: Always 'userId' 
   * - Database: Always 'user_id'
   */
  
  /**
   * Foreign Key Fields:
   * - Application: entityName + 'Id' (e.g., 'sourceId', 'dishId')
   * - Database: Usually entityname + 'id' (e.g., 'source_id', 'dishid')
   */
  
  /**
   * Timestamp Fields:
   * - Application: Always camelCase (e.g., 'createdAt', 'updatedAt')
   * - Database: Always snake_case (e.g., 'created_at', 'updated_at')
   */
  
  /**
   * Optional Fields:
   * - Application: Use undefined for missing values
   * - Database: Use null for missing values
   */
} as const;