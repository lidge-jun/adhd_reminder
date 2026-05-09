# Test Plan

## Static

```bash
npm run typecheck
```

## Unit

```bash
npm test
```

Current unit target:

- adding reminders trims title and inserts into selected list
- toggling reminders preserves unrelated reminders
- switching lists chooses first reminder in that list

## Frontend Build

```bash
npm run build
```

## Rust/Tauri

```bash
npm run tauri:check
```

## Later Browser/E2E

- quick capture creates a new row
- clicking a row opens detail pane
- focus action moves item into Focus
- notification button requests permission in Tauri runtime
