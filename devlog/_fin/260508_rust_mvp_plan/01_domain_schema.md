# R1 — Domain Schema

## Goal

Move reminder data types and validation into a dedicated Rust domain module.

## Diff

### MODIFY `src-tauri/src/lib.rs`

Before:

```rust
mod reminders;
```

After:

```rust
mod reminders;
```

No visible change yet. `reminders/mod.rs` becomes the module entry point in R3.

### NEW `src-tauri/src/reminders/domain.rs`

Owns:

- `ReminderStatus`
- `ReminderPriority`
- `ReminderList`
- `ReminderSubtask`
- `Reminder`
- `ReminderSnapshot`
- `CreateReminderInput`
- `UpdateReminderInput`
- `validate_snapshot`
- `validate_create_input`
- `validate_update_input`

Required design:

```rust
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum ReminderPriority {
    Low,
    Normal,
    High,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Reminder {
    pub id: String,
    pub title: String,
    pub notes: String,
    pub list_id: String,
    pub status: ReminderStatus,
    pub priority: ReminderPriority,
    pub due_at: Option<String>,
    pub remind_at: Option<String>,
    pub linked_instance: Option<String>,
    pub subtasks: Vec<ReminderSubtask>,
    pub created_at: String,
    pub updated_at: String,
}
```

Final snapshot shape:

```rust
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ReminderList {
    pub id: String,
    pub name: String,
    pub accent: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ReminderSubtask {
    pub id: String,
    pub title: String,
    pub done: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ReminderSnapshot {
    pub schema_version: u32,
    pub lists: Vec<ReminderList>,
    pub reminders: Vec<Reminder>,
}
```

Selection fields are intentionally absent from `ReminderSnapshot`. R6 owns frontend UI selection state.

Create input:

```rust
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateReminderInput {
    pub title: String,
    pub list_id: String,
    pub initial_status: Option<ReminderStatus>,
}
```

`initial_status` accepts `Open` or `Waiting` only. `Focused` must go through `set_focus_reminder`.

Update input:

```rust
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateReminderInput {
    pub id: String,
    pub title: Option<String>,
    pub notes: Option<String>,
    pub status: Option<ReminderStatus>,
    pub priority: Option<ReminderPriority>,
    #[serde(default, with = "serde_with::rust::double_option")]
    pub due_at: Option<Option<String>>,
    #[serde(default, with = "serde_with::rust::double_option")]
    pub remind_at: Option<Option<String>>,
    #[serde(default, with = "serde_with::rust::double_option")]
    pub linked_instance: Option<Option<String>>,
}
```

Use `serde_with` so missing, explicit `null`, and string values are distinguishable.

Use enums instead of raw strings:

```rust
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum ReminderStatus {
    Open,
    Focused,
    Waiting,
    Done,
}
```

### NEW `src-tauri/src/reminders/seed.rs`

Move seed snapshot out of command file.

Required export:

```rust
pub fn seed_snapshot() -> ReminderSnapshot
```

Seed contract:

- Rust seed is the source of truth for first-run Tauri data.
- TypeScript fixture must either match Rust seed or be explicitly browser-only.
- For MVP, align Rust seed with `src/features/reminders/reminder.fixtures.ts` so browser and Tauri first-run experiences do not diverge.

### MODIFY `src-tauri/src/reminders.rs`

Temporary phase state:

- Remove inline structs.
- Import domain structs from `domain.rs`.
- Import seed from `seed.rs`.
- Keep `load_reminders`, `save_reminders`, and `reminders_path` until R2/R3 split.

## Verification

```bash
npm run tauri:check
```

Expected: pass.

## Tests Added in This Phase

Use colocated `#[cfg(test)] mod tests` inside `domain.rs` for:

- `validate_create_input` rejects empty titles.
- `validate_snapshot` rejects reminders pointing at missing lists.
- `validate_snapshot` rejects duplicate list ids.
- `validate_snapshot` rejects duplicate reminder ids.
- `validate_snapshot` rejects more than one focused reminder.
