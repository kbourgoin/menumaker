# Component Organization

This directory contains all React components organized by domain and functionality for better maintainability and discoverability.

## Directory Structure

### Domain-Based Organization
Components are organized by their primary domain or context:

- **`auth/`** - Authentication related components (login, signup, providers)
- **`data/`** - Data management and migration components
- **`dialogs/`** - Modal dialogs and overlays
- **`layout/`** - Page layout and navigation components
- **`settings/`** - Application settings and configuration
- **`shared/`** - Reusable components used across multiple domains

### Feature-Specific Directories
Components specific to particular features are grouped together:

- **`dish-card/`** - All components related to displaying dish cards
- **`dish-form/`** - Form components for creating/editing dishes
- **`dish-table/`** - Table view components for dishes
- **`dishes/`** - Components for dish listing, filtering, and searching
- **`dashboard/`** - Dashboard-specific components
- **`meal-detail/`** - Components for meal detail pages
- **`source/`** - Recipe source management components
- **`tags/`** - Tag and cuisine management components

### Framework Components
- **`ui/`** - Base UI components from shadcn/ui
- **`dev/`** - Development utilities and debugging components

## Import Patterns

Each domain directory includes a barrel export (`index.ts`) for clean imports:

```typescript
// ✅ Good - Use barrel exports
import { Layout, Header } from '@/components/layout'
import { AddSourceDialog, EditSourceDialog } from '@/components/dialogs'
import { ErrorBoundary, LoadingSpinner } from '@/components/shared'

// ❌ Avoid - Direct file imports for organized components
import Layout from '@/components/layout/Layout'
import { AddSourceDialog } from '@/components/dialogs/AddSourceDialog'
```

## Component Guidelines

### Shared Components
Place components in `shared/` if they:
- Are used in 3+ different domains
- Provide core functionality (error handling, loading states)
- Are utility components without domain-specific logic

### Domain Components
Place components in domain directories if they:
- Have domain-specific business logic
- Are primarily used within one context
- Contain domain-specific data structures

### When to Create New Directories
Create new domain directories when:
- You have 3+ components related to a new feature
- The feature has distinct business logic
- Components would benefit from co-location

## Benefits

This organization provides:

1. **Better Discoverability** - Easy to find components by domain
2. **Reduced Coupling** - Clear boundaries between different concerns
3. **Easier Maintenance** - Related components are co-located
4. **Clean Imports** - Barrel exports provide clean import paths
5. **Scalability** - New features can add their own directories

## Migration History

This organization was implemented as part of Issue #42 - "Standardize Component Organization and Directory Structure" to improve codebase maintainability and developer experience.