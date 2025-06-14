# Changelog

All notable changes to MenuMaker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

**Version 0.1.0** represents a major foundation release that transforms MenuMaker from a basic application into a production-ready, performant, and professionally tested PWA with comprehensive developer tooling and workflows.