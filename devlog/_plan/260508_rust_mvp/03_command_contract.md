# R3 — Command Contract

## Goal

Stop forcing the frontend to save entire snapshots for basic mutations. Add focused Rust commands that mutate safely through the storage repository.

## Diff

### NEW `src-tauri/src/reminders/commands.rs`

Owns all Tauri command functions.

Commands:

```rust
#[tauri::command]
pub fn load_reminders(app: AppHandle) -> Result<ReminderSnapshot, String>

#[tauri::command]
pub fn save_reminders(app: AppHandle, snapshot: ReminderSnapshot) -> Result<(), String>

#[tauri::command]
pub fn create_reminder(app: AppHandle, input: CreateReminderInput) -> Result<ReminderSnapshot, String>

#[tauri::command]
pub fn update_reminder(app: AppHandle, input: UpdateReminderInput) -> Result<ReminderSnapshot, String>

#[tauri::command]
pub fn delete_reminder(app: AppHandle, reminder_id: String) -> Result<ReminderSnapshot, String>

#[tauri::command]
pub fn set_focus_reminder(app: AppHandle, reminder_id: String) -> Result<ReminderSnapshot, String>
```

### NEW `src-tauri/src/reminders/service.rs`

Owns pure mutation logic:

```rust
pub fn create_reminder(snapshot: ReminderSnapshot, input: CreateReminderInput) -> Result<ReminderSnapshot, ReminderError>
pub fn update_reminder(snapshot: ReminderSnapshot, input: UpdateReminderInput) -> Result<ReminderSnapshot, ReminderError>
pub fn delete_reminder(snapshot: ReminderSnapshot, reminder_id: &str) -> Result<ReminderSnapshot, ReminderError>
pub fn set_focus(snapshot: ReminderSnapshot, reminder_id: &str) -> Result<ReminderSnapshot, ReminderError>
```

Rules:

- `set_focus` must demote prior focused reminders to `open`.
- `update_reminder` must reject `status = Focused`; only `set_focus_reminder` can focus an item.
- deleting selected reminder must select another reminder in the same list or `None`.
- empty title is invalid at Rust boundary.
- `CreateReminderInput.listId` must exist in `snapshot.lists`.
- `CreateReminderInput.initialStatus` may only be `Open`, `Waiting`, or omitted.
- `save_reminders` must validate the full snapshot before writing.
- every reminder `listId` must refer to an existing list.
- unknown reminder ids return `ReminderError::NotFound`.
- timestamps update on mutation.
- ids are generated as `r-{Uuid::new_v4()}`.
- timestamps use `chrono::Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true)`.

### MODIFY `src-tauri/Cargo.toml`

Add dependencies:

```toml
serde_with = "3"
uuid = { version = "1", features = ["v4", "serde"] }
```

### REPLACE `src-tauri/src/reminders.rs` with `src-tauri/src/reminders/mod.rs`

New module entry:

```rust
pub mod commands;
mod domain;
mod error;
mod seed;
mod service;
mod storage;

pub use commands::{
    create_reminder,
    delete_reminder,
    load_reminders,
    save_reminders,
    set_focus_reminder,
    update_reminder,
};
```

Test module discovery:

- Prefer colocated `#[cfg(test)] mod tests` inside `service.rs`.
- Do not create detached `service_test.rs` unless `mod.rs` also declares `#[cfg(test)] mod service_test;`.

### MODIFY `src-tauri/src/lib.rs`

Before:

```rust
.invoke_handler(tauri::generate_handler![
    reminders::load_reminders,
    reminders::save_reminders
])
```

After:

```rust
.invoke_handler(tauri::generate_handler![
    reminders::commands::load_reminders,
    reminders::commands::save_reminders,
    reminders::commands::create_reminder,
    reminders::commands::update_reminder,
    reminders::commands::delete_reminder,
    reminders::commands::set_focus_reminder
])
```

Use defining-module paths for Tauri commands. Do not rely on function-only re-exports for `generate_handler!`.

## Verification

```bash
npm run tauri:check
cd src-tauri && cargo test reminders::service
```

Expected: pass.

## Tests Added in This Phase

- create reminder trims title and rejects empty title.
- create reminder rejects unknown list id.
- create reminder generates `r-` prefixed UUID ids and UTC millisecond timestamps.
- set focus demotes existing focused reminder.
- update reminder rejects `status = Focused`.
- every command path preserves the single-focused-reminder invariant.
- delete selected reminder selects another valid reminder or `None`.
- update reminder rejects unknown id.
- update reminder distinguishes omitted nullable fields, explicit null, and string values.
- save command validates snapshot before storage write.
