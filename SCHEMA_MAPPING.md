# Database Schema Mapping Documentation

This document describes the standardized type mapping system implemented to ensure consistency between database and application layers.

## Overview

The standardized mapping system provides:
- **Single source of truth** for all entity types
- **Consistent field mapping** between database (snake_case) and application (camelCase)
- **Centralized validation** at database/application boundaries
- **Type safety** with comprehensive validation
- **Backward compatibility** during migration

## File Structure

```
src/
├── types/
│   ├── entities.ts       # Application entity types (camelCase)
│   ├── database.ts       # Database type exports (snake_case)
│   └── index.ts          # Main export point
├── utils/
│   ├── typeMapping.ts    # Centralized mapping functions
│   └── validation.ts     # Type validation utilities
└── integrations/supabase/mappers/
    ├── dishMappers.ts    # DEPRECATED - use typeMapping.ts
    ├── mealHistoryMappers.ts # DEPRECATED - use typeMapping.ts
    └── sourceMappers.ts  # DEPRECATED - use typeMapping.ts
```

## Type System

### Entity Types (Application Layer)

All application types use **camelCase** naming:

```typescript
interface Dish {
  id: string;
  name: string;
  createdAt: string;
  cuisines: string[];
  sourceId?: string;      // Foreign key
  userId: string;         // User reference
  // ... computed fields
  lastMade?: string;
  timesCooked: number;
  lastComment?: string;
}
```

### Database Types

All database types use **snake_case** naming:

```typescript
type DBDish = {
  id: string;
  name: string;
  createdat: string;      // Note: inconsistent naming in schema
  cuisines: string[];
  source_id: string | null;
  user_id: string;
  // No computed fields - stored separately
}
```

## Field Mapping Conventions

### Standard Patterns

| Application (camelCase) | Database (snake_case) | Notes |
|------------------------|----------------------|-------|
| `id` | `id` | Always consistent |
| `userId` | `user_id` | User references |
| `sourceId` | `source_id` | Foreign keys |
| `createdAt` | `created_at` | Timestamps |
| `updatedAt` | `updated_at` | Timestamps |

### Special Cases

| Application | Database | Entity | Notes |
|------------|----------|---------|-------|
| `dishId` | `dishid` | MealHistory | No underscore in DB |
| `createdAt` | `createdat` | Dish | Legacy naming inconsistency |

### Value Transformations

| Application | Database | Transformation |
|------------|----------|----------------|
| `undefined` | `null` | Optional fields |
| `[]` | `null` | Empty arrays |
| Computed fields | Not stored | Calculated from related data |

## Mapping Functions

### Core Mappers

Use these centralized functions from `@/utils/typeMapping`:

```typescript
// Database to Application
mapDishFromDB(dbDish, mealHistory?) → Dish
mapDishFromSummary(summary) → Dish
mapMealHistoryFromDB(dbHistory) → MealHistory
mapSourceFromDB(dbSource) → Source

// Application to Database  
mapDishToDB(dish) → DBDishInsert
mapMealHistoryToDB(history) → DBMealHistoryInsert
mapSourceToDB(source) → DBSourceInsert

// Batch operations
mapArrayFromDB.dishes(dbDishes, historyMap?) → Dish[]
mapArrayFromDB.mealHistory(dbHistory) → MealHistory[]
```

### Usage Examples

```typescript
// Fetching dishes with meal history
const dishesData = await supabase.from('dishes').select('*');
const mealHistory = await supabase.from('meal_history').select('*');

// Group history by dish ID
const historyMap = new Map();
mealHistory.forEach(h => {
  if (!historyMap.has(h.dishid)) historyMap.set(h.dishid, []);
  historyMap.get(h.dishid).push(h);
});

// Map to application types
const dishes = mapArrayFromDB.dishes(dishesData, historyMap);
```

## Validation System

### Validation Levels

1. **Basic validation** - Required fields, type checking
2. **Format validation** - UUIDs, dates, URLs
3. **Business rules** - Value constraints, relationships
4. **Constraint validation** - Database limits, field lengths

### Validation Usage

```typescript
import { validateEntity, ValidationError } from '@/utils/validation';

try {
  validateEntity('dish', dishData);
  // Validation passed
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(`Validation failed: ${error.message}`);
    // Handle validation error
  }
}
```

### Current Status

⚠️ **Note**: Validation is currently disabled for backward compatibility during migration. Re-enable validation after updating test fixtures.

## Migration Strategy

### Phase 1: Infrastructure ✅
- [x] Create unified type system
- [x] Implement centralized mapping functions
- [x] Add comprehensive validation
- [x] Update existing mappers to use new system

### Phase 2: Application Updates (In Progress)
- [ ] Update all database hooks to use new mappers
- [ ] Fix test fixtures to match new validation rules
- [ ] Re-enable validation in mapping functions
- [ ] Remove deprecated mapper files

### Phase 3: Cleanup
- [ ] Remove legacy mapper exports
- [ ] Update import statements across codebase
- [ ] Add comprehensive integration tests
- [ ] Performance optimization

## Best Practices

### Do's ✅
- Always use centralized mapping functions
- Import types from `@/types` (main export)
- Use `validateEntity()` for runtime type checking
- Handle null/undefined transformations consistently
- Include meal history when mapping dishes for computed fields

### Don'ts ❌
- Don't create manual mapping logic
- Don't import from deprecated mapper files
- Don't mix database and application field naming
- Don't skip validation in production code
- Don't modify computed fields directly

## Troubleshooting

### Common Issues

1. **Test ID validation errors**
   - Solution: Use UUIDs or `test-` prefixed IDs in tests

2. **Null vs undefined mismatches**
   - Solution: Use mapping functions consistently
   - Database nulls → Application undefined

3. **Field naming errors**
   - Solution: Check field mapping conventions table
   - Use exact field names from documentation

4. **Computed field inconsistencies**
   - Solution: Always include meal history when mapping dishes
   - Don't manually set computed fields

### Performance Considerations

- **N+1 Query Prevention**: Always fetch related data in bulk
- **Batch Mapping**: Use `mapArrayFromDB` for multiple records
- **Memory Usage**: Clear large maps after batch operations
- **Validation Costs**: Enable validation selectively in production

## Future Enhancements

1. **Type Generation**: Auto-generate types from database schema
2. **Runtime Schema Validation**: Validate against actual database constraints
3. **Performance Monitoring**: Track mapping operation performance
4. **Automatic Migration**: Tools to update existing data to new format
5. **Enhanced Validation**: Custom validation rules per entity type

---

**Last Updated**: 2025-07-05  
**Version**: 1.0  
**Status**: Implementation Complete, Testing In Progress