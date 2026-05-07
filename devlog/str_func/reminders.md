# Reminders Feature

## File Tree

- `src/features/reminders/reminder.schema.ts`: shared TypeScript data and input contracts.
- `src/features/reminders/reminder.fixtures.ts`: browser fallback seed aligned with Rust seed.
- `src/features/reminders/reminder.matrix.ts`: 2x2 matrix bucket mapping for create and drag-to-move behavior.
- `src/features/reminders/reminder.store.ts`: pure browser fallback mutations and smart-view selectors.
- `src/features/reminders/tauri-api.ts`: Tauri invoke and notification permission boundary.
- `src/features/reminders/useReminderController.ts`: runtime controller that switches native commands vs browser fallback.
- `src/features/reminders/RemindersApp.tsx`: sidebar, Apple-style 2x2 priority matrix, per-box inline create rows, row detail popover trigger, and priority rail.
- `src/features/reminders/components/PriorityRail.tsx`: right-side priority sketch rail for focus, next actions, row check/detail controls, and cutoff.
- `src/features/reminders/components/ReminderEditorPopover.tsx`: larger square detail editor opened from a reminder row button.
- `src/features/reminders/components/SettingsPanel.tsx`: language settings panel opened from the left sidebar.
- `src/features/reminders/reminder.i18n.ts`: Korean/English active UI translations.
- `src-tauri/src/reminders/domain.rs`: Rust structs, enums, validation, and patch input semantics.
- `src-tauri/src/reminders/storage.rs`: app-data JSON repository with temp-write/rename and quarantine.
- `src-tauri/src/reminders/service.rs`: pure reminder mutations and one-focus invariant.
- `src-tauri/src/reminders/commands.rs`: Tauri command boundary.
- `src-tauri/src/reminders/notifications.rs`: Rust notification send boundary.
- `src-tauri/src/reminders/seed.rs`: first-run seed data.

## Responsibilities

Rust owns durable reminder data, validation, ids, timestamps, native mutations, JSON persistence, and notification sending.

React owns ephemeral selection state, smart-view filtering, per-quadrant inline creation, drag-to-bucket movement, row-level detail popovers, right-rail prioritization, locale selection, and browser fallback persistence for Vite-only development.

## Key Contracts

- Native commands return the updated `ReminderDataSnapshot`; React replaces state with that returned snapshot.
- Matrix bucket creation and drag movement map to narrow native create/update commands, not whole-snapshot saves.
- The bottom global create row is removed to prevent wrong-target creation; visible creation happens inside the intended matrix box.
- The right rail is not the item inspector and does not repeat matrix counts. It contains actionable focus/next rows with check and detail buttons.
- Item editing opens from the row detail button in `ReminderEditorPopover`.
- Locale is frontend UI state persisted in localStorage under `jaw-reminders.locale`.
- Tauri mode does not run whole-snapshot autosave for ordinary mutations.
- Selection is not persisted in Rust. `selectedViewId` and `selectedReminderId` are frontend-only.
- `update_reminder` rejects direct `focused` status. `set_focus_reminder` is the only focus transition.
- Nullable patch fields use missing/null/value semantics.

## Verification

- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run tauri:check`
- `npm run tauri:test`
- `cargo clippy -- -D warnings`
