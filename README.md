# Jaw Reminders

Fast local reminders for CLI-JAW work.

This is a Tauri v2 + React + strict TypeScript prototype inspired by the native macOS Reminders experience and tuned for CLI-JAW work: sidebar smart views, an Apple-style 2x2 priority matrix, inline quick capture, and a right-side inspector. The product goal is not to clone Apple Reminders, but to bring the same low-friction reminder UX into a CLI-JAW-oriented workflow.

## Stack

- Tauri v2
- Rust command boundary
- React 19
- Vite 8
- TypeScript strict mode
- Phosphor icons

## Commands

```bash
npm install
npm run dev
npm run typecheck
npm test
npm run build
npm run tauri:dev
npm run tauri:check
npm run tauri:test
```

## Product Shape

- `Today`: current daily work list.
- `Focus`: one active reminder and cutoff control.
- `Waiting`: reminders blocked by outside state.
- `Later`: low-noise backlog.
- Priority matrix: four edge-to-edge quadrants separated by hairlines, not cards.
- Inline capture: permanent bottom row, no modal or floating action button.
- Inspector: selected reminder details in a fixed right pane.

## Native Boundary

Rust owns:

- app data directory persistence via `reminders.json`
- atomic temp-write/rename storage
- load-time corrupt/invalid snapshot quarantine
- reminder id/time generation
- mutation validation and the one-focus invariant
- notification send boundary

React owns:

- ephemeral interaction state
- triage views
- browser fallback for fast Vite-only development

In Tauri mode, reminder mutations go through narrow native commands and replace React state with the returned Rust snapshot. Browser fallback still persists to localStorage for fast UI iteration.
