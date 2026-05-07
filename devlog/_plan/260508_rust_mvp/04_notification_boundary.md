# R4 — Notification Boundary

## Goal

Add a Rust-side notification command that the frontend can call for immediate reminder notifications. Do not build a background scheduler yet.

## Diff

### NEW `src-tauri/src/reminders/notifications.rs`

Owns:

- notification payload shape
- `show_reminder_notification`

Required command:

```rust
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NotifyReminderInput {
    pub title: String,
    pub body: String,
}

#[tauri::command]
pub fn show_reminder_notification(
    app: AppHandle,
    input: NotifyReminderInput,
) -> Result<(), String>
```

Implementation uses:

```rust
use tauri_plugin_notification::NotificationExt;
```

Required validation:

- empty title -> error
- body can be empty but should default to `"미리알림"` if blank

### MODIFY `src-tauri/src/reminders/mod.rs`

Export `show_reminder_notification`.

### MODIFY `src-tauri/src/lib.rs`

Register the notification command.

Use defining-module path:

```rust
reminders::notifications::show_reminder_notification
```

### MODIFY `src/features/reminders/tauri-api.ts`

Current frontend uses JS plugin directly:

```ts
sendNotification({ title, body });
```

After Rust MVP:

```ts
await invoke('show_reminder_notification', {
  input: { title, body },
});
```

Permission request can stay frontend-owned because user permission UX is interactive.

Keep frontend-owned:

- `isPermissionGranted`
- `requestPermission`

Replace only:

- `sendNotification(...)`

with:

- `invoke('show_reminder_notification', { input })`

## Verification

```bash
npm run tauri:check
npm run typecheck
cd src-tauri && cargo test reminders::notifications
```

Expected: both pass.

## Tests Added in This Phase

Use pure validation tests only. Do not try to show OS notifications in unit tests.

- empty title is rejected.
- blank body is normalized to `"미리알림"`.
