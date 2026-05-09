# R6 — Frontend Contract

## Goal

Align the frontend with the Rust commands without redesigning the selected matrix UI yet.

## Diff

### MODIFY `src/features/reminders/tauri-api.ts`

Add wrappers:

```ts
export async function createReminderNative(input: CreateReminderInput): Promise<ReminderSnapshot>
export async function updateReminderNative(input: UpdateReminderInput): Promise<ReminderSnapshot>
export async function deleteReminderNative(reminderId: string): Promise<ReminderSnapshot>
export async function setFocusReminderNative(reminderId: string): Promise<ReminderSnapshot>
```

Rules:

- browser fallback still uses existing pure store helpers
- Tauri runtime uses focused Rust commands
- every async function keeps `try/catch`
- `saveReminderSnapshot` remains available only for import/migration or explicit full-save fallback, not normal Tauri runtime mutations.
- runtime detection should use `isTauri()` from `@tauri-apps/api/core`; keep a browser-safe fallback only for tests if needed.
- remove `sendNotification` usage but keep notification permission helpers.

### MODIFY `src/features/reminders/RemindersApp.tsx`

Current callsites mutate local state and autosave the whole snapshot:

- load/save effect owns `saveReminderSnapshot(snapshot)`
- add uses pure `addReminder`
- toggle uses pure `toggleReminder`
- focus uses pure `setReminderStatus`

After R6:

- Tauri runtime add calls `createReminderNative`.
- Tauri runtime status/focus calls `updateReminderNative` or `setFocusReminderNative`.
- Tauri runtime delete calls `deleteReminderNative`.
- React state is replaced by the returned Rust snapshot.
- whole-snapshot autosave is disabled for Tauri runtime and kept for browser fallback only.

Allowed implementation shape:

```text
src/features/reminders/useReminderController.ts
  -> wraps runtime detection
  -> calls Rust commands in Tauri
  -> calls pure store helpers in browser fallback
  -> exposes handlers to RemindersApp
```

### MODIFY `src/features/reminders/reminder.schema.ts`

Split persisted snapshot from ephemeral view state:

```ts
export type ReminderDataSnapshot = {
  schemaVersion: number;
  lists: ReminderList[];
  reminders: Reminder[];
};

export type SmartListId = 'today' | 'focus' | 'waiting' | 'later' | 'done';

export type ReminderViewState = {
  selectedViewId: SmartListId | { type: 'list'; listId: string };
  selectedReminderId: string | null;
};
```

The old `ReminderSnapshot` may remain as a browser fallback aggregate type only if needed:

```ts
export type ReminderSnapshot = ReminderDataSnapshot & ReminderViewState;
```

Tauri runtime should treat Rust-returned snapshots as `ReminderDataSnapshot` and keep `ReminderViewState` in React.

Add TS contract input types matching Rust:

```ts
export type CreateReminderInput = {
  title: string;
  listId: string;
  initialStatus?: Exclude<ReminderStatus, 'focused' | 'done'>;
};

export type UpdateReminderInput = {
  id: string;
  title?: string;
  notes?: string;
  status?: ReminderStatus;
  priority?: ReminderPriority;
  dueAt?: string | null;
  remindAt?: string | null;
  linkedInstance?: string | null;
};
```

Tri-state nullable fields:

- omitted: no change
- `null`: clear field
- string: set field

Smart-list quick-add behavior:

| Active view | Create behavior |
| --- | --- |
| `today` | listId `today`, status `open` |
| `focus` | listId `today`, status `open`, then optional explicit focus action |
| `waiting` | listId `waiting`, status `waiting` |
| `later` | listId `later`, status `open` |
| `done` | quick add disabled |
| user list | that list id, status `open` |

Rust does not validate smart-list ids because smart views are frontend concepts.

### MODIFY `src/features/reminders/reminder.store.test.ts`

Add a contract-shape test for frontend fallback mutation behavior.

Add mocked Tauri tests for:

- native wrappers send camelCase payload keys.
- Tauri mutations replace state with returned snapshots.
- normal Tauri mutations do not call `saveReminderSnapshot`.
- browser fallback still uses pure local store helpers.

## Verification

```bash
npm run typecheck
npm test
npm run build
npm run tauri:check
```

Expected: all pass.

## Package Cleanup

Remove unused JS store plugin dependency unless a settings-store phase is added:

```json
- "@tauri-apps/plugin-store": "^2.4.3"
```

## Non-Goal

Do not rebuild the UI into the selected 2x2 matrix in this Rust MVP. UI implementation should be a separate PABCD plan after the Rust contract is stable.
