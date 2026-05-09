# 260508 Rust MVP

## Purpose

Finalize the Rust-side MVP diff before entering PABCD.

This folder is a planning artifact only. It does not implement code. The goal is to make the future PABCD build phase mechanical: each phase has a small, auditable Rust diff with clear verification.

## Current Baseline

- `src-tauri/src/reminders.rs` owns schema, seed data, path resolution, load, and save.
- `src-tauri/src/lib.rs` registers `load_reminders` and `save_reminders`.
- Frontend calls Rust through `src/features/reminders/tauri-api.ts`.
- `npm run tauri:check` currently passes.

## Phase Map

| Phase | File | Goal |
| --- | --- | --- |
| R0 | [00_scope.md](00_scope.md) | Define Rust MVP boundary and non-goals |
| R1 | [01_domain_schema.md](01_domain_schema.md) | Split typed domain models from command code |
| R2 | [02_storage_repository.md](02_storage_repository.md) | Add atomic JSON persistence and corrupt-file recovery |
| R3 | [03_command_contract.md](03_command_contract.md) | Add narrow Tauri commands for CRUD and focus state |
| R4 | [04_notification_boundary.md](04_notification_boundary.md) | Add Rust notification command boundary |
| R5 | [05_test_and_verification.md](05_test_and_verification.md) | Aggregate final verification gate |
| R6 | [06_frontend_contract.md](06_frontend_contract.md) | Align frontend invoke contract without redesigning UI |
| Review | [99_employee_review.md](99_employee_review.md) | Employee review results |

## Review-Driven Fixes

Backend review returned `NEEDS_FIX`. The plan was revised to include:

- frontend callsite rewiring in `RemindersApp.tsx` or a new reminder controller hook
- pure path-based storage API for tempfile unit tests
- colocated Rust tests or explicit `#[cfg(test)] mod ...` discovery
- snapshot and input invariant validation
- R2/R3 phase-local tests instead of deferring all tests to R5
- Rust/TypeScript seed consistency contract

GPT Pro review returned `NEEDS_FIX`. The plan was revised again to include:

- direct defining-module Tauri command registration paths
- frontend-ephemeral selection/smart-view contract
- tri-state nullable patch semantics
- Rust id/time generation policy
- single-focus invariant across every command path
- load-time invariant validation and invalid-file quarantine
- stale tmp cleanup and optional temp-file flush
- official `isTauri()` runtime detection in frontend wrappers
- removal of unused store plugin surface unless retained for future settings

## Proposed PABCD Entry

After this folder is approved:

1. Enter P phase with this folder as the source plan.
2. Audit with Backend employee.
3. Build phase implements R1-R6 in order.
4. Check phase runs Rust, TS, Vite, and scaffold verification.
