# 260508 Rust MVP Completion

## Outcome

Implemented the Rust-owned local reminders MVP and the selected CLI-JAW todo UX direction.

## Built

- Replaced the single native `reminders.rs` file with focused Rust modules for domain, storage, service, commands, notifications, seed, and errors.
- Added atomic app-data JSON persistence with stale tmp cleanup and corrupt/invalid snapshot quarantine.
- Added native create/update/delete/focus commands and direct defining-module command registration.
- Added tri-state nullable patch fields for `dueAt`, `remindAt`, and `linkedInstance`.
- Removed `tauri-plugin-store` from package, Cargo, plugin initialization, and capabilities.
- Reworked frontend state into `useReminderController`.
- Kept browser fallback localStorage, but disabled whole-snapshot autosave for normal Tauri mutations.
- Rebuilt the UI first as a card-like matrix, then corrected it after Deep Think review and Jun feedback to keep the 2x2 matrix while using native split-view hairlines: sidebar + Apple-style matrix + inline capture + inspector.
- Added Apple Reminders-style inline create rows inside each matrix quadrant.
- Added drag-to-matrix movement so dropping a row into another quadrant updates its list/status/priority through the same native update command path.
- Removed the ambiguous bottom global quick-capture row so new reminders are created only from the visible target matrix box.
- Moved item detail editing into a larger square popover opened from each reminder row, and restored the right side as the planned priority sketch rail.
- Simplified the right rail by removing duplicate matrix counts and keeping only focus/next actions/cutoff; rail rows support completion and detail buttons but no drag.
- Added Korean/English UI i18n with a left-sidebar Settings button.
- Added quiet center-axis direction labels for importance and urgency.
- Applied GPT Pro hardening review items for the daily-use MVP surface:
  - first-run data now starts blank instead of showing project-specific demo reminders;
  - sidebar smart-view selection now filters the 2x2 matrix instead of leaving the matrix global;
  - right rail next actions now use `nextActionLimit` plus due/remind/priority ordering;
  - native load no longer silently falls back to TypeScript seed data on invoke failure;
  - native mutations are serialized through one controller boundary and surface save failures in the UI;
  - title/notes editing buffers locally and saves on blur instead of invoking native writes on every keystroke;
  - due/remind fields are editable datetime inputs;
  - settings and detail popovers have dialog semantics, Escape close, focus entry, and focus return;
  - Tauri config now has a CSP, macOS-only bundle targets, narrowed notification capabilities, Node engines, and `rust-toolchain.toml`.

## Verified

- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run tauri:check`
- `npm run tauri:test`
- `cargo clippy -- -D warnings`
- Browser render at `http://127.0.0.1:5173/`
- Browser console check: no captured output
- Hardening screenshots:
  - `/Users/jun/.cli-jaw/screenshots/screenshot_1778199753347.png`
  - `/Users/jun/.cli-jaw/screenshots/screenshot_1778199758513.png`
  - `/Users/jun/.cli-jaw/screenshots/screenshot_1778199763096.png`
