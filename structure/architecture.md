# Architecture

## Runtime Shape

Jaw Reminders is a single Tauri desktop app with two runtimes:

- Frontend: React + strict TypeScript compiled by Vite.
- Native shell: Rust inside `src-tauri/`.

## Boundaries

```text
React UI
  -> useReminderController
  -> tauri-api invoke boundary
  -> Rust command/service/storage modules
  -> app data reminders.json
```

## Current Feature Modules

- `src/features/reminders/`: reminder domain, fixtures, browser fallback store, Tauri API bridge, controller hook, and matrix/rail UI.
- `src/shared/`: tiny generic helpers.
- `src-tauri/src/reminders/`: native domain, seed, storage, service, commands, notification boundary, and error mapping.

## Data Ownership

Rust owns durable reminder data:

- `schemaVersion`
- lists
- reminders
- atomic JSON persistence under the Tauri app data directory
- load-time validation and corrupt/invalid file quarantine
- blank first-run seed data with no project-specific demo reminders

React owns ephemeral UI selection:

- selected smart view or user list
- selected reminder id
- pending/error state for serialized native mutations
- browser-only localStorage fallback state

This keeps the CLI-JAW integration boundary narrow: future integrations should call Tauri commands rather than parsing `reminders.json` directly.

## Design Model

The selected UX keeps the 2x2 priority matrix information architecture but renders it with a native reminder app visual model:

- left sidebar for smart views and lists
- center 2x2 matrix separated by hairline borders, not cards
- per-quadrant inline create rows modeled after Apple Reminders' empty row affordance
- drag a reminder row into another quadrant to move it to that bucket's default list/status/priority
- row-level detail button that opens a square reminder editor popover
- right priority rail for focus, sorted next actions, row check/detail actions, and cutoff guidance
- quiet center-axis labels for importance and urgency
- left-sidebar Settings entry for Korean/English language selection
- smart-view/list selection filters the matrix itself, so the sidebar and the 2x2 surface mean the same thing
- detail/settings overlays behave as dialogs with Escape close and focus return
- title/notes editing saves on blur while due/remind use explicit datetime controls

ADHD-specific behavior starts with:

- one focused item
- next-three action framing
- waiting/later lists to lower visible noise
- keyboard-first movement through rows
- create-in-place behavior so each box is the source of truth for its own new items
- right-rail checkbox parity so next actions can be completed without leaving the rail

## Native Command Contract

Tauri commands are registered by defining module path:

- `reminders::commands::load_reminders`
- `reminders::commands::save_reminders`
- `reminders::commands::create_reminder`
- `reminders::commands::update_reminder`
- `reminders::commands::delete_reminder`
- `reminders::commands::set_focus_reminder`
- `reminders::notifications::show_reminder_notification`

Mutation commands return the updated Rust data snapshot. The frontend replaces state with that returned snapshot and does not run whole-snapshot autosave in native mode.

Native mutations are serialized at the controller boundary. Invoke failures surface as a visible save banner rather than becoming silent dropped promises.

## Release Hardening

- `src-tauri/tauri.conf.json` uses a CSP instead of `null`.
- Bundle targets are macOS-focused for the MVP.
- Notification permissions are narrowed to the frontend permission-check/request surface; actual notification display stays behind the Rust command boundary.
- `rust-toolchain.toml` pins stable Rust with clippy/rustfmt components.
- `package.json` declares a Node engine floor for reproducible installs.
