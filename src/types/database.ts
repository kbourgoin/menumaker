/**
 * Database Type Definitions
 * 
 * This file provides standardized type exports and helpers for database operations.
 * It serves as a clean interface between the raw Supabase types and our application.
 * 
 * Naming Convention:
 * - All database types use snake_case (as per PostgreSQL conventions)
 * - Prefix types with 'DB' to distinguish from application types
 * - Export convenient type aliases for common operations
 */

import { Database, Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// Re-export core database types for convenience
export type { Database, Tables, TablesInsert, TablesUpdate };

// Table row types (snake_case as they come from database)
export type DBDish = Tables<'dishes'>;
export type DBMealHistory = Tables<'meal_history'>;
export type DBSource = Tables<'sources'>;
export type DBTag = Tables<'tags'>;
export type DBProfile = Tables<'profiles'>;
export type DBDishTag = Tables<'dish_tags'>;

// Insert types for creating new records
export type DBDishInsert = TablesInsert<'dishes'>;
export type DBMealHistoryInsert = TablesInsert<'meal_history'>;
export type DBSourceInsert = TablesInsert<'sources'>;
export type DBTagInsert = TablesInsert<'tags'>;
export type DBProfileInsert = TablesInsert<'profiles'>;
export type DBDishTagInsert = TablesInsert<'dish_tags'>;

// Update types for modifying existing records
export type DBDishUpdate = TablesUpdate<'dishes'>;
export type DBMealHistoryUpdate = TablesUpdate<'meal_history'>;
export type DBSourceUpdate = TablesUpdate<'sources'>;
export type DBTagUpdate = TablesUpdate<'tags'>;
export type DBProfileUpdate = TablesUpdate<'profiles'>;
export type DBDishTagUpdate = TablesUpdate<'dish_tags'>;

// View types (materialized views and computed data)
export type DBDishSummary = Tables<'dish_summary'>;

// Extended types with additional computed or optional fields
export interface DBSourceExtended extends DBSource {
  url?: string; // Sources table doesn't have url in schema but we use it
}

// Utility types for common database operations
export type DBError = {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
};

export type DBResponse<T> = {
  data: T | null;
  error: DBError | null;
};

// Field mapping reference - documents the exact field mappings between DB and application
export const DB_FIELD_MAPPINGS = {
  // Common patterns
  ID_FIELDS: {
    app: 'id',
    db: 'id'
  },
  
  USER_REFERENCE: {
    app: 'userId',
    db: 'user_id'
  },
  
  TIMESTAMPS: {
    CREATED_AT: {
      app: 'createdAt',
      db: 'created_at'
    },
    UPDATED_AT: {
      app: 'updatedAt', 
      db: 'updated_at'
    }
  },
  
  // Entity-specific mappings
  DISH: {
    SOURCE_ID: {
      app: 'sourceId',
      db: 'source_id'
    },
    CREATED_AT: {
      app: 'createdAt',
      db: 'createdat' // Note: inconsistent naming in DB schema
    }
  },
  
  MEAL_HISTORY: {
    DISH_ID: {
      app: 'dishId',
      db: 'dishid' // Note: no underscore in DB
    }
  },
  
  SOURCE: {
    // All fields follow standard pattern
  },
  
  TAG: {
    // All fields follow standard pattern
  },
  
  DISH_TAGS: {
    DISH_ID: {
      app: 'dishId',
      db: 'dish_id'
    },
    TAG_ID: {
      app: 'tagId', 
      db: 'tag_id'
    }
  }
} as const;

// Type guard utilities for runtime type checking
export const isDBError = (error: unknown): error is DBError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as DBError).message === 'string'
  );
};

export const isValidDBResponse = <T>(response: unknown): response is DBResponse<T> => {
  return (
    typeof response === 'object' &&
    response !== null &&
    'data' in response &&
    'error' in response
  );
};

// Database constraint helpers
export const DB_CONSTRAINTS = {
  DISH: {
    NAME_MAX_LENGTH: 255,
    LOCATION_MAX_LENGTH: 255,
    REQUIRED_FIELDS: ['name', 'user_id'] as const
  },
  
  MEAL_HISTORY: {
    NOTES_MAX_LENGTH: 1000,
    REQUIRED_FIELDS: ['dishid', 'user_id'] as const
  },
  
  SOURCE: {
    NAME_MAX_LENGTH: 255,
    DESCRIPTION_MAX_LENGTH: 1000,
    URL_MAX_LENGTH: 500,
    REQUIRED_FIELDS: ['name', 'type', 'user_id'] as const
  },
  
  TAG: {
    NAME_MAX_LENGTH: 100,
    DESCRIPTION_MAX_LENGTH: 500,
    REQUIRED_FIELDS: ['name', 'user_id'] as const
  }
} as const;