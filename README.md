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

**Use your preferred IDE**

Clone this repo and start developing locally:

The only requirement is having Bun installed - [install Bun](https://bun.sh/docs/installation)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
bun install

# Step 4: Start the development server with auto-reloading and an instant preview.
bun run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

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
