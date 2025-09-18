# Menumaker

A fully vibe-coded app to track menu planning for my household. Not intended as production software, but an experiment to see how far I can take this.

Running live at menu.bourgoin.casa.

---

# GitHub Actions Configuration

This directory contains GitHub Actions workflows for automated CI/CD.

## Workflows

### `ci.yml` - Continuous Integration

Runs on every push to `main` and on all pull requests.

**Jobs:**

1. **Lint & Type Check**
   - ESLint code quality checks
   - TypeScript type checking
   - Build verification

2. **Tests**
   - Unit and integration tests using Vitest
   - Test coverage generation
   - Coverage upload to Codecov (optional)

**Features:**

- Uses Bun package manager for fast installs
- Dependency caching for improved performance
- Concurrent job execution for faster CI
- Mock environment variables for builds
- Coverage reporting integration

## Environment Variables

The following environment variables are used in CI:

- `CODECOV_TOKEN` (optional) - For uploading test coverage reports
- `VITE_SUPABASE_URL` - Mocked in CI for build purposes
- `VITE_SUPABASE_ANON_KEY` - Mocked in CI for build purposes

## Adding Codecov Integration

To enable test coverage reporting:

1. Sign up at [codecov.io](https://codecov.io)
2. Add your repository
3. Add the `CODECOV_TOKEN` secret to your GitHub repository settings
4. Coverage reports will be automatically uploaded after test runs

## Workflow Triggers

- **Push to main**: Runs all jobs
- **Pull requests**: Runs all jobs for verification
- **Concurrency control**: Cancels in-progress runs when new commits are pushed

## Local Testing

To run the same checks locally:

```bash
# Install dependencies
bun install

# Run linting
bun run lint

# Run type checking
bunx tsc --noEmit

# Run tests
bun run test:run

# Run tests with coverage
bun run test:coverage

# Build the project
bun run build
```
