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

**Package Management**: This project uses Bun as the package manager. Use `bun install` to install dependencies and `bun add <package>` to add new packages.

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