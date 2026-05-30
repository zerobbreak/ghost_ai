# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Feature 02: Editor Chrome — Complete

## Current Goal

- Build the base chrome components: top navbar and floating project sidebar.

## Completed

- `01-design-system` — shadcn/ui configured, all UI primitives added (Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea), lucide-react installed, `lib/utils.ts` cn() helper created, globals.css dark theme set.
- `02-editor-chrome` — `components/editor/editor-navbar.tsx` and `components/editor/project-sidebar.tsx` created; navbar has fixed height, left/center/right sections, PanelLeftOpen/PanelLeftClose toggle; sidebar floats above canvas (no push), slides in from left, has Projects header + close button, My Projects / Shared tabs with empty states, full-width New Project button.

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

## Session Notes

- Add context needed to resume work in the next session.
