# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Feature 05: Prisma Schema And Data Layer — Complete

## Current Goal

- Build the next planned feature unit.

## Completed

- `01-design-system` — shadcn/ui configured, all UI primitives added (Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea), lucide-react installed, `lib/utils.ts` cn() helper created, globals.css dark theme set.
- `02-editor-chrome` — `components/editor/editor-navbar.tsx` and `components/editor/project-sidebar.tsx` created; navbar has fixed height, left/center/right sections, PanelLeftOpen/PanelLeftClose toggle; sidebar floats above canvas (no push), slides in from left, has Projects header + close button, My Projects / Shared tabs with empty states, full-width New Project button.
- `03-auth` — `@clerk/ui` installed; `proxy.ts` created at root with protected-first strategy; `ClerkProvider` wraps root layout with `dark` theme + CSS variable overrides (no hardcoded colors); sign-in/sign-up pages use two-panel layout (left: logo + tagline + feature list hidden on mobile, right: Clerk form); `/` redirects to `/editor` if authenticated, `/sign-in` otherwise; `UserButton` added to editor navbar right section; `app/editor/page.tsx` scaffolded; `npm run build` passes.

- `04-project-dialogs` — `lib/mock-projects.ts` (Project type + MOCK_PROJECTS); `hooks/use-project-dialogs.ts` (dialog/form/loading state, in-memory CRUD, slug generation); `components/editor/project-dialogs.tsx` (Create with live slug preview, Rename with auto-focus + Enter submit, Delete with destructive confirm); `project-sidebar.tsx` updated (project list, hover-reveal rename/delete for owned only, shared tab without actions, mobile backdrop scrim, New Project wired); `app/editor/page.tsx` updated (centered home screen with heading + description + New Project button, full dialog wiring).

- `05-prisma` — `prisma/models/project.prisma` (Project + ProjectCollaborator models, status enum DRAFT/ARCHIVED, cascading delete, composite unique/indexes); `prisma/schema.prisma` datasource set to PostgreSQL; `lib/prisma.ts` cached singleton (Accelerate path via `accelerateUrl` + `withAccelerate()`, pg-adapter path via `PrismaPg`); migration `20260530215742_init_projects` applied; client generated to `app/generated/prisma`; `@prisma/client`, `@prisma/adapter-pg`, `pg`, `@prisma/extension-accelerate` installed.

## In Progress

- None.

## Next Up

- Add the next planned feature unit here.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- **shadcn/ui `base-nova` style** — chosen by shadcn auto-detect for Tailwind v4; components live in `components/ui/` and must not be edited manually.
- **Tailwind v4 CSS-first config** — no `tailwind.config.ts`; all tokens and theme overrides are defined in `app/globals.css` via `@theme inline`.
- **shadcn CSS variables mapped to dark theme** — shadcn's standard tokens (`--color-background`, `--color-primary`, etc.) are remapped in `globals.css` to the project's dark palette; no light mode defined.
- **`@base-ui/react` as primitive layer** — shadcn `base-nova` uses `@base-ui/react` (not Radix UI) as the headless primitive layer.
- **Dialog controlled via `open` / `onOpenChange`** — all dialogs are fully controlled; open state lives in `useProjectDialogs` and is passed down; `onOpenChange={(open) => !open && closeDialog()}` is the standard close pattern.
- **`useProjectDialogs` hook owns all dialog + project state** — hoisted to the page level so the editor home button and sidebar share a single state instance; no prop drilling beyond one level.
- **In-memory mock data** — `lib/mock-projects.ts` seeds the project list; mutations (create, rename, delete) update a `useState` array inside the hook; no API calls or persistence until a future feature spec introduces them.
- **Slug generation is pure/client-side** — `toSlug()` in the hook lowercases, strips non-alphanumeric chars, and collapses spaces to hyphens; slug is derived live from the name input with no debounce needed.
- **Sidebar actions are owned-only** — `onRename` / `onDelete` props are only threaded through to `ProjectItem` for projects where `owned === true`; shared projects render without action buttons.
- **Prisma 7 driver-adapter pattern** — `lib/prisma.ts` branches on `DATABASE_URL` prefix: `prisma+postgres://` → `accelerateUrl` + `withAccelerate()`; otherwise → `PrismaPg({ connectionString })` adapter; both are mutually exclusive per Prisma 7's new constructor API.
- **Multi-file Prisma schema** — `prisma.config.ts` sets `schema: "prisma/"` so all `*.prisma` files in the folder are merged; datasource and generator live in `schema.prisma`, models in `prisma/models/`.
- **No `url`/`directUrl` in schema** — Prisma 7 removed these from the schema file; the connection URL lives exclusively in `prisma.config.ts` → `datasource.url`.

## Session Notes

- Add context needed to resume work in the next session.
