# MenuMaker

A React-based meal and dish management application for tracking your favorite recipes, cooking history, and meal planning.

## Features

- 🍽️ Track your favorite dishes with cuisines, sources, and cooking history
- 📊 View cooking statistics and meal frequency analytics  
- 📅 Generate intelligent weekly menu suggestions
- 🔍 Search and filter dishes by name, cuisine, or source
- 📱 Progressive Web App (PWA) with offline support
- ♿ Accessibility-focused design (WCAG 2.1 compliant)

## Development

### Setup

The only requirement is having Bun installed - [install Bun](https://bun.sh/docs/installation)

```sh
# Clone the repository
git clone https://github.com/kbourgoin/menumaker.git
cd menumaker

# Install dependencies
bun install

# Start the development server
bun run dev
```

### Development Process

**⚠️ Important: All changes must go through pull requests. Direct pushes to main are not allowed.**

**🧪 Critical: ALL TESTS MUST PASS LOCALLY before creating a PR. Run `bun run test:run` and ensure 100% pass rate.**

1. **Create a feature branch** from main:
   ```sh
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and test locally (**REQUIRED before creating PR**):
   ```sh
   bun run dev        # Start development server
   bun run test:run   # Run tests - MUST pass all tests
   bun run lint       # Check code quality - MUST pass
   bun run build      # Test production build - MUST succeed
   ```

3. **Commit and push your branch**:
   ```sh
   git add .
   git commit -m "feat: describe your changes"
   git push -u origin feature/your-feature-name
   ```

4. **Create a pull request** on GitHub:
   - Provide a clear title and description
   - Link any related issues
   - Request review from maintainers

5. **Wait for automated checks** to pass:
   - ✅ **All tests MUST pass locally before creating PR** (`bun run test:run`)
   - ✅ All GitHub Actions must pass (linting, type checking, tests, build)
   - ✅ All status checks must be green before merging
   - 🚫 **PRs cannot be merged with failing checks**
   - 🚫 **PRs with failing tests will be rejected** - Always test locally first

6. **After review, approval, and passing checks**, the PR will be merged to main

### Branch Naming Convention
- `feature/` - New features or enhancements
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `test/` - Test additions or updates

## Technologies

This project is built with:

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui components with Tailwind CSS  
- **Backend**: Supabase (PostgreSQL + Auth)
- **State Management**: TanStack React Query
- **Testing**: Vitest + React Testing Library
- **Package Manager**: Bun

## Deployment

This project is deployed at [menu.bourgoin.casa](https://menu.bourgoin.casa) using Cloudflare Pages.

To deploy your own instance:
1. Connect your repository to your preferred hosting platform (Vercel, Netlify, Cloudflare Pages)
2. Set build command: `bun run build`
3. Set publish directory: `dist`
4. Deploy!

## Architecture

Built with modern web technologies:
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui components with Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **State Management**: TanStack React Query
- **Testing**: Vitest + React Testing Library
