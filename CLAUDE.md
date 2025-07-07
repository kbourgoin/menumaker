# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `bun run dev` - Start development server on port 8080
- `bun run build` - Build for production
- `bun run build:dev` - Build in development mode
- `bun run lint` - Run ESLint to check code quality
- `bun run preview` - Preview production build locally
- `bun run test` - Run tests in watch mode
- `bun run test:run` - Run tests once

## Package Management

**IMPORTANT**: This project uses Bun exclusively as the package manager. Do not use npm, yarn, or pnpm.

### Adding Dependencies

```bash
# Add production dependency
bun add <package-name>

# Add development dependency
bun add -d <package-name>

# Install all dependencies
bun install
```

### Package Management Rules

- ✅ **Always use bun** for all package operations
- ✅ **Only `bun.lockb`** should exist - `package-lock.json`, `yarn.lock`, and `pnpm-lock.yaml` are gitignored
- ✅ **Clean dependencies**: Unused packages are regularly audited and removed
- 🚫 **Never use `npm install`** or `yarn install` - they will create unwanted lock files
- 🚫 **Never commit lock files** other than `bun.lockb`

### Dependency Guidelines

- **Production dependencies**: Only add packages that are needed in the built application
- **Development dependencies**: Use `-d` flag for tools, linters, test frameworks, and build utilities
- **Audit regularly**: Remove unused dependencies to keep bundle size minimal
- **Security**: Run `bun audit` before adding new dependencies

### Troubleshooting

- **"Package not found"**: Make sure to use `bun add` instead of `npm install`
- **Multiple lock files**: Delete `package-lock.json` and `yarn.lock` if they appear
- **Build issues**: Run `bun install` to ensure all dependencies are correctly installed

## Environment Setup

**IMPORTANT**: This project requires environment variables for Supabase configuration.

### First-time Setup:

1. **Copy environment template**: `cp .env.example .env.local`
2. **Update credentials**: Edit `.env.local` with your Supabase project credentials
3. **Never commit**: The `.env.local` file is automatically gitignored and should never be committed

### Required Environment Variables:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key

### Getting Credentials:

1. Go to your Supabase dashboard
2. Navigate to Settings > API
3. Copy the "Project URL" and "anon public" key
4. Paste them into your `.env.local` file

**Note**: The anon key is safe for client-side use and is designed to be exposed in frontend applications.

## Local Development Setup

**IMPORTANT**: This project includes a complete local Supabase environment for safe development without affecting production data.

### Quick Start (First-time Setup)

```bash
# 1. Install dependencies
bun install

# 2. Set up local environment
cp .env.local.example .env.local

# 3. Start local Supabase stack
bun run dev:db:start

# 4. Start development server
bun run dev
```

### Local Database Management

#### Available Commands

- `bun run dev:db:start` - Start local Supabase stack (PostgreSQL, Auth, Storage)
- `bun run dev:db:stop` - Stop all local services
- `bun run dev:db:restart` - Restart with fresh data
- `bun run dev:db:reset` - Reset to baseline schema and re-seed
- `bun run dev:db:status` - Check service status and get connection details
- `bun run dev:db:studio` - Open Supabase Studio UI (database admin)

#### Local Services

| Service       | URL                                                     | Purpose                    |
| ------------- | ------------------------------------------------------- | -------------------------- |
| API & Auth    | http://127.0.0.1:54321                                  | Main Supabase API endpoint |
| Database      | postgresql://postgres:postgres@127.0.0.1:54322/postgres | Direct database access     |
| Studio        | http://127.0.0.1:54323                                  | Database admin interface   |
| Email Testing | http://127.0.0.1:54324                                  | Inbucket email testing     |

#### Environment Configuration

**For Local Development**: Copy `.env.local.example` to `.env.local` (already configured for local services)

**For Production**: Use `.env.example` template with your production Supabase credentials

#### Sample Data

The local database comes pre-seeded with realistic sample data:

- **2 test users**: `test@menumaker.dev` and `chef@menumaker.dev` (password: `password123`)
- **12 sample dishes** across Italian, Mexican, Asian, American, French, and Mediterranean cuisines
- **6 recipe sources** including cookbooks and websites
- **15+ meal history entries** with realistic cooking dates and notes
- **Cuisine and general tags** for categorization
- **Complete relationships** between dishes, tags, sources, and meal history

#### Development Workflow

1. **Start fresh**: `bun run dev:db:reset` - Resets database and reloads seed data
2. **Monitor changes**: Use `bun run dev:db:studio` to inspect data in real-time
3. **Test features**: All app functionality works with local data
4. **Switch environments**: Change `.env.local` to test against different configurations

#### Authentication in Local Development

- **Test accounts** are automatically created with known credentials
- **Email verification** is handled by Inbucket (no real emails sent)
- **Password reset** flows work completely offline
- **JWT tokens** are generated with local secrets (not production-safe)

#### Troubleshooting Local Setup

- **"Connection refused"**: Ensure Docker is running and `bun run dev:db:start` completed successfully
- **"Migration errors"**: Run `bun run dev:db:reset` to start with clean database
- **"Authentication issues"**: Check that you're using local environment variables in `.env.local`
- **"No data showing"**: Verify materialized view is populated with `bun run dev:db:studio`

### Environment Switching

**Switch to Local Development**:

```bash
# 1. Update .env.local to use local settings
# Edit .env.local and set:
# VITE_SUPABASE_URL=http://127.0.0.1:54321
# VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# 2. Start local database
bun run dev:db:start

# 3. Restart development server to pick up new environment
bun run dev
```

**Switch to Production Testing**:

```bash
# 1. Update .env.local to use production settings
# Edit .env.local and set:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-production-anon-key

# 2. Restart development server
bun run dev
```

**⚠️ Important**: Always restart your development server (`bun run dev`) after changing environment variables in `.env.local`. Vite only reads environment variables at startup.

## Database Schema Management

**IMPORTANT**: This project uses Supabase for database management with a structured migration system.

### Schema Structure

The database consists of several main tables:

- `dishes` - Core dish information with foreign key to sources
- `sources` - Recipe sources (books/websites)
- `meal_history` - Cooking history entries linked to dishes
- `profiles` - User profile data including custom cuisines
- `tags` - Categorization system for dishes (cuisines, general tags)
- `dish_tags` - Many-to-many junction table linking dishes to tags
- `dish_summary` - Materialized view with aggregated dish data

## Database Migration Workflow

**IMPORTANT**: This project follows a standardized migration workflow for safe, traceable database changes.

### Migration Naming Convention

All migrations follow the format: `YYYYMMDD_HHMMSS_operation_description.sql`

**Examples**:

- `20250707_120000_add_user_preferences_table.sql`
- `20250707_130000_update_dish_search_function.sql`
- `20250707_140000_create_meal_planning_indexes.sql`
- `20250707_150000_migrate_legacy_cuisine_data.sql`

### Creating Migrations

#### Quick Start

```bash
# Create a new table
bun run db:create-migration table "add user preferences table"

# Update a function
bun run db:create-migration function "update dish search function"

# Add indexes
bun run db:create-migration index "optimize meal history queries"

# Migrate data
bun run db:create-migration data "migrate legacy cuisine data"
```

#### Migration Types

**Table Creation**:

- Creates new table with RLS policies
- Includes standard columns (id, user_id, created_at, updated_at)
- Adds appropriate indexes and permissions
- Template: `table_creation_template.sql`

**Function Updates**:

- Drops existing function safely
- Creates updated function with proper security
- Includes permission grants and documentation
- Template: `function_update_template.sql`

**Index Creation**:

- Adds performance indexes with comments
- Supports composite, partial, and full-text indexes
- Documents expected performance improvements
- Template: `index_creation_template.sql`

**Data Migration**:

- Includes validation and rollback strategy
- Creates backup tables when needed
- Validates results before completion
- Template: `data_migration_template.sql`

### Migration Validation

#### Automatic Validation

```bash
# Validate all migrations
bun run db:validate-migrations

# Validate specific migration
bun run db:validate-migration 20250707_120000_add_user_preferences.sql
```

#### Validation Checks

- ✅ **Naming Convention**: Enforces YYYYMMDD_HHMMSS_description.sql format
- ✅ **SQL Syntax**: Validates against local database
- ✅ **Metadata**: Requires migration header, description, author
- ✅ **RLS Security**: Warns about tables without Row Level Security
- ✅ **Anti-patterns**: Catches unsafe DROP statements
- ✅ **Performance**: Warns about missing indexes on foreign keys

#### Pre-commit Validation

All migrations are automatically validated before commit. The pre-commit hook will:

1. Detect changed migration files
2. Run validation checks
3. Block commit if validation fails

### Development Workflow

#### 1. Create Migration

```bash
# Generate migration from template
bun run db:create-migration table "add notification preferences"

# Edit generated file and replace placeholders
# File opens automatically in your editor
```

#### 2. Test Locally

```bash
# Ensure local database is running
bun run dev:db:start

# Apply migration to local database
bun run db:migrate

# Verify in Supabase Studio
bun run dev:db:studio
```

#### 3. Validate and Commit

```bash
# Validate migration
bun run db:validate-migration [filename]

# Commit (validation runs automatically)
git add supabase/migrations/[filename]
git commit -m "feat: add notification preferences table"
```

#### 4. Create Rollback (if needed)

```bash
# Generate rollback script
bun run db:create-migration rollback "20250707_120000_add_notification_preferences"

# Edit rollback script to safely undo changes
# Test rollback on local database
```

### Migration Templates

#### Table Creation Template

- Standard columns: id, user_id, created_at, updated_at
- Row Level Security enabled by default
- User-scoped policies for all operations
- Performance indexes on user_id and created_at
- Proper permissions and documentation

#### Function Update Template

- Safe function replacement with IF EXISTS
- Security definer with search_path protection
- Proper parameter and return type documentation
- Permission grants for all roles

#### Data Migration Template

- Pre-migration validation
- Backup table creation
- Step-by-step transformation
- Post-migration verification
- Rollback instructions

### Rollback Procedures

#### Automatic Rollback

```bash
# Rollback last migration
bun run db:rollback

# Rollback multiple migrations
bun run db:migrate-down [number]
```

#### Manual Rollback

1. Create rollback migration using template
2. Test rollback on local database copy
3. Apply rollback migration
4. Verify application functionality

#### Rollback Safety

- Always test on database copy first
- Document data preservation strategy
- Verify no dependent objects exist
- Include validation checks

### Migration Best Practices

#### Required Elements

- ✅ **Header Comment**: Migration name, description, author, date
- ✅ **Dependencies**: List dependent migrations or "None"
- ✅ **Breaking Changes**: Document any breaking changes
- ✅ **Rollback Plan**: How to safely undo the migration

#### Security Requirements

- 🔒 **RLS Enabled**: All new tables must have Row Level Security
- 🔒 **User Policies**: Tables must have user-scoped access policies
- 🔒 **Function Security**: Use SECURITY DEFINER with search_path
- 🔒 **Permission Grants**: Explicit grants for anon, authenticated, service_role

#### Performance Considerations

- 📈 **Index Foreign Keys**: Always index foreign key columns
- 📈 **Composite Indexes**: For multi-column WHERE clauses
- 📈 **Partial Indexes**: For conditional queries (WHERE status = 'active')
- 📈 **Impact Assessment**: Document expected performance changes

#### Data Safety

- 💾 **Backup Critical Data**: Create backup tables for destructive changes
- 💾 **Validate Results**: Include post-migration verification
- 💾 **Atomic Operations**: Use transactions for multi-step changes
- 💾 **Test Locally**: Always test against local database first

### Emergency Procedures

#### Failed Migration Recovery

1. **Assess Impact**: Check application functionality
2. **Rollback Decision**: Determine if rollback is safe
3. **Execute Rollback**: Use prepared rollback migration
4. **Verify Recovery**: Confirm application stability
5. **Post-Incident**: Document cause and prevention

#### Production Migration Guidelines

1. **Staging First**: Test on staging environment
2. **Off-Peak Timing**: Deploy during low-traffic periods
3. **Monitor Closely**: Watch for errors and performance impact
4. **Rollback Ready**: Have tested rollback procedure ready

### Migration Management

**Directory Structure**:

```
supabase/
├── config.toml                    # Supabase configuration
├── migrations/                    # Database migrations (version controlled)
│   ├── 001_initial_schema.sql    # Complete baseline schema
│   ├── 002_add_tag_categories.sql # Tag categorization system
│   └── ...                       # Future migrations
├── schema/                       # Schema components (for reference)
│   ├── tables.sql               # Table definitions
│   ├── functions.sql            # Database functions
│   ├── policies.sql             # Row Level Security policies
│   ├── indexes.sql              # Index definitions
│   ├── views.sql                # Views and materialized views
│   └── complete_schema.sql      # Full schema dump
└── docs/                        # Schema documentation
    └── schema-overview.md       # Database structure overview
```

### Schema Management Commands

**Schema Extraction**:

```bash
# Extract complete production schema
supabase db dump --linked --file supabase/schema/complete_schema.sql

# Create new migration
supabase migration new <migration_name>

# Apply migrations to local database
supabase migration up

# Reset local database to clean state
supabase db reset
```

**Schema Validation**:

```bash
# Validate schema consistency
supabase db diff

# Check migration status
supabase migration list
```

### Schema Management Guidelines

- **Baseline Migration**: `001_initial_schema.sql` represents the complete production schema as of July 2025
- **Migration Naming**: Use descriptive names like `002_add_tag_categories.sql`
- **Schema Safety**: Always use read-only access when extracting production schema
- **Documentation**: All major schema changes should be documented in the migration files
- **Testing**: Test migrations in local environment before applying to production

### Key Database Features

- **Row Level Security (RLS)**: All tables use RLS policies to ensure users can only access their own data
- **Materialized Views**: `dish_summary` provides optimized queries for dish data with aggregated information
- **Foreign Key Constraints**: Proper referential integrity between related tables
- **Indexes**: Strategic indexing on foreign keys and frequently queried columns
- **Triggers**: Automatic refresh of materialized views when underlying data changes

### Development Workflow

1. **Local Development**: Use `supabase start` to run local Supabase instance
2. **Schema Changes**: Create new migration files for any schema modifications
3. **Testing**: Test migrations thoroughly in local environment
4. **Production**: Apply migrations to production through Supabase dashboard or CLI

**Security Note**: The schema files contain no actual user data, only table structures and policies.

## Enhanced Database Development Tooling

Advanced database development tools for schema management, type generation, testing, and performance monitoring.

### Daily Database Development Workflow

```bash
# 1. Start local database
bun run dev:db:start

# 2. Check for schema changes
bun run db:diff

# 3. Update types if needed
bun run db:update-types

# 4. Run database tests
bun run db:test

# 5. Check performance
bun run db:benchmark
```

### Schema Diffing Tools

Compare schema differences between local and production environments:

```bash
# Compare all schema components
bun run db:diff

# Compare specific components
bun run db:diff-tables      # Tables only
bun run db:diff-functions   # Functions only
bun run db:diff-policies    # RLS policies only
bun run db:diff-indexes     # Indexes only

# Advanced diffing options
./scripts/schema-diff.sh --production-to-local
./scripts/schema-diff.sh --output=report.html --format=html
```

**Output Example**:

```
Schema Differences: Local → Production

TABLES:
  + user_preferences (new table)
  - old_settings (removed table)
  ~ dishes (modified):
    + dietary_restrictions (new column)
    ~ name (varchar(100) → varchar(255))

FUNCTIONS:
  ~ search_dishes() (modified)
  + get_user_preferences() (new function)
```

### TypeScript Type Generation

Automatically generate TypeScript types from database schema:

```bash
# Generate types from current schema
bun run db:generate-types

# Force regeneration (overwrites existing)
bun run db:update-types

# Validate existing types
bun run db:validate-types

# Check for schema drift
bun run db:check-drift
```

**Features**:

- ✅ Automatic type generation from Supabase schema
- ✅ Schema drift detection and warnings
- ✅ TypeScript compilation validation
- ✅ Backup of existing types before regeneration
- ✅ Integration with existing type system

**Generated Types Structure**:

```typescript
// Auto-generated from database schema
export interface Database {
  public: {
    Tables: {
      dishes: {
        Row: { id: string; name: string; user_id: string /* ... */ };
        Insert: { id?: string; name: string; user_id: string /* ... */ };
        Update: { id?: string; name?: string /* ... */ };
      };
      // ... other tables
    };
    Functions: {
      search_dishes: {
        Args: { query: string; user_id: string };
        Returns: Array<Database["public"]["Tables"]["dishes"]["Row"]>;
      };
      // ... other functions
    };
  };
}
```

### Database Testing Framework

Comprehensive testing for database functions and performance:

```bash
# Run all database tests
bun run db:test

# Run SQL-based tests (requires pg_prove)
bun run db:test-sql

# Run performance tests
bun run db:benchmark

# Combined performance testing
bun run db:performance
```

**Test Categories**:

1. **Function Tests** (`tests/database/test_search_functions.sql`):
   - Search functionality validation
   - User isolation testing
   - SQL injection prevention
   - Input validation

2. **Security Tests** (`tests/database/test_rls_policies.sql`):
   - RLS policy verification
   - Permission validation
   - Data isolation checks

3. **Performance Tests** (`tests/database/performance.test.ts`):
   - Query execution time benchmarks
   - Performance regression detection
   - Load testing simulation

### Performance Monitoring

Monitor and benchmark database performance:

```bash
# Full performance benchmark
bun run db:benchmark

# Specific benchmark categories
bun run db:benchmark-search    # Search queries
bun run db:benchmark-stats     # Statistics calculations
bun run db:benchmark-crud      # CRUD operations

# Advanced benchmarking options
./scripts/benchmark-queries.sh --iterations=10 --verbose
./scripts/benchmark-queries.sh --timeout=60 --no-report
```

**Performance Thresholds**:

- Search queries: < 100ms
- Statistics: < 500ms
- CRUD operations: < 50ms
- Complex queries: < 1000ms

**Benchmark Output**:

```
=== Search Performance Tests ===

Testing: Basic dish search
  ✓ Average: 45ms | Min: 32ms | Max: 67ms | Success: 5/5

Testing: Complex search query
  ⚠ Average: 234ms | Min: 198ms | Max: 289ms | Success: 5/5
    Performance warning: Consider optimization
```

### Production Sync Tools

Safely sync schema and data from production to local development:

```bash
# Full production sync (schema + anonymized data)
bun run db:sync-production

# Schema only (no data)
bun run db:sync-schema

# Data only (no schema changes)
bun run db:sync-data

# Advanced sync options
./scripts/sync-production.sh --dry-run
./scripts/sync-production.sh --no-anonymize --force
```

**Safety Features**:

- 🔒 **Read-only access** to production
- 🔒 **Automatic data anonymization** for development
- 🔒 **Local backup** before sync
- 🔒 **Confirmation prompts** for safety

**Data Anonymization**:

- User emails → `user12345@example.com`
- User names → `Test User 12345`
- Dish names → `Sample Italian Dish A`
- Source URLs → `https://example.com/source/12345`
- Notes and descriptions → Generic placeholder text

### Database Backup & Restore

Local database backup and restore operations:

```bash
# Create local database backup
bun run db:backup

# Manual restore (follow printed instructions)
bun run db:restore

# Direct database console access
bun run db:console
```

### Comprehensive Database Validation

Run complete database health check:

```bash
# Full database validation suite
bun run db:full-check

# This runs:
# 1. Migration validation
# 2. Schema drift detection
# 3. Database tests
# 4. Performance benchmarks
```

### Pre-commit Integration

Database validations run automatically on commit:

```bash
# .husky/pre-commit includes:
if git diff --cached --name-only | grep -q "supabase/migrations/.*\.sql$"; then
  echo "🔍 Validating database migrations..."
  bun run db:validate-migrations || exit 1
fi
```

### IDE Integration

**Recommended VS Code Extensions**:

- SQLTools (database exploration)
- PostgreSQL Syntax Highlighting
- Database Client (query execution)

**VS Code Settings** (`.vscode/settings.json`):

```json
{
  "sqltools.connections": [
    {
      "name": "Local Supabase",
      "driver": "PostgreSQL",
      "server": "localhost",
      "port": 54322,
      "database": "postgres",
      "username": "postgres",
      "password": "postgres"
    }
  ]
}
```

### Development Best Practices

#### Making Schema Changes

1. **Create Migration**: `bun run db:create-migration table "add feature"`
2. **Test Locally**: Apply and test in local environment
3. **Update Types**: `bun run db:update-types`
4. **Run Tests**: `bun run db:test` and `bun run db:performance`
5. **Validate**: `bun run db:validate-migrations`
6. **Commit**: Include migration and updated types

#### Performance Optimization

1. **Benchmark Before**: `bun run db:benchmark` to establish baseline
2. **Make Changes**: Apply schema or query optimizations
3. **Benchmark After**: Compare performance metrics
4. **Regression Testing**: Ensure no performance degradation

#### Troubleshooting

**Schema Drift Issues**:

```bash
# Check what's different
bun run db:diff

# Update types to match current schema
bun run db:update-types

# Sync from production if needed
bun run db:sync-schema
```

**Performance Issues**:

```bash
# Identify slow queries
bun run db:benchmark --verbose

# Check for missing indexes
./scripts/schema-diff.sh --indexes

# Run performance analysis
bun run db:performance
```

**Type Mismatches**:

```bash
# Regenerate types from current schema
bun run db:update-types

# Validate types compile correctly
bun run db:validate-types

# Check for drift between schema and types
bun run db:check-drift
```

### Security Considerations

- 🔒 **Production Access**: All tools use read-only access to production
- 🔒 **Data Anonymization**: Sensitive data automatically anonymized
- 🔒 **Local Only**: Development tools only affect local database
- 🔒 **Backup Safety**: Local backups created before destructive operations
- 🔒 **Access Control**: Database credentials managed through environment variables

## Git Workflow

**IMPORTANT**: Always create a feature branch before making any changes. Never develop directly on the main branch.

### Proper Development Workflow:

1. **Start with a feature branch**: `git checkout -b feature/descriptive-name`
2. **Make your changes** on the feature branch
3. **Test thoroughly** - **REQUIRED before creating PR**:
   - `bun run test:run` - **MUST pass all tests**
   - `bun run lint` - **MUST pass linting**
   - `bun run build` - **MUST build successfully**
4. **Commit your changes** with descriptive messages
5. **Push the feature branch**: `git push -u origin feature/descriptive-name`
6. **Create a Pull Request** from the feature branch to main
7. **Wait for all GitHub Actions to pass** before merging

### Pull Request Requirements:

- ✅ **All tests MUST pass locally before creating PR**: Run `bun run test:run` and ensure 100% pass rate
- ✅ **All GitHub Actions must pass**: Linting, type checking, tests, and build must all succeed
- ✅ **Status checks must be green**: No failing automated checks are allowed
- 🚫 **PRs cannot be merged with failing checks**: This rule is strictly enforced
- 🚫 **PRs with failing tests will be rejected**: Always run tests locally first
- 📋 **Manual review**: Code review and approval from maintainers is still required
- **Test Coverage**: All PRs _MUST_ maintain at least 80% test coverage for business logic utilities

### Example:

```bash
# ✅ CORRECT - Create feature branch first
git checkout -b feature/fix-dashboard-loading
# Make changes
# REQUIRED: Test everything before creating PR
bun run test:run    # Must pass all tests
bun run lint        # Must pass linting
bun run build       # Must build successfully
# Only then commit and push
git add .
git commit -m "fix: dashboard loading issue"
git push -u origin feature/fix-dashboard-loading
# Create PR

# ❌ WRONG - Never do this
git checkout main
# Make changes directly on main - DON'T DO THIS!
# Also wrong: Creating PR without running tests first
```

This workflow prevents conflicts and makes it easier to review changes before they're merged to main.

## Code Quality & Development Tools

This project has comprehensive code quality automation to ensure consistent, high-quality code.

### Quality Gates (Automatic)

All of these run automatically on pre-commit and in CI/CD:

- ✅ **ESLint**: Catches code quality issues and unused variables
- ✅ **TypeScript**: Strict mode enabled with comprehensive type checking
- ✅ **Prettier**: Automatic code formatting for consistency
- ✅ **Tests**: Must pass before commits are allowed
- ✅ **Pre-commit hooks**: Prevents bad commits from being made

### Development Commands

```bash
# Code quality (run these before creating PRs)
bun run quality           # Run all quality checks (lint + type-check + format-check)
bun run lint              # Check for linting errors
bun run lint:fix          # Fix auto-fixable linting errors
bun run format            # Format all code with Prettier
bun run format:check      # Check if code is properly formatted
bun run type-check        # Run TypeScript type checking

# Testing
bun run test              # Run tests in watch mode
bun run test:run          # Run tests once (used in CI)
bun run test:coverage     # Run tests with coverage report

# Building
bun run build             # Build for production
bun run build:dev         # Build in development mode
```

### IDE Setup (VS Code Recommended)

**Required Extensions** (auto-suggested when opening project):

- ESLint - Real-time linting
- Prettier - Code formatting
- Tailwind CSS IntelliSense - CSS class autocomplete
- TypeScript and JavaScript Language Features - Type checking
- EditorConfig - Cross-editor consistency

**Automatic Features**:

- 💾 **Format on save** - Code automatically formatted
- 🔧 **Fix on save** - ESLint errors automatically fixed
- 📝 **Auto imports** - Missing imports added automatically
- 🎯 **Error highlighting** - TypeScript and ESLint errors shown in real-time

### Pre-commit Hooks (Automatic)

The git hooks automatically run on every commit:

1. **ESLint** fixes auto-fixable issues
2. **Tests** must pass for changed files
3. **Prettier** formats staged files
4. **TypeScript** compilation must succeed

**If commits fail**: Fix the issues shown and try again. The hooks prevent broken code from being committed.

### Development Workflow

1. **Clone repository**
2. **Install dependencies**: `bun install`
3. **Setup environment**: Copy `.env.example` to `.env.local`
4. **Start development**: `bun run dev`
5. **Make changes** - IDE will automatically format and show errors
6. **Commit** - Pre-commit hooks ensure quality automatically

### New Developer Setup (<5 minutes)

```bash
# 1. Clone and setup
git clone <repository-url>
cd menumaker
bun install

# 2. Environment setup
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 3. Start development
bun run dev
# Open VS Code: code .
# Install recommended extensions when prompted

# 4. Verify setup
bun run quality  # Should pass all checks
```

### Code Quality Standards

- **TypeScript**: Strict mode enabled with comprehensive type checking
- **ESLint**: Catches common errors, enforces consistent code style
- **Prettier**: Consistent formatting across all files (spaces, quotes, etc.)
- **Unused variables**: Automatically caught and prevented (prefix with `_` to allow)
- **Import organization**: Automatically sorted and cleaned up
- **Tests**: Required for business logic, maintained coverage standards

This automated setup ensures that all developers follow the same standards and that code quality is maintained consistently across the project.

## Architecture Overview

This is a React-based meal/dish management application using the following technology stack:

### Core Technologies

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with tailwindcss-animate
- **State Management**: TanStack React Query for server state
- **Routing**: React Router v6
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **PWA**: Progressive Web App with service worker and offline capabilities

### Key Application Concepts

- **Dishes**: Core entities representing meals/recipes with cuisines, sources, and cooking history
- **Sources**: References to cookbooks, websites, or other recipe sources
- **Meal History**: Tracks when dishes were cooked with optional notes
- **Cuisines**: Categorization system for dishes (Italian, Mexican, Asian, etc.)

### Database Schema

The app uses 4 main Supabase tables:

- `dishes` - Core dish information with foreign key to sources
- `sources` - Recipe sources (books/websites)
- `meal_history` - Cooking history entries linked to dishes
- `profiles` - User profile data including custom cuisines
- `dish_summary` - Database view with aggregated dish data

### Code Organization

**Data Layer**:

- `src/integrations/supabase/` - Database client and type definitions
- `src/hooks/` - Custom hooks organized by domain (dish/, source/, import/)
- `src/utils/` - Utility functions for data processing and business logic

**UI Layer**:

- `src/components/ui/` - Reusable shadcn/ui components
- `src/components/` - Feature-specific components organized by domain
- `src/pages/` - Route-level page components

**Key Patterns**:

- Hooks are split into queries (`useDishQueries`) and mutations (`useDishMutations`)
- Components use controlled composition patterns from shadcn/ui
- Authentication state managed through `AuthProvider` context
- TypeScript path aliases: `@/` maps to `src/`

### Import Paths

Use `@/` prefix for all internal imports (configured in tsconfig.json and vite.config.ts)

### Authentication Flow

All routes except `/auth` require authentication. The `AuthProvider` handles session management and redirects unauthenticated users to the auth page.

### Progressive Web App (PWA)

The application is configured as a PWA with the following features:

- **Installation**: Can be installed on mobile devices via browser install prompt
- **Offline Support**: Service worker caches app shell and API responses for offline access
- **App Manifest**: `public/manifest.json` defines app metadata, icons, and display settings
- **Service Worker**: Automatic generation via Vite PWA plugin with Workbox
- **Caching Strategy**: NetworkFirst for Supabase API calls, CacheFirst for static assets
- **Install Button**: `PWAInstallButton` component shows when app is installable
- **Icons**: Multiple sizes generated (192x192, 512x512, 180x180) for different devices

**PWA Files**:

- `public/manifest.json` - Web app manifest
- `public/sw.js` - Manual service worker (superseded by Vite PWA generated one)
- `src/hooks/usePWAInstall.ts` - Install prompt logic
- `src/components/PWAInstallButton.tsx` - Install button component
