# Repository Guidelines

## Project Structure & Module Organization
- Source: `src/app` (App Router). Entry points: `layout.tsx`, `page.tsx`.
- Styles: `src/app/globals.css` with Tailwind utilities; theme tokens via CSS vars.
- Assets: `public/` for static files (served from `/`).
- Config: `next.config.ts`, `tailwind.config.ts`, `tsconfig.json` (path alias `@/*`).

## Build, Test, and Development Commands
- `npm run dev`: Start local dev server with Turbopack at `http://localhost:3000`.
- `npm run build`: Create a production build (type-checks included).
- `npm start`: Serve the production build.
- `npm run lint`: Lint with Next/ESLint rules.

## Coding Style & Naming Conventions
- Language: TypeScript (strict). Components in `*.tsx`.
- ESLint: Extends `next/core-web-vitals` and `next/typescript`; fix issues before PR.
- Indentation: 2 spaces. Line length: keep readable (~100–120 cols).
- React: PascalCase components (`ProfileCard.tsx`), camelCase functions/vars, hooks start with `use*`.
- Routes: folder names lower-kebab-case in `src/app` (e.g., `blog-posts/[slug]`).
- Imports: prefer `@/*` alias (e.g., `@/components/Button`).
- Styling: Prefer Tailwind utilities; extract reusable UI to `src/components` when it grows.

## Testing Guidelines
- No test runner is configured yet. If adding tests, use Jest or Vitest + React Testing Library.
- File names: co-locate as `Component.test.tsx` or under `src/**/__tests__/`.
- Aim for meaningful coverage on critical rendering and routing logic; mock network/browser APIs.

## Commit & Pull Request Guidelines
- Commits: Use clear, imperative messages. Conventional Commits are encouraged (e.g., `feat:`, `fix:`, `chore:`).
- PRs: Include a concise description, linked issues, and screenshots/video for UI changes.
- Checks: Ensure `npm run lint` and `npm run build` pass locally before requesting review.
- Scope: Keep PRs small and focused; note breaking changes in the description.

## Security & Configuration Tips
- Environment: Put secrets in `.env.local`; never commit them. Client-exposed vars must start with `NEXT_PUBLIC_`.
- Runtime: Target Node 18+ (compatible with Next 15). Keep React/Next versions in sync.
- Data: Avoid storing sensitive data in the App Router server components sent to the client.

## Roadmap / TODO
- Projects routing: `src/app/projects/[slug]/page.tsx` with per-page `metadata` and JSON-LD.
- Social previews: `app/opengraph-image.tsx` and `twitter-image.tsx` with branded visuals.
- CI: PR template, run `npm run build` and `npm run lint` on PRs.
- Performance: Add `next/image` thumbnails, refine contrast, target >95 Lighthouse.
- Content: Replace placeholder email, seed 2–3 projects, short bio.
