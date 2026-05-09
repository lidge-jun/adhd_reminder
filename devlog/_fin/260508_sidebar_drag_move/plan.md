# Sidebar Drag Move

## Goal

Enable dragging a reminder row onto the left sidebar so the sidebar becomes a
valid move target, not only the 2x2 matrix blocks.

## Current Signals

- React + strict TypeScript frontend under `src/features/reminders/`.
- Durable reminder data is owned by Rust/Tauri commands through
  `useReminderController`.
- Matrix drag now works in the rebuilt Tauri app after disabling native HTML5
  row dragging and using pointer-coordinate target detection.
- `RemindersApp.tsx` is over the jawdev 500-line limit, so the next patch must
  move drag and matrix row concerns out of the app root while adding sidebar
  behavior.

## P1 — Drop Target Contract

### Solution

Create one shared frontend drop-target protocol:

- Matrix quadrant: `data-reminder-drop-bucket="urgentImportant|important|waiting|later"`
- Sidebar smart list:
  - Urgent -> bucket `urgentImportant`
  - Focus -> bucket `important`
  - Waiting -> bucket `waiting`
  - Later -> bucket `later`
  - Done -> status `done`
- Sidebar user list: `data-reminder-drop-list-id="<listId>"`

### Files

- `NEW` `src/features/reminders/useReminderDrag.ts`
  - owns pointer drag state
  - reads final drop target from `document.elementFromPoint`
  - returns `draggedReminderId`, `startReminderDrag`, `clearReminderDrag`
  - exposes `ReminderDropTarget`

## P2 — Matrix Component Extraction

### Solution

Move matrix quadrant/row rendering out of `RemindersApp.tsx` so the app root
stays under the jawdev file-size budget and the same drag hook can be reused.

### Files

- `NEW` `src/features/reminders/components/MatrixQuadrant.tsx`
  - renders one matrix quadrant
  - applies `data-reminder-drop-bucket`
  - starts pointer drag from reminder rows
  - keeps row check/detail behavior unchanged

- `MODIFY` `src/features/reminders/RemindersApp.tsx`
  - imports `MatrixQuadrant`
  - imports `useReminderDrag`
  - maps `ReminderDropTarget` to controller calls

## P3 — Sidebar Targets

### Solution

Make smart-list and user-list buttons valid drop targets. While dragging, sidebar
items receive a light target affordance, but their click-to-select behavior stays
unchanged.

### Files

- `MODIFY` `src/features/reminders/components/Sidebar.tsx`
  - add `dragActive` prop
  - add drop-target data attributes
  - add `is-drop-target` class during an active reminder drag

- `MODIFY` `src/styles/app.css`
  - keep matrix/workspace styles after sidebar extraction

- `NEW` `src/styles/sidebar.css`
  - move sidebar/layout styles out of `app.css`
  - add restrained sidebar drop-target affordance

- `MODIFY` `src/styles/index.ts`
  - import `sidebar.css` before `app.css`

## P4 — Verification

Run:

1. `npm run typecheck`
2. `npm test`
3. `npm run build`
4. `npm run tauri:check`
5. `npm run tauri:build -- --bundles app`
6. Reopen the rebuilt `Jaw Reminders.app`
7. Manual verification:
   - Drag a matrix reminder to Sidebar Later -> item becomes `Open · Low` and
     Later count increments.
   - Drag it back to Sidebar Focus -> item becomes `Open · Normal` and Focus
     count increments.
   - Drag it to Sidebar Done -> item leaves active matrix and Done count
     increments.

## Out Of Scope

- Reordering reminders inside a list.
- Cross-window drag.
- Dragging completed reminders back from the Done single-list view.
- Rust schema changes.
