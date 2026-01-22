# Database Documentation

Comprehensive guide for database development, migrations, and tooling.

## Schema Overview

### Tables

| Table          | Purpose                                        |
| -------------- | ---------------------------------------------- |
| `dishes`       | Core dish info with foreign key to sources     |
| `sources`      | Recipe sources (books/websites)                |
| `meal_history` | Cooking history entries linked to dishes       |
| `profiles`     | User profile data including custom cuisines    |
| `tags`         | Categorization system (cuisines, general tags) |
| `dish_tags`    | Many-to-many junction linking dishes to tags   |
| `dish_summary` | Materialized view with aggregated dish data    |

### Key Features

- **Row Level Security (RLS)**: All tables use RLS policies for user data isolation
- **Materialized Views**: `dish_summary` provides optimized aggregated queries
- **Triggers**: Automatic refresh of materialized views on data changes

## Local Development

### Quick Start

```bash
bun run dev:db:start    # Start local Supabase stack
bun run dev:db:stop     # Stop all services
bun run dev:db:reset    # Reset to baseline + seed data
bun run dev:db:studio   # Open admin UI (http://127.0.0.1:54323)
```

### Local Services

| Service       | URL                                                     | Purpose                  |
| ------------- | ------------------------------------------------------- | ------------------------ |
| API & Auth    | http://127.0.0.1:54321                                  | Main Supabase API        |
| Database      | postgresql://postgres:postgres@127.0.0.1:54322/postgres | Direct DB access         |
| Studio        | http://127.0.0.1:54323                                  | Database admin UI        |
| Email Testing | http://127.0.0.1:54324                                  | Inbucket for auth emails |

### Test Accounts

- `test@menumaker.dev` / `password123`
- `chef@menumaker.dev` / `password123`

### Sample Data

The seed includes:

- 12 sample dishes across multiple cuisines
- 6 recipe sources
- 15+ meal history entries
- Cuisine and general tags

## Migration Workflow

### Naming Convention

Format: `YYYYMMDD_HHMMSS_operation_description.sql`

Examples:

- `20250707_120000_add_user_preferences_table.sql`
- `20250707_130000_update_dish_search_function.sql`

### Creating Migrations

```bash
# Create by type
bun run db:create-migration table "add user preferences table"
bun run db:create-migration function "update dish search function"
bun run db:create-migration index "optimize meal history queries"
bun run db:create-migration data "migrate legacy cuisine data"
```

### Applying Migrations

```bash
bun run dev:db:start              # Ensure DB is running
bun run db:migrate                # Apply pending migrations
bun run dev:db:studio             # Verify in admin UI
```

### Validation

```bash
bun run db:validate-migrations    # Validate all migrations
bun run db:validate-migration FILE # Validate specific file
```

Validation checks:

- Naming convention enforcement
- SQL syntax validation
- RLS security warnings
- Anti-pattern detection
- Performance hints (missing indexes)

### Rollback

```bash
bun run db:rollback               # Rollback last migration
bun run db:migrate-down [number]  # Rollback multiple
```

## Type Generation

```bash
bun run db:generate-types   # Generate from schema
bun run db:update-types     # Force regenerate
bun run db:validate-types   # Validate existing
bun run db:check-drift      # Check schema drift
```

Generated types are in `src/integrations/supabase/types.ts`.

## Schema Diffing

```bash
bun run db:diff             # Compare local vs production
bun run db:diff-tables      # Tables only
bun run db:diff-functions   # Functions only
bun run db:diff-policies    # RLS policies only
bun run db:diff-indexes     # Indexes only
```

## Testing

```bash
bun run db:test             # Run database tests
bun run db:benchmark        # Performance benchmarks
bun run db:performance      # Tests + benchmarks
bun run db:full-check       # Complete validation suite
```

### Performance Thresholds

- Search queries: < 100ms
- Statistics: < 500ms
- CRUD operations: < 50ms
- Complex queries: < 1000ms

## Production Sync

```bash
bun run db:sync-production  # Full sync (schema + anonymized data)
bun run db:sync-schema      # Schema only
bun run db:sync-data        # Data only (anonymized)
```

Data is automatically anonymized for development.

## Directory Structure

```
supabase/
├── config.toml           # Supabase configuration
├── migrations/           # Version-controlled migrations
│   ├── 001_initial_schema.sql
│   └── ...
├── schema/               # Schema reference files
│   ├── tables.sql
│   ├── functions.sql
│   ├── policies.sql
│   └── complete_schema.sql
└── seed.sql              # Development seed data
```

## Migration Best Practices

### Required Elements

- Header comment with name, description, author, date
- Dependencies list
- Breaking changes documentation
- Rollback plan

### Security

- Enable RLS on all new tables
- Add user-scoped access policies
- Use `SECURITY DEFINER` with `search_path` for functions
- Explicit permission grants

### Performance

- Index all foreign key columns
- Use composite indexes for multi-column queries
- Consider partial indexes for conditional queries

## Troubleshooting

**Connection refused**: Ensure Docker is running and `bun run dev:db:start` completed

**Migration errors**: Run `bun run dev:db:reset` for clean state

**Authentication issues**: Verify `.env.local` has local Supabase URLs

**No data showing**: Check materialized view is populated via Studio

**Schema drift**: Run `bun run db:diff` then `bun run db:update-types`

**Type mismatches**: Regenerate with `bun run db:update-types`
