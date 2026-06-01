# Jaw Reminders

Fast local reminders for CLI-JAW work.

[![CI](https://github.com/lidge-jun/adhd_reminder/actions/workflows/ci.yml/badge.svg)](https://github.com/lidge-jun/adhd_reminder/actions/workflows/ci.yml)
[![Pages](https://github.com/lidge-jun/adhd_reminder/actions/workflows/pages.yml/badge.svg)](https://github.com/lidge-jun/adhd_reminder/actions/workflows/pages.yml)
![Node >=20](https://img.shields.io/badge/node-%3E%3D20-111827)
![Tauri v2](https://img.shields.io/badge/tauri-v2-111827)
![License not declared](https://img.shields.io/badge/license-not_declared-6b7280)

Jaw Reminders is a Tauri v2 + React + strict TypeScript prototype inspired by native macOS reminder workflows and tuned for CLI-JAW work. It is designed around one current focus, a small next-action rail, quiet waiting/later states, and a 2x2 priority matrix that helps triage without turning every reminder into a noisy card.

## Why it exists

CLI-JAW sessions produce many small follow-ups: wait for CI, resume a browser check, return to a blocked agent, or remember the next concrete action after a long research run. General task apps are often too broad for that loop. Jaw Reminders keeps the reminder surface local, narrow, and low-friction.

## Public surface

| Area | Current status |
| --- | --- |
| App type | Tauri desktop app with a browser fallback for Vite iteration |
| Frontend | React 19, Vite 8, strict TypeScript |
| Native boundary | Rust commands for persistence, validation, and notification display |
| Data model | Local reminder snapshot with smart views, lists, reminders, subtasks, due/remind times |
| License | No root license file is declared in this repository |
| GitHub Pages | Prepared from `/docs` after an authorized push |
| CI | Prepared in `.github/workflows/ci.yml`; remote runs require an authorized push |

## Features

- Left sidebar for smart views and user lists.
- Center 2x2 priority matrix with hairline separators instead of stacked cards.
- Inline capture row for each quadrant.
- Right priority rail for the current focus, next three actions, and cutoff guidance.
- Detail inspector and settings overlays with Escape-close behavior.
- Browser fallback using `localStorage` for fast UI iteration.
- Tauri mode using Rust-owned JSON persistence and serialized mutation commands.

## Quickstart

```bash
npm ci
npm run dev
```

The browser development mode is useful for UI work. Native reminders, app data storage, and notification display are exercised through Tauri commands.

## Native run

```bash
npm run tauri:dev
```

## Verification

```bash
npm run typecheck
npm test
npm run build
npm run tauri:check
npm run tauri:test
```

`npm run build` runs `tsc --noEmit` before the Vite production build. `npm run tauri:check` runs `cargo check` inside `src-tauri/`. `npm run tauri:test` runs the Rust test suite when native tests are present.

## Architecture

```text
React UI
  -> useReminderController
  -> browser fallback store or Tauri invoke boundary
  -> Rust reminder service
  -> app data reminders.json
```

Rust owns durable reminder data in native mode:

- atomic JSON persistence under the Tauri app data directory
- snapshot validation and corrupt-file quarantine
- reminder id/time generation
- mutation validation and one-focus invariant
- notification display boundary

React owns interaction state:

- selected smart view or user list
- selected reminder id
- pending/error state for native mutations
- drag, edit, and overlay state

## Privacy

Reminder data is local by design. Browser fallback stores data in localStorage. Native mode stores a JSON snapshot in the Tauri app data directory. Do not publish exported reminder snapshots if they contain private project names, local instance ports, or personal workflow notes.

## Repository layout

```text
config/              app-level TypeScript config
src/                 React frontend and reminder feature modules
src-tauri/           Rust/Tauri native shell and command boundary
structure/           architecture and conventions source of truth
docs/                prepared GitHub Pages public surface
tests/e2e/           reserved E2E test area
```

## Development policy

- Keep TypeScript strict-compatible.
- Keep new source files under 500 lines.
- Keep native responsibilities in Rust and interaction-heavy UI in React.
- Update `structure/` when architecture facts change.
- Keep public README and Pages claims tied to local commands or GitHub state.
