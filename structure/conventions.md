# Conventions

## TypeScript

- Strict mode is mandatory.
- New exported functions must have explicit parameter and return types.
- Use ES Modules only.
- Avoid `any`; prefer `unknown` plus narrowing.

## React

- Feature UI lives under `src/features/<feature>/`.
- Keep interaction state near the feature until shared state becomes necessary.
- Use semantic buttons and inputs for all interactions.
- Add loading, empty, and error states before treating a feature as complete.

## Rust

- Keep Tauri commands small.
- Convert internal errors to string only at the command boundary.
- Keep native modules under `src-tauri/src/`.

## Verification

```bash
npm run typecheck
npm test
npm run build
npm run tauri:check
npm run tauri:test
cargo clippy -- -D warnings
```
