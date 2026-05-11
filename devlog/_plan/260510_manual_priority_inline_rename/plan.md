---
created: 2026-05-10
status: planning
tags: [jaw-reminders, tauri, rust, reminders, priority, drag, inline-edit, pabcd]
github_issue: https://github.com/lidge-jun/adhd_reminder/issues/1
companion_issue: https://github.com/lidge-jun/cli-jaw/issues/193
---

# Jaw Reminders Manual Priority + Inline Rename — Jawdev Diff Plan

## Part 1 — Easy Explanation

Add user-controlled reminder ordering to the native Tauri app. The current app already has Matrix bucket dragging, a PriorityRail, a Rust-backed JSON store, and a detail popover. This plan adds `manualRank` so dragging can reorder reminders without changing `priority: high/normal/low`. It also adds macOS Reminders-style title editing: double-click a title, edit inline, Enter/blur saves, Escape cancels.

React owns the interaction-heavy drag/editing UI. Rust owns persistence, validation, and backward-compatible JSON loading. The field meaning matches Dashboard issue `lidge-jun/cli-jaw#193`, but no sync/connector is introduced.

## Current Signals

- Project root: `/Users/jun/Developer/new/700_projects/jaw-reminders`
- GitHub issue: `lidge-jun/adhd_reminder#1`
- Companion Dashboard issue: `lidge-jun/cli-jaw#193`
- React schema: `src/features/reminders/reminder.schema.ts`
- Rust schema: `src-tauri/src/reminders/domain.rs`
- Native service: `src-tauri/src/reminders/service.rs`
- Tauri commands: `src-tauri/src/reminders/commands.rs`
- Current drag: `src/features/reminders/useReminderDrag.ts`
- Matrix UI: `src/features/reminders/components/MatrixQuadrant.tsx`
- List UI: `src/features/reminders/components/SingleListView.tsx`
- Priority UI: `src/features/reminders/components/PriorityRail.tsx`

## Compact Tree

```text
src/features/reminders/
├── RemindersApp.tsx
├── reminder.schema.ts
├── reminder.matrix.ts
├── reminder.order.ts                  (new)
├── reminder.store.ts
├── useReminderController.ts
├── useReminderDrag.ts
├── tauri-api.ts
└── components/
    ├── InlineReminderTitle.tsx        (new)
    ├── MatrixQuadrant.tsx
    ├── SingleListView.tsx
    ├── PriorityRail.tsx
    └── ReminderEditorPopover.tsx

src-tauri/src/reminders/
├── domain.rs
├── service.rs
├── commands.rs
├── storage.rs
└── seed.rs

src/styles/
├── app.css
├── priority-rail.css
├── drag-overlay.css
└── inline-title.css                   (new if needed)
```

## Semantics

```text
priority   = semantic importance: low | normal | high
status     = workflow state: open | focused | waiting | done
listId     = list/bucket hint: today | focus | waiting | later | ...
manualRank = user-controlled order: number | null
```

Ranking:

```text
1. focused reminder first
2. manualRank ASC when present
3. earliest remindAt/dueAt
4. priority high -> normal -> low
5. createdAt ASC
```

Drag:

```text
same Matrix bucket: manualRank only
cross Matrix bucket: matrix bucket update + manualRank
PriorityRail drag: manualRank only
```

Inline edit:

```text
double-click title -> input
Enter -> save trimmed title
Escape -> cancel
blur -> save if changed and non-empty
```

## Part 2 — Diff-Level Plan

### P1 — Extend TypeScript Schema

`MODIFY src/features/reminders/reminder.schema.ts`

Add to `Reminder`:

```ts
manualRank: number | null;
```

Add to `CreateReminderInput`:

```ts
manualRank?: number | null;
```

Add to `UpdateReminderInput`:

```ts
manualRank?: number | null;
```

Update `src/features/reminders/reminder.fixtures.ts` so every fixture reminder has `manualRank`.

### P2 — Extend Rust Domain

`MODIFY src-tauri/src/reminders/domain.rs`

Change derives because `f64` cannot derive `Eq`. Remove `Eq` from every struct that directly or indirectly contains `manual_rank`: `Reminder`, `ReminderSnapshot`, `CreateReminderInput`, and `UpdateReminderInput`.

```rust
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
```

Add to `Reminder`:

```rust
#[serde(default)]
pub manual_rank: Option<f64>,
```

Add to `CreateReminderInput`:

```rust
pub manual_rank: Option<f64>,
```

Add to `UpdateReminderInput`:

```rust
#[serde(default, with = "double_option")]
pub manual_rank: Option<Option<f64>>,
```

Add validation:

```rust
fn validate_manual_rank(value: Option<f64>) -> ReminderResult<()> {
    if value.is_some_and(|rank| !rank.is_finite()) {
        return Err(ReminderError::InvalidInput("manualRank must be finite".into()));
    }
    Ok(())
}
```

Call it from:

- `validate_snapshot`
- `validate_create_input`
- `validate_update_input`

### P3 — Persist Through Native Service

`MODIFY src-tauri/src/reminders/service.rs`

In `create_reminder`:

```rust
manual_rank: input.manual_rank,
```

In `update_reminder`:

```rust
if let Some(manual_rank) = input.manual_rank {
    reminder.manual_rank = manual_rank;
}
```

Update seed/test reminder literals to include `manual_rank: None` or a finite rank.

### P4 — Shared Order Helper

`NEW src/features/reminders/reminder.order.ts`

Exports:

```ts
export const DEFAULT_RANK_STEP = 1000;
export function compareManualPriority(left: Reminder, right: Reminder): number;
export function nextRankBetween(previous: Reminder | null, next: Reminder | null): number;
```

Comparator:

```ts
focusedScore(left) - focusedScore(right) ||
manualRankScore(left) - manualRankScore(right) ||
nextTimeScore(left) - nextTimeScore(right) ||
priorityScore(left) - priorityScore(right) ||
Date.parse(left.createdAt) - Date.parse(right.createdAt)
```

Rank math:

```ts
if (!previous && !next) return 1000;
if (!previous && next.manualRank !== null) return next.manualRank - 1000;
if (previous?.manualRank !== null && !next) return previous.manualRank + 1000;
return (previousRank + nextRank) / 2;
```

### P5 — Use Manual Ranking

`MODIFY src/features/reminders/components/PriorityRail.tsx`

Before:

```ts
.sort(compareNextAction)
```

After:

```ts
import { compareManualPriority } from '../reminder.order';

.sort(compareManualPriority)
```

Remove local duplicate ranking helpers.

`MODIFY src/features/reminders/useReminderController.ts`

Sort `visibleReminders` and each `matrixGroups` array by `compareManualPriority` after current filtering/grouping.

### P6 — Ordered Drag Targets

`MODIFY src/features/reminders/useReminderDrag.ts`

Replace:

```ts
| { kind: 'bucket'; bucket: MatrixBucket }
```

With:

```ts
| { kind: 'bucket'; bucket: MatrixBucket; beforeId: string | null; afterId: string | null }
| { kind: 'priority'; beforeId: string | null; afterId: string | null }
| { kind: 'done' }
```

Also extend list drops:

```ts
| { kind: 'list'; listId: string; beforeId: string | null; afterId: string | null }
```

Read attributes:

```text
data-reminder-drop-before-id
data-reminder-drop-after-id
data-reminder-drop-priority
```

Do not start drag from:

```text
input, textarea, button, [data-reminder-inline-edit="true"]
```

Keep the existing `data-reminder-drop-action="done"` parsing path so Done sidebar/list drops do not regress.

`MODIFY src/features/reminders/components/PriorityRail.tsx`

Add `dragActive`, `onPointerReminderStart`, and ordered priority drop attributes to rail rows:

```text
data-reminder-drop-priority
data-reminder-drop-before-id
data-reminder-drop-after-id
```

`MODIFY src/features/reminders/RemindersApp.tsx`

Pass the drag controller into `<PriorityRail>` the same way Matrix rows receive `onPointerReminderStart`.

### P7 — Controller Reorder Action

`MODIFY src/features/reminders/useReminderController.ts`

Add:

```ts
reorderReminder: (reminderId: string, target: ReminderDropTarget) => Promise<void>;
```

Implementation shape:

```ts
const targetItems = targetItemsForDrop(snapshot, target);
const previous = targetItems.find((item) => item.id === target.beforeId) ?? null;
const next = targetItems.find((item) => item.id === target.afterId) ?? null;
const input: UpdateReminderInput = { manualRank: nextRankBetween(previous, next) };
if (target.kind === 'bucket') Object.assign(input, matrixBucketToUpdateInput(target.bucket));
if (target.kind === 'done') input.status = 'done';
if (target.kind === 'list') Object.assign(input, inputForListDrop(target.listId));
await updateReminderById(reminderId, input);
```

Move the existing `RemindersApp.tsx` list-drop semantics into controller scope so reorder does not regress sidebar/list drops:

```ts
function inputForListDrop(listId: string): UpdateReminderInput {
  if (listId === 'waiting') return { listId, status: 'waiting', priority: 'normal' };
  if (listId === 'later') return { listId, status: 'open', priority: 'low' };
  if (listId === 'focus') return { listId, status: 'open', priority: 'normal' };
  return { listId, status: 'open' };
}
```

`MODIFY src/features/reminders/RemindersApp.tsx`

Use `controller.reorderReminder` from `moveReminderToDropTarget` instead of only changing bucket/list fields.

### P8 — Inline Title Component

`NEW src/features/reminders/components/InlineReminderTitle.tsx`

Props:

```ts
type Props = {
  reminder: Reminder;
  disabled?: boolean;
  onRename: (reminderId: string, title: string) => Promise<void>;
  onOpenDetails: (reminderId: string) => void;
};
```

Behavior:

- Text by default.
- `onDoubleClick` enters edit mode.
- `Enter` commits.
- `Escape` cancels.
- `blur` commits if changed and non-empty.
- Editing stops propagation.

Use it in:

- `components/MatrixQuadrant.tsx`
- `components/SingleListView.tsx`
- `components/PriorityRail.tsx`

Pass:

```ts
onRename={(id, title) => controller.updateReminderById(id, { title })}
```

### P9 — Styles

Prefer:

`NEW src/styles/inline-title.css`

Import from:

`MODIFY src/styles/index.ts`

Styles:

```css
.inline-reminder-title { min-width: 0; }
.inline-reminder-title-input {
  width: 100%;
  min-width: 0;
  border: 1px solid var(--border-strong);
  border-radius: 6px;
  background: var(--surface-panel);
  color: var(--ink-primary);
  font: inherit;
}
```

Add PriorityRail drag affordance in `src/styles/priority-rail.css` only if it stays under 500L.

### P10 — Tests

Add/update:

- `src/features/reminders/reminder.order.test.ts`
  - `nextRankBetween` start/before/after/midpoint
  - focused before lower manual rank
  - manual rank before due fallback
- `src-tauri/src/reminders/domain.rs`
  - missing `manualRank` deserializes as `None`
  - non-finite manual rank rejected
- `src-tauri/src/reminders/service.rs`
  - create stores manual rank
  - update changes manual rank
  - update clears manual rank
- source contract if no DOM test harness exists:
  - `InlineReminderTitle` includes `onDoubleClick`
  - `Escape` cancellation exists
  - `useReminderDrag` handles `data-reminder-drop-priority`

## Verification Gates

```bash
npm run typecheck
npm test
npm run tauri:test
npm run build
npm run tauri:check
```

Manual verification:

```text
1. Launch Jaw Reminders.
2. Double-click Matrix row title, edit, Enter: persists.
3. Double-click title, edit, Escape: reverts.
4. Drag within same Matrix quadrant: order changes, bucket stays.
5. Drag across Matrix quadrants: bucket changes and row lands in chosen position.
6. Drag PriorityRail row: rail and Matrix order follow.
7. Quit/reopen: order persists in reminders.json.
8. Old reminders.json without manualRank still opens.
```

## Audit Points

- Rust schema must remain backward-compatible.
- React owns drag/editing; Rust owns persistence/validation.
- `manualRank` must not replace `priority`.
- Double-click edit must not open detail popover.
- Drag must not start from buttons/inputs/edit mode.
- Files stay under 500L.
