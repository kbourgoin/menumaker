# Contributing to MenuMaker

Guide for human developers setting up and contributing to this project.

## Quick Start (5 minutes)

```bash
# 1. Clone and install
git clone <repository-url>
cd menumaker
bun install

# 2. Set up environment
cp .env.local.example .env.local

# 3. Start local database (requires Docker)
bun run dev:db:start

# 4. Start development server
bun run dev

# 5. Verify setup
bun run quality
```

Open http://localhost:8080 - login with `test@menumaker.dev` / `password123`

## Prerequisites

- [Bun](https://bun.sh/) - Package manager and runtime
- [Docker](https://docker.com/) - For local Supabase
- [VS Code](https://code.visualstudio.com/) - Recommended editor

## Package Manager

**This project uses Bun exclusively.** Do not use npm, yarn, or pnpm.

```bash
bun add <package>      # Add production dependency
bun add -d <package>   # Add dev dependency
bun install            # Install all dependencies
```

## Development Commands

### Daily Development

| Command           | Description                   |
| ----------------- | ----------------------------- |
| `bun run dev`     | Start dev server on port 8080 |
| `bun run test`    | Run tests in watch mode       |
| `bun run lint`    | Check for linting errors      |
| `bun run quality` | Run all quality checks        |

### Before Committing

```bash
bun run test:run    # Tests must pass
bun run lint        # Linting must pass
bun run build       # Build must succeed
```

### Database

| Command                 | Description                |
| ----------------------- | -------------------------- |
| `bun run dev:db:start`  | Start local Supabase       |
| `bun run dev:db:stop`   | Stop local Supabase        |
| `bun run dev:db:reset`  | Reset with fresh seed data |
| `bun run dev:db:studio` | Open database admin UI     |

See [docs/database.md](docs/database.md) for detailed database documentation.

## IDE Setup (VS Code)

### Required Extensions

These are auto-suggested when opening the project:

- **ESLint** - Real-time linting
- **Prettier** - Code formatting
- **Tailwind CSS IntelliSense** - Class autocomplete
- **TypeScript and JavaScript Language Features** - Type checking
- **EditorConfig** - Cross-editor consistency

### Automatic Features

Once extensions are installed:

- Code formats automatically on save
- ESLint errors auto-fix on save
- Missing imports added automatically
- TypeScript/ESLint errors highlighted in real-time

## Git Workflow

### Creating a Feature

```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Make changes and test
bun run test:run
bun run lint
bun run build

# 3. Commit with conventional prefix
git commit -m "feat: add new feature"

# 4. Push and create PR
git push -u origin feature/your-feature-name
```

### Commit Message Prefixes

| Prefix      | Use for           |
| ----------- | ----------------- |
| `feat:`     | New features      |
| `fix:`      | Bug fixes         |
| `docs:`     | Documentation     |
| `refactor:` | Code refactoring  |
| `test:`     | Test changes      |
| `chore:`    | Maintenance tasks |

### Pull Request Requirements

- All tests must pass locally before creating PR
- All GitHub Actions must pass
- Test coverage must stay above 80% for business logic
- Code review required before merge

## Environment Configuration

### Local Development (Default)

`.env.local` is pre-configured for local Supabase:

```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<local-key>
```

### Production Testing

To test against production (use carefully):

```
VITE_SUPABASE_URL=https://tudbtihblxsgxveanbtv.supabase.co
VITE_SUPABASE_ANON_KEY=<production-key>
```

**Always restart `bun run dev` after changing environment variables.**

## Code Quality

### Automated Checks

Pre-commit hooks automatically run:

1. ESLint with auto-fix
2. Prettier formatting
3. Tests for changed files
4. TypeScript compilation

### Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Catches common errors and enforces style
- **Prettier**: Consistent formatting
- **Unused variables**: Prefix with `_` if intentionally unused

## Architecture Overview

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **State**: TanStack React Query
- **Backend**: Supabase (PostgreSQL + Auth)
- **PWA**: Offline support via service worker

### Key Directories

```
src/
├── components/ui/    # Reusable UI components
├── components/       # Feature components
├── hooks/            # Data fetching hooks
├── pages/            # Route components
├── utils/            # Business logic
└── integrations/     # Supabase client
```

## Troubleshooting

**"Cannot read properties of null (reading 'useState')"**

- Clear Vite cache: `rm -rf node_modules/.vite`
- Restart dev server

**"Connection refused" to Supabase**

- Start local database: `bun run dev:db:start`
- Or switch `.env.local` to production URLs

**Multiple lock files appearing**

- Delete `package-lock.json` and `yarn.lock`
- Only `bun.lockb` should exist

**Pre-commit hook failing**

- Run `bun run quality` to see specific errors
- Fix issues and try committing again

## Getting Help

- Check existing issues on GitHub
- Review [docs/database.md](docs/database.md) for database questions
- Ask in project discussions
