# AGENTS.md

PingHermano: a desktop API client in the Postman style (request tabs, collections, `{{variables}}` environments, pre-request and test scripts, history, response viewer). Tauri 2 shell with a React + TypeScript front end in `src/renderer/` and a Rust HTTP backend in `src-tauri/`.

## Stack

- Front end: React, TypeScript, Vite, Vitest (jsdom, `vmThreads` pool).
- Desktop shell and backend: Tauri 2, Rust (`reqwest` client in `src-tauri/src/http.rs`).
- Package manager: pnpm 10.34.5 (pinned in `package.json`; use `pnpm-lock.yaml`).

## Commands

```bash
pnpm install
pnpm dev                 # Vite dev server (front end only)
pnpm tauri:dev           # desktop app with the Rust backend
pnpm build               # vite build
pnpm tauri:build         # desktop bundle
pnpm test                # vitest (watch mode by default; use `pnpm test --run` for a single pass)
pnpm typecheck           # tsc --noEmit
```

Coverage: `@vitest/coverage-v8` is installed, but no threshold is configured.

## Structure

- `src/renderer/`: React app. `api/` (`tauriApi.ts`, `scriptRunner.ts`), `components/` (request editor, response viewer, sidebar, tabs, command palette, environment modal), `stores/`, `test/` (shared setup).
- `src-tauri/src/`: Rust backend. `http.rs` runs requests (one client, cancellable in-flight calls); `lib.rs` and `main.rs` wire Tauri commands.
- `docs/`: README images and screenshots.

## Conventions

- Max 180 lines per file. Split a component or module once it grows past that.
- Unit and integration tests use mocks and stubs only, with no real network or real API calls. Test data should look realistic.
- Target 85% test coverage (owner goal; not enforced yet).
- Follow DRY, KISS, YAGNI and SOLID. Keep modules single-purpose, and do not add features before they are needed.
- Document API usage and non-obvious logic with short comments.
- Commits: small and frequent, with a clear message.
- Every code change is reviewed by at least one other agent before merge.
- GitHub Actions: <!-- base-actions-main-policy -->
  - Reference internal actions by branch, never by SHA: `uses: juninmd/base-actions/<action>@main` and `uses: juninmd/base-actions/.github/workflows/<file>.yml@main`.
  - Do not pin `@<sha>` for `juninmd/base-actions`; updates are centralized on `main`.
  - PRs whose checks do not start because of billing or spending limits are auto-merged by `juninmd/base-actions/.github/workflows/auto-merge-billing-blocked.yml`. Apply the `do-not-merge` label to block that.

## Gotchas

- CI (`validate.yml`) calls the reusable `validate` workflow from `juninmd/base-actions`. It does not run `pnpm test` or `cargo` in this repo's own files.
- `vitest` runs in watch mode by default. Use `pnpm test --run` in scripts and CI-like checks.
