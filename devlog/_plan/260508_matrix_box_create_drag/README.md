# 260508 Matrix Box Create And Drag Diff Plan

## Screenshot Read

Input image: `/Users/jun/.cli-jaw/uploads/1778178274860_722c36d2_Screenshot2026-05-08at32412AM.png`

The reference shows an Apple Reminders-style list surface:

- existing reminders are plain rows with leading circular completion controls
- the create affordance is another row, not a large button
- the empty create row uses a dotted circle and quiet placeholder treatment
- row density is compact and should not introduce card-like chrome

## Product Contract

Keep the 2x2 matrix information architecture. Each matrix box becomes an input target:

- users can create a new reminder inside any quadrant
- users can drag a reminder row into another quadrant
- the destination quadrant owns the reminder's matrix defaults
- remove the global bottom quick-capture row for this MVP because it creates by selected view, not by the visible box the user is working in
- row detail editing opens from a row button as a square popover
- the right rail shows the planned priority sketch: focus item, matrix counts, next actions, and cutoff hint
- after UX review, the right rail must not repeat visible matrix counts; it should expose actionable focus/next rows with the same check/detail controls as matrix rows, excluding drag
- the detail popover should be large enough for real editing, not a compact tooltip-sized panel
- the matrix center cross should include quiet direction labels for importance and urgency
- the app should support Korean and English with a Settings entry in the left sidebar

## Bucket Mapping

```text
urgentImportant -> listId=today, status=open, priority=high
important       -> listId=today, status=open, priority=normal
waiting         -> listId=waiting, status=waiting, priority=normal
later           -> listId=later, status=open, priority=low
```

## Diff Plan

### R1 Matrix Contract

- NEW `src/features/reminders/reminder.matrix.ts`
  - define `MatrixBucket`
  - define create/update mapping helpers
- NEW `src/features/reminders/reminder.matrix.test.ts`
  - assert create defaults
  - assert drag/move patch defaults

### R2 Shared Input Shape

- MODIFY `src/features/reminders/reminder.schema.ts`
  - add optional `priority` to `CreateReminderInput`
  - add optional `listId` to `UpdateReminderInput`
- MODIFY `src-tauri/src/reminders/domain.rs`
  - add optional priority on create input
  - add optional list id patch on update input
  - validate target list id when provided

### R3 Mutation Behavior

- MODIFY `src/features/reminders/reminder.store.ts`
  - add browser fallback create-with-input helper
  - support create priority and update list id
- MODIFY `src-tauri/src/reminders/service.rs`
  - create reminders with requested priority when provided
  - allow update to move reminders between lists
  - test list movement

### R4 React Surface

- MODIFY `src/features/reminders/useReminderController.ts`
  - add `addReminderToBucket`
  - add `moveReminderToBucket`
  - keep native commands as source of truth in Tauri
  - keep browser fallback pure for Vite development
  - classify every reminder through one matrix-bucket resolver so an item cannot appear in multiple boxes
- MODIFY `src/features/reminders/RemindersApp.tsx`
  - add one draft input state per quadrant
  - render inline create row at the bottom of each quadrant
  - make reminder rows draggable
  - drop onto a quadrant to move the reminder into that bucket
  - remove the bottom global quick-capture row to avoid wrong-target creation
  - replace the right detail pane with the priority rail
- NEW `src/features/reminders/components/PriorityRail.tsx`
  - show focus, next actions, and cutoff hint
  - reuse checkbox/detail row controls, but do not enable dragging in the rail
- NEW `src/features/reminders/components/ReminderEditorPopover.tsx`
  - show title, notes, due/remind metadata, focus/notify/delete actions in a larger square popover
- NEW `src/features/reminders/components/SettingsPanel.tsx`
  - provide language selection from the left sidebar Settings button
- NEW `src/features/reminders/reminder.i18n.ts`
  - provide Korean/English translation keys for active reminder UI

### R5 Visual Treatment

- MODIFY `src/styles/app.css`
  - dotted-circle quiet create row inside each matrix box
  - drag cursor feedback
  - retain Apple-like split-view hairlines, compact rows, and light quadrant tint
- NEW `src/styles/priority-rail.css`
  - right rail, larger popover, and settings panel styles split from `app.css` to keep files below 500 lines

## Verification Gate

- `cargo fmt`
- `cargo clippy -- -D warnings`
- `npm run typecheck`
- `npm test`
- `npm run tauri:test`
- `npm run build`
- `npm run tauri:check`
- browser render screenshot
