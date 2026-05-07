# R5 — Test and Verification

## Goal

Aggregate final verification after R1-R4 already added phase-local tests.

## Diff

### MODIFY `src-tauri/Cargo.toml`

Add dev dependency only if needed:

```toml
[dev-dependencies]
tempfile = "3"
```

### Test Placement Decision

Use colocated `#[cfg(test)] mod tests` inside the module under test:

- `domain.rs`
- `storage.rs`
- `service.rs`
- `notifications.rs`

Do not create detached `service_test.rs` or `storage_test.rs` unless `mod.rs` explicitly declares those modules with `#[cfg(test)]`.

Frontend tests added in R6 must cover:

- invoke payload keys are camelCase.
- `isTauri()` runtime path calls native wrappers.
- Tauri mutation handlers replace React state with returned snapshots.
- normal Tauri mutations do not call `saveReminderSnapshot`.
- browser fallback still calls local pure store helpers.

### MODIFY `package.json`

Add explicit Rust test script:

```json
"tauri:test": "cd src-tauri && cargo test"
```

## Verification

```bash
npm run tauri:check
npm run tauri:test
npm run typecheck
npm test
npm run build
```

Expected: all pass.

## Phase Gate

R5 cannot pass if R2/R3/R4 only pass `cargo check` without their local tests. The full gate is an aggregation, not the first time Rust behavior is tested.
