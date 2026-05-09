# R0 — Scope

## Easy Explanation

Rust should become the reliable native core for reminders. It should not own the visual UX. It should own data validity, safe local persistence, Tauri command boundaries, and notification handoff.

## MVP Boundary

### In Scope

- Typed Rust domain structs matching TypeScript fields.
- Stable JSON storage in the Tauri app data directory.
- Atomic writes using temp file + rename.
- Corrupt JSON recovery path.
- Tauri commands:
  - load snapshot
  - save snapshot
  - create reminder
  - update reminder status
  - delete reminder
  - set focus reminder
  - show notification
- Unit tests for pure Rust domain/storage behavior.
- Snapshot invariant validation before saving arbitrary snapshots.
- Snapshot invariant validation after loading parseable JSON.
- First-run seed consistency between Rust and TypeScript.

### Out of Scope

- Calendar sync.
- Apple Reminders integration.
- Background recurring scheduler.
- Menu bar app.
- SQLite.
- Full-text search.
- Multi-device sync.
- CLI-JAW database integration.

## Current Risk

The current Rust scaffold is good for bootstrapping but too coarse for MVP:

- `reminders.rs` mixes domain, storage, commands, and fixtures.
- `status` and `priority` are unvalidated strings.
- save overwrites directly instead of atomic write.
- no corrupt-file recovery story.
- no command-level update operations; frontend must save whole snapshots.
- existing frontend callsites autosave whole snapshots from `RemindersApp.tsx`.

## Diff Decision

Use modular Rust files before adding more behavior. Do not add SQLite yet. JSON is sufficient for MVP and faster to validate.

Rust owns validity. Frontend may keep browser fallback behavior, but Tauri runtime mutations should go through Rust commands after R6.

## Selection Decision

Selection is frontend-ephemeral for the Rust MVP.

Rust persists:

- reminder lists
- reminders
- schema version

Rust does not persist:

- selected smart view
- selected list view
- selected reminder id

Reason: `Today`, `Focus`, `Waiting`, `Later`, and `Done` are product views, not all persisted list ids. Treating every view as `selectedListId` creates invalid snapshot ambiguity and makes smart views look like ordinary lists.
