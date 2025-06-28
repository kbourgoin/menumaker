# Changelog

All notable changes to MenuMaker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.3] - 2025-06-28

### Security
- **Environment Variables**: Fixed critical security vulnerability by replacing hardcoded Supabase credentials with environment variables (#45)
  - Moved production credentials from source code to `.env.local` configuration
  - Added `.env.example` template for easy developer setup
  - Updated deployment documentation for environment variable configuration
  - Enhanced security without breaking existing functionality

### Technical Debt Analysis
- **Comprehensive Audit**: Conducted thorough technical debt analysis identifying 23 issues across 4 severity levels
- **GitHub Issue Tracking**: Created systematic tracking with parent issue #33 and child issues #34-#44 organized by implementation phases
- **Priority Framework**: Established Critical/High/Medium/Low priority system for systematic debt reduction

### User Interface
- **Dashboard Redesign**: Complete mobile-first redesign of the main dashboard (#31, #32)
  - **Mobile-First Layout**: Redesigned dashboard with responsive card-based layout optimized for mobile devices
  - **Today's Menu Enhancement**: Improved Today's Menu section with compact DishCard variants and better visual hierarchy
  - **Analytics Loading Fix**: Fixed critical issue where analytics data wouldn't load properly on hard refresh
  - **Card-Based Design**: Replaced table-heavy layout with modern card components for better mobile experience
  - **Responsive Grid**: Implemented flexible grid system that adapts seamlessly from mobile to desktop

### Developer Experience
- **Project Documentation**: Enhanced `CLAUDE.md` with environment setup instructions and Git workflow guidelines
- **Issue Templates**: Created detailed GitHub issues with implementation guidance for future technical debt resolution

## [0.2.2] - 2025-06-25

### Performance
- **Database Query Optimization**: Significantly improved application performance through comprehensive database optimizations
  - **RLS Performance**: Optimized Row Level Security policies to prevent `auth.uid()` re-evaluation per row across all tables
  - **Missing Indexes**: Added critical foreign key indexes for `dishes.source_id`, `dishes.user_id`, `meal_history.dishid`, and `meal_history.user_id`
  - **Composite Indexes**: Added optimized indexes for common query patterns including user-dish lookups and date-based meal history queries
  - **Policy Cleanup**: Removed duplicate permissive policies on sources table that caused multiple policy evaluations

### User Experience
- **Mobile Keyboard Handling**: Fixed omnisearch keyboard not closing properly on mobile devices for better touch interaction
- **Date Picker Modal**: Fixed date picker modal not closing when date is clicked, improving form workflow
- **Tag Interface Cleanup**: Removed unused "(type # for tags)" functionality that was confusing users
- **Automatic Data Refresh**: Restored automatic refresh of dish summary data after database security migration

### Security
- **Security Definer View**: Resolved security definer view warnings while maintaining secure access to materialized views
  - Updated `dish_summary_secure` view to provide secure, performant access to aggregated dish data
  - Documented accepted security patterns in `SECURITY.md` for future reference
  - Maintained user data isolation while optimizing query performance

### Documentation
- **Security Documentation**: Added comprehensive `SECURITY.md` documenting security patterns and accepted exceptions
- **Database Index Documentation**: Added detailed comments explaining purpose of database indexes to prevent unnecessary removal

### Fixed
- **Direct Materialized View Access**: Updated all application code to use secure view wrappers instead of direct materialized view access
- **React Query Cache**: Fixed cache invalidation keys to match actual query patterns
- **Supabase Performance Warnings**: Resolved all performance warnings from Supabase database linter

## [0.2.1] - 2025-06-21

### Security
- **Row Level Security (RLS)**: Enabled comprehensive database-level security policies
  - Added RLS policies to `dishes`, `sources`, `meal_history`, and `profiles` tables
  - Enforces user-level data isolation at the PostgreSQL level
  - Provides defense-in-depth security beyond application-level filtering
  - Prevents unauthorized access even if application bugs occur
- **Database Function Security**: Fixed search_path vulnerabilities in 5 database functions
  - `handle_new_user`: Added `SET search_path = 'public'` to prevent injection attacks
  - `increment_times_cooked`: Added search_path security + user access validation
  - `increment_by`: Added search_path security + user access validation  
  - `refresh_dish_summary_secure`: Added search_path security for materialized view refresh
  - `clear_user_data`: Added search_path security + user access control
- **Materialized View Protection**: Secured `dish_summary` materialized view API access
  - Revoked public API access to prevent unauthorized data exposure
  - Applications now use RLS-protected base tables instead

### Fixed
- **Security Vulnerabilities**: Resolved 6 of 8 Supabase dashboard security warnings
  - Eliminated search path injection attack vectors in database functions
  - Closed potential data access loopholes in materialized views
  - Strengthened overall database security posture

### Developer Experience
- **Migration Safety**: All security migrations include existence checks to prevent conflicts
- **Backward Compatibility**: Existing application queries continue to work unchanged
- **Database Integrity**: User access validation added to increment and clear functions

---

## [0.2.0] - 2025-06-19

### Added
- **Hybrid Cuisine-Tag System**: Unified architecture treating cuisines as a special category of tags
  - Added category and color fields to tags table for cuisine categorization
  - Created smart migration system to convert existing cuisines to cuisine tags
  - Implemented CuisineTagSelector component for single-select cuisine behavior
  - Preserved visual distinction and UX while unifying backend architecture
- **Unified Omni Search**: Revolutionary search experience combining text search and tag filtering
  - Inline suggestions for both cuisines and tags as you type (e.g., "fre" → "freezable")
  - Smart sorting with exact matches prioritized
  - Visual distinction between cuisines (colored dots) and tags (hash icons)
  - Enhanced filtering logic supporting both cuisines and general tags
  - Real-time suggestions with up to 6 relevant matches
- **Enhanced Table View**: Improved dish table with unified cuisine and tag display
  - Moved tags to cuisine column for better space utilization
  - Consistent rounded styling for both cuisines and tags
  - Updated column header to "Cuisine & Tags"
  - Proper color coding maintained for cuisine tags
- **Migration Utilities**: Comprehensive data migration system
  - Smart duplicate detection during cuisine-to-tag conversion
  - User-friendly migration interface with progress tracking
  - Preservation of color mappings during migration
  - Rollback-safe migration process
- **CSV Import Removal**: Cleaned up legacy import functionality
  - Removed outdated CSV import components and utilities
  - Simplified import workflows for better maintainability
  - Eliminated technical debt from unused features

### Changed
- **Tag System Architecture**: Complete overhaul to support categorized tags
  - Extended Tag interface with category ('cuisine' | 'general') and color fields
  - Updated all tag-related hooks to support category filtering
  - Enhanced TagSelector with maxSelection and category parameters
  - Modified analytics to work with new cuisine tag system
- **Search Interface**: Replaced separate search and tag filter with unified omni search
  - Streamlined UI with single search input supporting multiple functions
  - Improved discovery through inline suggestions
  - Better mobile experience with consolidated controls
- **Display Logic**: Enhanced filtering to prevent cuisine tag duplication
  - Cuisine tags now excluded from general tag displays
  - Smart filtering in both card and table views
  - Proper separation of concerns between cuisine and tag categories

### Fixed
- **Tag Filter Issues**: Resolved cuisines appearing in general tag filters
  - Updated TagFilter component to use useGeneralTags instead of useAllTags
  - Proper category-based filtering throughout the application
- **Display Duplication**: Eliminated cuisines appearing in both cuisine and tag sections
  - Fixed duplication in dish card view
  - Fixed duplication in table view
  - Consistent filtering logic across all components
- **TypeScript Issues**: Improved type safety in tag-related components
  - Replaced 'any' types with proper Record<string, unknown> typing
  - Enhanced type definitions for new tag category system

### Removed
- **Legacy CSV Import**: Completely removed outdated CSV import functionality
  - Eliminated CSVImport component and related utilities
  - Removed CSV parsing dependencies and file handling code
  - Cleaned up unused import workflows from early development
  - Simplified codebase by removing unmaintained features

### Developer Experience
- **Database Schema**: Added new fields to support hybrid system
  - category field with CHECK constraint for data integrity
  - color field for cuisine tag styling
  - Proper indexing for performance
- **Component Architecture**: Clean separation between cuisine and general tag handling
  - CuisineTagSelector for cuisine-specific single-select behavior
  - Enhanced TagSelector with category support
  - Unified OmniSearch combining multiple search functions
- **Code Quality**: Maintained high standards throughout major refactoring
  - Comprehensive testing of new components
  - Proper error handling in migration utilities
  - Clean TypeScript interfaces and type safety

### Migration Notes
- **Backward Compatibility**: Existing data safely migrated to new system
- **Zero Downtime**: Migration designed to work alongside existing functionality
- **Data Integrity**: Comprehensive validation and duplicate detection
- **User Experience**: Migration happens transparently with user-friendly interface

---

## [0.1.0] - 2025-06-14

### Added
- **Comprehensive Testing Framework**: Complete Vitest + React Testing Library setup with 44 passing tests
  - Component tests for DishCard, SearchInput, ViewToggle, LoadingSpinner, ErrorBoundary
  - Utility tests for dishUtils (sorting, filtering, validation)
  - Test utilities with custom render function and mock data
  - Accessibility and user interaction testing
- **Error Boundaries**: Production-ready error handling with user-friendly fallbacks
- **Loading Components**: Reusable LoadingSpinner with multiple size variants
- **SEO Optimization**: Dynamic meta tags, Open Graph, and Twitter Card support
- **Accessibility Improvements**: WCAG 2.1 compliance with ARIA labels and skip navigation
- **PWA Install Button**: Responsive install button with development debugging
- **Professional PWA Icons**: High-quality branded icons with development generation tools
- **Development Workflow**: Mandatory PR-based workflow with branch naming conventions

### Changed
- **Performance Optimization**: 67% bundle size reduction (1.35MB → 443KB main chunk)
  - Implemented code splitting with lazy loading for all major routes
  - Added React.memo optimizations for expensive components
  - Optimized database queries to eliminate N+1 patterns
- **Package Manager Migration**: Switched from npm to Bun for faster builds and installs
- **Meta Tags Update**: Replaced Lovable branding with MenuMaker identity
- **TypeScript Improvements**: Fixed 31 'any' type errors with proper type definitions
- **React Best Practices**: Fixed Hook dependency warnings with useCallback optimizations
- **Codebase Quality**: Enabled stricter TypeScript settings and resolved all linting issues

### Fixed
- **Temporal Dead Zone Errors**: Fixed function declaration order in WeeklyMenu and MealDetail components
- **PWA Install Button Responsiveness**: Button now hides text on small screens like other nav buttons
- **Browser Cache Issues**: Added development cache busting to prevent stale builds
- **Social Media Previews**: Updated Open Graph images and meta tags for proper link previews

### Removed
- **Lovable Platform Dependencies**: Complete migration away from Lovable branding and tooling
  - Removed lovable-tagger dependency and all platform references
  - Updated all documentation to focus on MenuMaker
  - Cleaned up old build artifacts containing Lovable branding

### Developer Experience
- **Development Tools**: Created professional PWA icon generation tools (stored in `/tools/`)
- **Documentation**: Comprehensive setup and contribution guidelines in README
- **Git Workflow**: Established proper branching strategy and PR requirements
- **Code Quality**: All 44 tests passing with comprehensive coverage

### Technical Debt Cleanup
- **Code Quality**: Reduced ESLint problems from 46 to 8 acceptable warnings
- **Type Safety**: Eliminated all TypeScript 'any' usage with proper types
- **Performance**: Multiple optimization strategies implemented
- **Architecture**: Clean separation of concerns and modern React patterns

---

## How to Read This Changelog

- **Added** for new features
- **Changed** for changes in existing functionality  
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** in case of vulnerabilities

## Release Notes

**Version 0.2.0** introduces a revolutionary hybrid cuisine-tag system and unified omni search that fundamentally improves how users organize and discover dishes. This release represents a major UX leap forward while maintaining backward compatibility through smart data migration.

**Version 0.1.0** represents a major foundation release that transforms MenuMaker from a basic application into a production-ready, performant, and professionally tested PWA with comprehensive developer tooling and workflows.