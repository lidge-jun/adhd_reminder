# R2 — Storage Repository

## Goal

Make local JSON storage safe enough for daily use.

## Diff

### NEW `src-tauri/src/reminders/error.rs`

Owns Rust-side error taxonomy.

Required shape:

```rust
#[derive(Debug, Error)]
pub enum ReminderError {
    #[error("failed to resolve app data directory")]
    AppDataDir,
    #[error("storage io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("storage json error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("reminder not found: {0}")]
    NotFound(String),
    #[error("invalid reminder input: {0}")]
    InvalidInput(String),
}
```

Command boundary converts errors to strings only at the outer edge.

### NEW `src-tauri/src/reminders/storage.rs`

Owns:

- app data path resolution
- read JSON
- write JSON
- temp-file atomic write
- corrupt JSON quarantine

Required functions:

```rust
pub fn load_snapshot(app: &AppHandle) -> Result<ReminderSnapshot, ReminderError>
pub fn save_snapshot(app: &AppHandle, snapshot: &ReminderSnapshot) -> Result<(), ReminderError>
```

Testable pure path API:

```rust
pub struct ReminderStorage {
    base_dir: PathBuf,
}

impl ReminderStorage {
    pub fn new(base_dir: PathBuf) -> Self
    pub fn load_snapshot(&self) -> Result<ReminderSnapshot, ReminderError>
    pub fn save_snapshot(&self, snapshot: &ReminderSnapshot) -> Result<(), ReminderError>
}
```

Command-facing `AppHandle` helpers only resolve the app data directory and delegate to `ReminderStorage`.

Atomic write contract:

```text
reminders.json.tmp
  -> fs::write
  -> fs::rename(tmp, reminders.json)
```

Corrupt-file contract:

```text
if reminders.json exists but JSON parse fails:
  move reminders.json -> reminders.corrupt.<timestamp>.json
  return seed_snapshot()
```

Invalid-file contract:

```text
if reminders.json parses but validate_snapshot fails:
  move reminders.json -> reminders.invalid.<timestamp>.json
  return seed_snapshot()
```

Load must run validation after deserialization and before returning the snapshot.

Stale tmp contract:

```text
if reminders.json.tmp exists during load:
  remove it before reading reminders.json
```

Atomic write should write to `reminders.json.tmp`, flush the temp file where practical, then rename within the same directory.

### MODIFY `src-tauri/Cargo.toml`

Remove unused store plugin surface unless future settings storage is explicitly added:

```toml
- tauri-plugin-store = "2.4.3"
```

Keep direct JSON storage for reminders in this MVP.

### MODIFY `src-tauri/src/lib.rs`

Remove store plugin init:

```rust
- .plugin(tauri_plugin_store::Builder::new().build())
```

### MODIFY `src-tauri/capabilities/default.json`

Remove store permission:

```json
- "store:default"
```

### MODIFY `src-tauri/src/reminders.rs`

Before:

```rust
let raw = fs::read_to_string(path).map_err(|error| error.to_string())?;
serde_json::from_str(&raw).map_err(|error| error.to_string())
```

After:

```rust
storage::load_snapshot(&app).map_err(|error| error.to_string())
```

## Verification

```bash
npm run tauri:check
cd src-tauri && cargo test reminders::storage
```

Expected: pass.

## Risk

Cross-filesystem rename should not be an issue because tmp and final live in the same app data directory.

## Tests Added in This Phase

Use colocated `#[cfg(test)] mod tests` inside `storage.rs` rather than detached `storage_test.rs`.

Targets:

- missing file returns `seed_snapshot()`.
- save then load round-trips.
- corrupt JSON is moved to `reminders.corrupt.<timestamp>.json`.
- corrupt JSON returns `seed_snapshot()`.
- parseable invariant-invalid JSON is moved to `reminders.invalid.<timestamp>.json`.
- stale `reminders.json.tmp` is ignored or removed on load.
