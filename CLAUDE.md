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
