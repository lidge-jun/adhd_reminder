# Drag Preview Overlay (ghost row)

## Goal

Make custom pointer-based reminder drag visually trackable. Currently
`useReminderDrag.ts` only stores pointer coords for hit-testing on `pointerup`,
so the user sees no "ghost" of the row following the cursor. Add a fixed-layer
overlay that mirrors the dragged row's title and follows the pointer in
real-time, plus a subtle drop-target glow on matrix quadrants and sidebar
buttons while a drag is active.

## Current Signals

- `useReminderDrag.ts` already exposes `draggedReminderId`. Pointer coords are
  in internal `pointerDragState` only.
- `RemindersApp.tsx` is at 379 lines, well within budget.
- `app.css` is at 480 lines, near the 500-line jawdev cap. New overlay styles
  must go to a fresh CSS file.
- Sidebar already gets a `dragActive` prop; matrix quadrants currently rely on
  `[data-reminder-drop-bucket]` only — they need a drag-active affordance too.

## P1 — Drag Hook Extension

### Solution

Extend `useReminderDrag` to expose two new public values:

- `dragPreview: { reminderId, title, x, y } | null` — non-null only after the
  pointer threshold is crossed (`active === true`)
- `startReminderDrag(reminderId, event, options: { title })` — accepts the
  visible title so the overlay can render without a second lookup

Internal: `PointerDragState` gains `title: string`. The existing pointermove
handler updates `currentX/currentY/active` as today; we derive `dragPreview`
from `pointerDragState` only when `active` is true.

### Files

- `MODIFY` `src/features/reminders/useReminderDrag.ts`
  - widen `startReminderDrag` signature to `(id, event, { title })`
  - add `title` to `PointerDragState`
  - return `dragPreview` (memoised) alongside existing fields
  - return `dragActive: boolean` (== `dragPreview !== null`) for downstream
    convenience

## P2 — Overlay Component

### Solution

Render a small fixed-position card that follows the cursor while a drag is
active. The overlay is non-interactive (`pointer-events: none`), positioned via
`transform: translate3d(x, y, 0)` to avoid layout thrash, and rendered at the
end of `<main>` so it sits above all panes without restructuring z-index.

### Files

- `NEW` `src/features/reminders/components/DragPreviewOverlay.tsx`
  - props: `{ title: string; x: number; y: number }`
  - returns one `<div className="drag-preview-overlay">` with `transform`
    inline style and the title text
- `MODIFY` `src/features/reminders/RemindersApp.tsx`
  - replace `dragActive={Boolean(reminderDrag.draggedReminderId)}` with
    `dragActive={reminderDrag.dragActive}`
  - render `<DragPreviewOverlay>` when `reminderDrag.dragPreview`
  - update the four `<MatrixQuadrant>` calls to pass `dragActive`

## P3 — Pointer Drag Start From Rows

### Solution

Pass each reminder's title through to the hook so the overlay can render
immediately on the first qualifying pointermove.

### Files

- `MODIFY` `src/features/reminders/components/MatrixQuadrant.tsx`
  - widen `onPointerReminderStart` prop to
    `(id, event, options: { title }) => void`
  - call it with `{ title: reminder.title }` from `MatrixReminderRow`
  - add `data-drag-active` attribute to the section so CSS can light up
    the quadrant only when a drag is in flight (no React state churn)
- `MODIFY` `src/features/reminders/RemindersApp.tsx`
  - pass `dragActive` flag into each `<MatrixQuadrant>`
  - new prop on `MatrixQuadrant`: `dragActive: boolean`

## P4 — Visual Treatment

### Solution

Keep `app.css` below the jawdev cap. New overlay/affordance styles live in
their own file. Matrix quadrant target affordance reuses Sidebar's existing
`is-drop-target` visual language (light tint + dotted ring) for consistency.

### Files

- `NEW` `src/styles/drag-overlay.css`
  - `.drag-preview-overlay`: fixed, pointer-events:none, max-width 240px,
    rounded 8px, soft shadow, translucent surface, small flag icon optional,
    text-overflow ellipsis
  - `.matrix-quadrant[data-drag-active='true']`: subtle dashed outline +
    background tint
  - `.sidebar-button.is-drop-target`: keep existing rule in `sidebar.css`
    untouched
- `MODIFY` `src/styles/index.ts`
  - import `drag-overlay.css` after `app.css` and `sidebar.css`

## P5 — Verification Gate

1. `npm run typecheck`
2. `npm test`
3. `npm run build`
4. `npm run tauri:check`
5. `npm run tauri:build -- --bundles app`
6. Open the rebuilt `Jaw Reminders.app`
7. Manual:
   - Press and drag a matrix row >6px → ghost card appears at cursor
     showing the title
   - Hovering over another quadrant → that quadrant gets a dashed outline
   - Hovering over Sidebar Later → the button gets the existing drop affordance
   - Releasing on the target quadrant or sidebar item → reminder moves and
     ghost disappears
   - Releasing on empty space → ghost disappears, no movement
   - ⌘+ / ⌘- / ⌘0 still adjusts zoom and the overlay still tracks correctly
     under non-1.0 zoom

## Out Of Scope

- Multi-reminder drag.
- Cross-window drag.
- Animated drop bounce.
- Replacing pointer drag with HTML5 native DnD.
