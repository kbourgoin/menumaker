# MenuMaker Dependency Analysis & Error Handling Audit

## Import Dependency Map

### Dependency Hierarchy (Top to Bottom)
```
External Libraries (React, Tanstack Query, Supabase, etc.)
    ↓
Types & Integrations (Safe - No circular risks)
    ↓
Utils (Clean - No hook/component imports)
    ↓
Hooks (RISK ZONE - Complex interdependencies)
    ↓
Components (Safe - One-way consumers)
    ↓
Pages (Safe - Top-level consumers)
```

## 🔴 High Risk Circular Import Areas

### 1. Composite Hook Pattern Risk
**Location**: `useMeals.tsx` and `useDishes.tsx`
```
useMeals.tsx
├── imports useDishQueries
├── imports useDishMutations  
├── imports useMealHistory
├── imports useWeeklyMenu
├── imports useSources
└── imports useStats

useDishes.tsx
├── imports useDishQueries
├── imports useDishMutations
└── imports useMealHistory
```
**Risk**: If any imported hooks try to import these composite hooks → circular dependency

### 2. Source Hook Interdependencies
```
useSources ←→ useSourceEdit
    ↓           ↓
useSourceMerge ←→ useSourceValidation
```
**Risk**: Multiple hooks importing each other creates potential circles

## 🟡 Medium Risk Areas

### 1. Auth Dependency Chain
```
useAuth → AuthProvider (Component)
    ↓
Multiple hooks import useAuth:
├── useUserCuisines
├── useTagQueries  
├── useTagMutations
└── [Many others]
```
**Risk**: Hook-to-Component dependency creates coupling

### 2. Dish Utils Chain  
```
useDishQueries → dishFetchUtils → optimizedDishFetch
```
**Risk**: Long dependency chain, manageable but monitor for expansion

## 🟢 Safe Dependency Areas

### 1. Clean Utils Directory
- **No imports from `@/hooks`** ✅
- **No imports from `@/components`** ✅
- Only external libraries and types

### 2. Component Dependencies
- All component → hook imports are **one-way** ✅
- Components are pure consumers, never imported by hooks

### 3. Page Components
- Top-level consumers only ✅
- No risk of circular imports

## Current Error Handling Audit

### ✅ Strengths
1. **Global ErrorBoundary**: Comprehensive class-based boundary in place
2. **Loading States**: Consistent skeleton loading throughout app
3. **Empty States**: Well-implemented empty state components
4. **Toast Notifications**: Good user feedback system
5. **React Query Integration**: Built-in error states from TanStack Query
6. **Specialized Error Components**: Dedicated error states for key features

### ❌ Critical Gaps
1. **No page-level error boundaries** - Only global coverage
2. **Silent database failures** - Hooks log errors but don't expose to UI
3. **No retry mechanisms** - Limited error recovery options
4. **Inconsistent error handling** - Mixed patterns across components
5. **No error classification** - All errors treated the same
6. **Missing error states** - Some pages lack dedicated error UI

### 📍 Key Files Already in Place
- `/src/components/ErrorBoundary.tsx` - Global error boundary (✅ Good)
- `/src/components/meal-detail/ErrorState.tsx` - Page error state (✅ Good)
- `/src/components/LoadingSpinner.tsx` - Loading component (✅ Good)
- Multiple empty state components (✅ Good)

## Recommended Implementation Strategy

### Phase 2: Standalone Error Utils (Next Phase)
Create these files with **ZERO dependencies** on hooks/components:
1. `src/utils/errorHandling.ts` - Pure error utilities
2. `src/types/errors.ts` - Error type definitions
3. `src/utils/errorMessages.ts` - User-friendly message mapping

### Dependency Rules for Error Utils
```
✅ ALLOWED IMPORTS:
- External libraries (only if pure utilities)
- Type definitions
- Constants

❌ FORBIDDEN IMPORTS:
- Any file from @/hooks/*
- Any file from @/components/*
- React (except for type definitions)
- TanStack Query
- Supabase client
```

### Import Validation Checklist
Before implementing any error utility:
1. ✅ Check TypeScript compilation
2. ✅ Verify no React imports
3. ✅ Verify no hook imports  
4. ✅ Verify no component imports
5. ✅ Test import in isolation
6. ✅ Run build to check for circular imports

## Monitoring Strategy

### Ongoing Dependency Health Checks
1. Run `bun run build` after each phase
2. Check TypeScript compilation warnings
3. Monitor bundle size for circular import bloat
4. Use ESLint rules to prevent problematic imports

### Success Metrics
- ✅ Zero circular import warnings
- ✅ Clean TypeScript compilation  
- ✅ Successful production builds
- ✅ Error utilities testable in isolation
- ✅ No performance regression from error handling

---
*Generated: 2025-06-30*
*Purpose: Guide error handling implementation for Issue #35*
*Status: Phase 1 Complete - Ready for Phase 2*