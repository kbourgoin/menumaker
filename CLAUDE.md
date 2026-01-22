# CLAUDE.md

Instructions for Claude Code when working on this repository.

## Quick Reference

| Task               | Command                 |
| ------------------ | ----------------------- |
| Dev server         | `bun run dev`           |
| Run tests          | `bun run test:run`      |
| Lint               | `bun run lint`          |
| Build              | `bun run build`         |
| Type check         | `bun run type-check`    |
| All quality checks | `bun run quality`       |
| Start local DB     | `bun run dev:db:start`  |
| Reset local DB     | `bun run dev:db:reset`  |
| DB admin UI        | `bun run dev:db:studio` |

## Key Constraints

- **Package manager**: Bun only. Never use npm/yarn/pnpm.
- **Branches**: Always create feature branches. Never commit directly to main.
- **Before PRs**: Must pass `bun run test:run`, `bun run lint`, `bun run build`
- **Test coverage**: Maintain 80%+ for business logic utilities
- **Imports**: Use `@/` prefix for all internal imports (maps to `src/`)

## Environment

The app connects to Supabase. Check `.env.local` for current config:

- **Local dev**: `http://127.0.0.1:54321` (requires `bun run dev:db:start`)
- **Production**: `https://tudbtihblxsgxveanbtv.supabase.co`

Local test accounts: `test@menumaker.dev` / `password123`

## Architecture

**Stack**: React 18, TypeScript, Vite, Tailwind, shadcn/ui, TanStack Query, Supabase

**Database tables**:

- `dishes` - Core dish info (name, cuisine, source)
- `sources` - Recipe sources (cookbooks, websites)
- `meal_history` - When dishes were cooked
- `tags` / `dish_tags` - Categorization
- `dish_summary` - Materialized view with aggregated data

## Code Organization

```
src/
├── components/
│   ├── ui/           # shadcn/ui primitives
│   ├── dashboard/    # Dashboard-specific components
│   ├── dish/         # Dish-related components
│   └── shared/       # Reusable components
├── hooks/
│   ├── dish/         # Dish queries and mutations
│   ├── meal-history/ # Meal history hooks
│   └── stats/        # Statistics hooks
├── pages/            # Route components
├── utils/            # Business logic utilities
└── integrations/
    └── supabase/     # DB client and types
```

## Patterns

- **Hooks**: Split into queries (`useDishQueries`) and mutations (`useDishMutations`)
- **Components**: Controlled composition via shadcn/ui
- **Auth**: `AuthProvider` context; all routes except `/auth` require login
- **State**: TanStack Query for server state, React state for UI

## Database Changes

For migrations and schema changes, see `docs/database.md`.

Quick commands:

```bash
bun run db:create-migration table "description"  # Create migration
bun run db:migrate                               # Apply migrations
bun run db:update-types                          # Regenerate TS types
```

## Git Workflow

```bash
git checkout -b feature/description   # Create branch
# Make changes
bun run test:run && bun run lint && bun run build  # Verify
git commit -m "feat: description"
git push -u origin feature/description
# Create PR via GitHub
```

Commit prefixes: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
