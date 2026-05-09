# Diff Plan

## Easy Explanation

Build a small, fast desktop reminder app that feels close to native macOS Reminders, but tuned for CLI-JAW work. It should have quick capture, Today, Focus, Waiting, Later, Done, one active focus item, and a next-three action frame so the list does not become overwhelming.

2026-05-08 selection: Jun prefers the 2x2 priority matrix view with a right-side Today/Focus rail. Treat this as the primary UI direction for the first real implementation pass.

## Diff-Level Plan

### NEW `package.json`

- React + Vite + strict TypeScript frontend.
- Tauri v2 CLI scripts.
- Vitest for pure store tests.

### NEW `src/features/reminders/*`

- `reminder.schema.ts`: strict domain types.
- `reminder.store.ts`: pure snapshot transforms.
- `tauri-api.ts`: browser/Tauri persistence and notification boundary.
- `RemindersApp.tsx`: feature root.
- `components/*`: sidebar, priority matrix, today rail, compact task rows.

### NEW `src-tauri/*`

- Tauri v2 app config.
- Rust command boundary for loading/saving reminders.
- Store and notification plugins initialized.

### NEW `structure/*`

- Current architecture and conventions.

### NEW `devlog/_plan/260508_tauri_reminders_app/*`

- Durable implementation and verification plan.

## Non-Goals

- No calendar sync.
- No Apple Reminders API integration.
- No menu bar agent yet.
- No background scheduler yet.
- No CLI-JAW database integration yet.
