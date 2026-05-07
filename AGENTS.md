# AGENTS.md — jaw-reminders

> Fast local reminder app prototype for CLI-JAW workflows.

## Project Rules

- Use ES Module syntax in TypeScript.
- Keep TypeScript strict-compatible from the first patch.
- Keep files under 500 lines; split feature modules before they grow.
- Use Rust for native/Tauri boundaries only: persistence, app filesystem, notifications.
- Use React for interaction-heavy UI.
- Prefer feature colocation under `src/features/*`.
- Store durable planning in `devlog/_plan/`; move completed work to `devlog/_fin/`.
- Keep current architecture facts in `structure/`, not in ad-hoc notes.

## UX Direction

- Native macOS Reminders-inspired: fast, calm, three-pane, keyboard-friendly.
- Do not copy Apple assets or trademarks.
- Optimize for ADHD: one current focus, next 3 actions, low-noise backlog.
- Avoid decorative gradients, oversized cards, emoji, and marketing-page patterns.

## Verification

- TypeScript: `npm run typecheck`
- Frontend build: `npm run build`
- Unit tests: `npm test`
- Rust/Tauri check: `npm run tauri:check`
