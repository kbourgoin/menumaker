# Database Schema Overview

This document provides a comprehensive overview of the Menu Maker database schema, including table relationships, business logic, and performance considerations.

## Schema Version

- **Baseline**: 001_initial_schema.sql (July 2025)
- **Current Version**: 002_add_tag_categories.sql
- **Supabase CLI**: v2.30.4+

## Core Tables

### 1. Users & Authentication

#### `auth.users` (Supabase managed)

- **Purpose**: User authentication and identity management
- **Managed by**: Supabase Auth
- **Fields**: Standard Supabase auth fields (id, email, etc.)

#### `public.profiles`

- **Purpose**: Extended user profile information
- **Primary Key**: `id` (UUID, references `auth.users.id`)
- **Fields**:
  - `id` - User ID (foreign key to auth.users)
  - `email` - User email address
  - `display_name` - User's display name
  - `custom_cuisines` - Array of custom cuisine strings
  - `created_at`, `updated_at` - Timestamps

**Business Logic**: Automatically created when new user registers via trigger.

### 2. Recipe Sources

#### `public.sources`

- **Purpose**: Tracks cookbooks, websites, and other recipe sources
- **Primary Key**: `id` (UUID)
- **Fields**:
  - `id` - Unique identifier
  - `name` - Source name (e.g., "Joy of Cooking")
  - `url` - Optional website URL
  - `author` - Optional author name
  - `user_id` - Owner of the source (foreign key to auth.users)
  - `created_at`, `updated_at` - Timestamps

**Constraints**:

- Unique constraint on `(name, user_id)` - prevents duplicate sources per user
- Required `user_id` for RLS

### 3. Dish Management

#### `public.dishes`

- **Purpose**: Core dish/recipe information
- **Primary Key**: `id` (UUID)
- **Fields**:
  - `id` - Unique identifier
  - `name` - Dish name
  - `source_id` - Optional reference to source (foreign key to sources)
  - `location` - Optional location within source (page number, etc.)
  - `user_id` - Owner of the dish (foreign key to auth.users)
  - `times_cooked` - Counter for cooking frequency
  - `created_at`, `updated_at` - Timestamps

**Business Logic**:

- `times_cooked` is automatically incremented via functions
- `source_id` can be NULL for dishes without specific sources
- Deletion cascades to related meal history and dish tags

### 4. Categorization System

#### `public.tags`

- **Purpose**: Flexible tagging system for dishes (cuisines, dietary restrictions, etc.)
- **Primary Key**: `id` (UUID)
- **Fields**:
  - `id` - Unique identifier
  - `name` - Tag name (e.g., "Italian", "Vegetarian")
  - `category` - Tag type: 'cuisine' or 'general'
  - `color` - CSS color classes for visual styling
  - `user_id` - Owner of the tag (foreign key to auth.users)
  - `created_at`, `updated_at` - Timestamps

**Constraints**:

- Unique constraint on `(name, user_id)` - prevents duplicate tags per user
- Check constraint on `category` - must be 'cuisine' or 'general'

#### `public.dish_tags`

- **Purpose**: Many-to-many junction table linking dishes to tags
- **Primary Key**: Composite `(dish_id, tag_id)`
- **Fields**:
  - `dish_id` - Reference to dish (foreign key to dishes)
  - `tag_id` - Reference to tag (foreign key to tags)
  - `created_at` - Timestamp

**Business Logic**: Automatically manages dish-tag relationships with cascade deletion.

### 5. Cooking History

#### `public.meal_history`

- **Purpose**: Tracks when dishes were cooked with optional notes
- **Primary Key**: `id` (UUID)
- **Fields**:
  - `id` - Unique identifier
  - `dish_id` - Reference to dish (foreign key to dishes)
  - `user_id` - Owner of the meal entry (foreign key to auth.users)
  - `cooked_at` - When the dish was cooked
  - `notes` - Optional cooking notes
  - `created_at`, `updated_at` - Timestamps

**Business Logic**: Used for meal planning, history tracking, and "last cooked" calculations.

## Views and Materialized Views

### `public.dish_summary` (Materialized View)

- **Purpose**: Optimized aggregated dish data for efficient queries
- **Refresh Strategy**: Automatic via triggers on underlying tables
- **Fields**: All dish fields plus:
  - `source_name`, `source_url`, `source_author` - Denormalized source info
  - `last_cooked_at` - Most recent cooking date
  - `tag_names` - Array of associated tag names

**Performance**: Indexed on `id` for concurrent refresh capability.

### `public.dish_summary_secure` (View)

- **Purpose**: RLS-aware wrapper around dish_summary materialized view
- **Security**: Only shows data for authenticated user

## Database Functions

### User Data Management

- `clear_user_data(target_user_id)` - Safely removes all user data
- `handle_new_user()` - Creates profile for new users (trigger function)

### Dish Operations

- `increment_times_cooked(dish_id)` - Increments cooking counter by 1
- `increment_by(dish_id, amount)` - Increments cooking counter by specified amount

### View Management

- `refresh_dish_summary_secure()` - Refreshes materialized view
- `trigger_refresh_dish_summary()` - Trigger function for automatic refresh

## Security Model

### Row Level Security (RLS)

All tables have RLS enabled with policies ensuring users can only access their own data:

- **dishes**: `user_id = auth.uid()`
- **sources**: `user_id = auth.uid()`
- **meal_history**: `user_id = auth.uid()`
- **tags**: `user_id = auth.uid()`
- **dish_tags**: Via dishes.user_id relationship
- **profiles**: `id = auth.uid()`

### Security Definer Functions

Functions that need elevated privileges use `SECURITY DEFINER`:

- `clear_user_data()` - Requires elevated privileges for cross-table operations
- `handle_new_user()` - Requires write access to profiles table
- `refresh_dish_summary_secure()` - Requires materialized view refresh privileges

## Performance Considerations

### Indexing Strategy

- **Primary Keys**: All tables have UUID primary keys
- **Foreign Keys**: Indexed for efficient joins
- **User Queries**: Composite indexes on `(user_id, ...)` for common query patterns
- **Unique Constraints**: Prevent duplicate data while providing index benefits

### Query Optimization

- **Materialized Views**: Pre-computed aggregations for complex queries
- **Selective Queries**: RLS policies use indexes effectively
- **Batch Operations**: Trigger-based view refresh for consistency

### Scalability Notes

- **UUID Primary Keys**: Distributed-friendly, avoid hotspots
- **Materialized View Refresh**: Concurrent refresh when possible
- **Cascade Deletions**: Efficient cleanup of related data

## Migration History

### 001_initial_schema.sql

- Complete baseline schema from production
- All tables, functions, policies, and indexes
- Materialized view setup with triggers

### 002_add_tag_categories.sql

- Added `category` and `color` fields to tags table
- Enhanced categorization system (cuisine vs general tags)
- Performance indexes for category-based queries

## Development Guidelines

### Schema Changes

1. Always create migration files for schema changes
2. Test migrations in local environment first
3. Document breaking changes in migration comments
4. Consider backward compatibility for API consumers

### Performance Testing

- Monitor materialized view refresh performance
- Test RLS policy efficiency with large datasets
- Validate index usage with EXPLAIN ANALYZE

### Data Integrity

- Use foreign key constraints for referential integrity
- Implement check constraints for data validation
- Consider triggers for complex business logic

## Troubleshooting

### Common Issues

- **Materialized View Refresh**: Falls back to non-concurrent if concurrent fails
- **RLS Policy Conflicts**: Ensure policies don't conflict with application logic
- **Foreign Key Violations**: Check cascade settings for related data

### Monitoring

- Watch for slow queries in Supabase dashboard
- Monitor materialized view refresh frequency
- Track RLS policy performance impact

## Future Considerations

### Potential Enhancements

- **Recipe Instructions**: Separate table for step-by-step instructions
- **Nutritional Data**: Additional fields for dietary information
- **Recipe Ratings**: User ratings and reviews system
- **Meal Planning**: Enhanced planning and scheduling features

### Scalability Improvements

- **Partitioning**: Consider partitioning large tables by user_id
- **Archiving**: Archive old meal history data
- **Caching**: Additional caching layers for frequently accessed data
