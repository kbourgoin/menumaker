# Technical Debt Reduction Plan

**Project**: MenuMaker  
**Created**: 2025-06-28  
**Status**: Planning Phase  
**Target Completion**: 6 weeks

## Overview

This document tracks the systematic reduction of technical debt in the MenuMaker codebase. The plan addresses 23 identified issues across 4 severity levels, focusing on security, consistency, testing, and developer experience.

## Executive Summary

- **Current State**: Solid architectural foundation with React Query, shadcn/ui, and Supabase
- **Key Issues**: Security vulnerabilities, inconsistent patterns, testing gaps
- **Estimated Effort**: 6 weeks across 4 phases
- **Primary Goal**: Improve maintainability, security, and developer confidence

---

## Phase Tracker

### ✅ Completed Phases
- None yet

### 🔄 Current Phase
- **Phase 1**: Security & Stability (Week 1)

### 📅 Upcoming Phases
- **Phase 2**: Architecture Consistency (Week 2-3)
- **Phase 3**: Testing & Quality (Week 4-5)
- **Phase 4**: Developer Experience (Week 6)

---

## Issues Inventory

### 🚨 CRITICAL Issues (2 total)

#### CRITICAL-001: Security Vulnerability - Exposed Supabase Keys
- **Status**: ❌ Not Started
- **Files**: `src/integrations/supabase/client.ts:6-7`
- **Issue**: Production Supabase URL and API key hardcoded in source code
- **Risk**: Anyone with code access can see production credentials
- **Solution**: Move to environment variables
- **Effort**: 2 hours
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] Create `.env.local` and `.env.example` files
  - [ ] Update `client.ts` to use `process.env` variables
  - [ ] Update deployment documentation
  - [ ] Verify local development still works
  - [ ] Ensure production deployment uses env vars

#### CRITICAL-002: Missing Error Handling in Database Operations
- **Status**: ❌ Not Started
- **Files**: Multiple hooks in `src/hooks/`
- **Issue**: Database operations lack proper error boundaries and fallbacks
- **Risk**: Application crashes when database operations fail
- **Solution**: Implement comprehensive error handling
- **Effort**: 8 hours
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] Add React Error Boundaries around major components
  - [ ] Implement try-catch in all database operations
  - [ ] Add fallback UI states for errors
  - [ ] Test error scenarios manually
  - [ ] Add error logging/tracking

### 🔴 HIGH Priority Issues (4 total)

#### HIGH-001: Inconsistent Hook Architecture
- **Status**: ❌ Not Started
- **Files**: `src/hooks/` directory
- **Issue**: Mixed patterns, duplicate files, naming inconsistencies
- **Examples**:
  - Duplicate: `sources.tsx` vs `sources/index.ts` vs `source/index.ts`
  - Naming: `useDishes.tsx` vs `useMeals.tsx` vs `useMealHistory.tsx`
- **Solution**: Consolidate into consistent directory structure
- **Effort**: 12 hours
- **Dependencies**: None
- **Target Structure**:
  ```
  src/hooks/
  ├── dishes/
  │   ├── useDishQueries.ts
  │   ├── useDishMutations.ts
  │   └── index.ts
  ├── sources/
  │   ├── useSourceQueries.ts
  │   ├── useSourceMutations.ts
  │   └── index.ts
  ├── auth/
  ├── meal-history/
  └── shared/
  ```
- **Acceptance Criteria**:
  - [ ] Consolidate duplicate hook files
  - [ ] Standardize naming conventions
  - [ ] Create consistent directory structure
  - [ ] Update all imports across codebase
  - [ ] Test that all functionality still works

#### HIGH-002: Type Safety Issues
- **Status**: ❌ Not Started
- **Files**: `tsconfig.json`, various type definitions
- **Issue**: TypeScript strict mode disabled, inconsistent field naming
- **Examples**:
  - `tsconfig.json:13,16`: `noUnusedParameters: false`, `noUnusedLocals: false`
  - DB fields: `dishid`, `createdat` vs App fields: `dishId`, `createdAt`
- **Solution**: Enable strict mode incrementally, standardize naming
- **Effort**: 16 hours
- **Dependencies**: HIGH-001 (hook consolidation)
- **Acceptance Criteria**:
  - [ ] Enable TypeScript strict mode flags one by one
  - [ ] Fix all resulting type errors
  - [ ] Standardize all field names to camelCase
  - [ ] Update database mapping functions
  - [ ] Ensure no TypeScript errors in build

#### HIGH-003: Performance Issues in Database Queries
- **Status**: ❌ Not Started
- **Files**: `src/hooks/dish/useDishQueries.tsx:27-52`
- **Issue**: Complex fallback logic with multiple sequential database calls
- **Impact**: Slow page loads when materialized view fails
- **Solution**: Optimize query logic and reduce fallbacks
- **Effort**: 6 hours
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] Simplify fallback logic in useDishQueries
  - [ ] Implement proper loading states
  - [ ] Add query performance monitoring
  - [ ] Test with large datasets
  - [ ] Measure page load improvement

#### HIGH-004: Database Schema Inconsistencies
- **Status**: ❌ Not Started
- **Files**: `src/integrations/supabase/types.ts`, `src/types/index.ts`
- **Issue**: Field naming and type mapping inconsistencies
- **Solution**: Create unified type definitions and mapping layer
- **Effort**: 8 hours
- **Dependencies**: HIGH-002 (type safety)
- **Acceptance Criteria**:
  - [ ] Create single source of truth for types
  - [ ] Implement consistent field mapping
  - [ ] Update all database interaction code
  - [ ] Add type validation at boundaries
  - [ ] Test data flow end-to-end

### 🟡 MEDIUM Priority Issues (4 total)

#### MEDIUM-001: Excessive Console Logging
- **Status**: ❌ Not Started
- **Files**: 15+ files with console statements
- **Examples**: `src/pages/MealDetail.tsx:39,42,57,62,69,77`
- **Solution**: Remove debug logs, implement proper logging
- **Effort**: 4 hours
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] Remove all console.log statements
  - [ ] Implement proper logging strategy (e.g., debug library)
  - [ ] Add error tracking integration
  - [ ] Ensure no console output in production build
  - [ ] Document logging standards

#### MEDIUM-002: Testing Coverage Gaps
- **Status**: ❌ Not Started
- **Files**: Currently 6 test files out of 202 TypeScript files (3% coverage)
- **Issue**: Insufficient test coverage for business logic
- **Solution**: Add comprehensive test suite
- **Effort**: 20 hours
- **Dependencies**: HIGH-001 (hook consolidation)
- **Target Coverage**: 80% for business logic
- **Acceptance Criteria**:
  - [ ] Add tests for all hook functions
  - [ ] Add integration tests for database operations
  - [ ] Add component tests for major UI components
  - [ ] Add error scenario testing
  - [ ] Set up coverage reporting
  - [ ] Achieve 80%+ coverage on business logic

#### MEDIUM-003: Component Organization Issues
- **Status**: ❌ Not Started
- **Files**: `src/components/` directory
- **Issue**: Inconsistent directory structures and patterns
- **Solution**: Standardize component organization
- **Effort**: 6 hours
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] Standardize directory structure
  - [ ] Add consistent barrel exports (index.ts files)
  - [ ] Remove or complete migration-related components
  - [ ] Organize by feature domains
  - [ ] Update import paths

#### MEDIUM-004: State Management Inconsistencies
- **Status**: ❌ Not Started
- **Files**: Various hook files
- **Issue**: Mixed use of local state vs React Query, inconsistent caching
- **Solution**: Standardize state management patterns
- **Effort**: 8 hours
- **Dependencies**: HIGH-001 (hook consolidation)
- **Acceptance Criteria**:
  - [ ] Document state management patterns
  - [ ] Standardize React Query usage
  - [ ] Remove commented/dead code
  - [ ] Implement consistent caching strategies
  - [ ] Test state management edge cases

### 🟢 LOW Priority Issues (3 total)

#### LOW-001: Code Organization and Naming
- **Status**: ❌ Not Started
- **Files**: Various
- **Issue**: Package name mismatch, inconsistent naming
- **Solution**: Update metadata and standardize naming
- **Effort**: 2 hours
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] Update package.json name to match app
  - [ ] Review and standardize naming conventions
  - [ ] Clean up technical debt comments
  - [ ] Update documentation

#### LOW-002: Dependency Management
- **Status**: ❌ Not Started
- **Files**: `package.json`, lockfiles
- **Issue**: Mixed package managers, potential conflicts
- **Solution**: Standardize on bun, clean up dependencies
- **Effort**: 3 hours
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] Remove package-lock.json (keep bun.lockb)
  - [ ] Audit dependencies for unused packages
  - [ ] Update package manager scripts
  - [ ] Verify all deps work with bun
  - [ ] Document package management approach

#### LOW-003: Development Experience Issues
- **Status**: ❌ Not Started
- **Files**: Configuration files
- **Issue**: Disabled linting rules, incomplete configs
- **Solution**: Improve development tooling
- **Effort**: 4 hours
- **Dependencies**: HIGH-002 (type safety)
- **Acceptance Criteria**:
  - [ ] Re-enable ESLint unused vars checking
  - [ ] Add pre-commit hooks
  - [ ] Complete TypeScript strict mode
  - [ ] Add development documentation
  - [ ] Test onboarding experience

---

## Phase Implementation Plans

### Phase 1: Security & Stability (Week 1)
**Goal**: Fix critical security and stability issues

#### Week 1 Tasks:
1. **Monday-Tuesday**: CRITICAL-001 (Secure Environment Variables)
2. **Wednesday-Thursday**: CRITICAL-002 (Error Handling)
3. **Friday**: MEDIUM-001 (Remove Console Logging)

#### Success Criteria:
- No hardcoded credentials in source code
- Proper error boundaries in place
- Clean console output in production
- All existing functionality works

#### Testing Checklist:
- [ ] Local development works with env vars
- [ ] Production deployment successful
- [ ] Error scenarios handled gracefully
- [ ] No console output in prod build

### Phase 2: Architecture Consistency (Week 2-3)
**Goal**: Standardize patterns and improve maintainability

#### Week 2-3 Tasks:
1. **Days 1-3**: HIGH-001 (Hook Architecture Consolidation)
2. **Days 4-6**: HIGH-002 (Type Safety Improvements)
3. **Days 7-8**: HIGH-003 (Database Performance)
4. **Days 9-10**: HIGH-004 (Schema Consistency)

#### Success Criteria:
- Consistent hook architecture
- TypeScript strict mode enabled
- Improved query performance
- Unified type definitions

### Phase 3: Testing & Quality (Week 4-5)
**Goal**: Build confidence and maintainability

#### Week 4-5 Tasks:
1. **Days 1-5**: MEDIUM-002 (Testing Coverage)
2. **Days 6-7**: MEDIUM-003 (Component Organization)
3. **Days 8-10**: MEDIUM-004 (State Management)

#### Success Criteria:
- 80%+ test coverage on business logic
- Organized component structure
- Consistent state management

### Phase 4: Developer Experience (Week 6)
**Goal**: Improve development workflow

#### Week 6 Tasks:
1. **Days 1-2**: LOW-002 (Dependency Management)
2. **Days 3-4**: LOW-003 (Development Experience)
3. **Day 5**: LOW-001 (Naming & Organization)

#### Success Criteria:
- Single package manager (bun)
- Pre-commit hooks working
- Clean project metadata
- Documented development process

---

## Risk Assessment

### High Risk Items:
- **Environment Variables**: Risk of breaking production deployment
- **Hook Consolidation**: Risk of breaking existing functionality
- **Type Safety**: Risk of introducing new bugs during migration

### Mitigation Strategies:
- Test environment variable changes in staging first
- Implement hook changes incrementally with thorough testing
- Enable TypeScript strict mode one flag at a time
- Maintain comprehensive manual testing checklist

---

## Success Metrics

### Security:
- [ ] No hardcoded credentials in source code
- [ ] All database operations have error handling
- [ ] Error tracking implemented

### Reliability:
- [ ] <5% error rate in production
- [ ] Proper loading states everywhere
- [ ] Graceful fallbacks for all failures

### Maintainability:
- [ ] 80%+ test coverage on business logic
- [ ] Consistent code organization
- [ ] TypeScript strict mode enabled

### Performance:
- [ ] <2s initial page load
- [ ] Optimized database queries
- [ ] Bundle size monitoring

### Developer Experience:
- [ ] <5min setup time for new developers
- [ ] Clear development documentation
- [ ] Automated quality checks

---

## Work Log

### 2025-06-28
- ✅ Completed comprehensive technical debt analysis
- ✅ Created detailed improvement plan
- ✅ Set up tracking document with acceptance criteria
- 📝 **Next**: Begin Phase 1 - Security & Stability

### Future Entries
*Add daily progress updates here as work progresses*

---

## Notes

- This document should be updated as work progresses
- Each phase should be completed before moving to the next
- All changes should be thoroughly tested
- Consider creating separate issues/PRs for major changes
- Regular progress reviews recommended at end of each phase

## Dependencies External to This Plan

- **Deployment Pipeline**: May need updates for environment variables
- **Monitoring**: Consider adding application monitoring during Phase 1
- **CI/CD**: May need updates for new testing requirements in Phase 3