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

## Git Workflow

**IMPORTANT**: Always create a feature branch before making any changes. Never develop directly on the main branch.

### Proper Development Workflow:
1. **Start with a feature branch**: `git checkout -b feature/descriptive-name`
2. **Make your changes** on the feature branch
3. **Test thoroughly** using the development commands above
4. **Commit your changes** with descriptive messages
5. **Push the feature branch**: `git push -u origin feature/descriptive-name`
6. **Create a Pull Request** from the feature branch to main

### Example:
```bash
# ✅ CORRECT - Create feature branch first
git checkout -b feature/fix-dashboard-loading
# Make changes, test, commit
git push -u origin feature/fix-dashboard-loading
# Create PR

# ❌ WRONG - Never do this
git checkout main
# Make changes directly on main - DON'T DO THIS!
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