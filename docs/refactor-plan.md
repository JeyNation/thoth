# Thoth Refactor & Modernization Plan

This document tracks a prioritized, component-by-component refactor plan to bring the project into the modern, opinionated standards described in `.github/copilot-instructions.md`.

Rules and constraints summary (from instructions)
- Domain-Driven Design (DDD): group by `src/features/{domain}` for domain code.
- TypeScript strict: avoid `any`, prefer `unknown` or concrete types.
- UI: import only from `src/components/ui/` design wrappers; use Tailwind classes for styling; avoid `sx` prop.
- API: thin Next.js API routes calling headless service functions under features.
- Validation: use `zod` schemas in feature `api/schemas.ts`.
- Database: single Prisma client at `src/lib/db.ts`.
- Testing: colocated tests, RTL for components, Playwright for E2E.
- Imports: use absolute alias `@/...`.


How to use this file
- Each item has: Scope, Tasks, Owner, Priority, Estimate (days), Status, Acceptance Criteria.
- Update the Status as you make progress. This file is a living checklist.

Primary refactor principles
- TDD-first: write tests before moving or changing behavior. Each refactor step must include automated tests (unit/integration) that validate behavior before and after the change.
- Incremental: break moves into the smallest safe pieces. Move one component or small cohesive unit at a time and run tests and manual checks.
- Scaffold-first: create new feature folder structure and a minimal test harness before moving production files to avoid large refactor PRs that break imports.

-Pre-refactor checklist (scaffold & safety)
- Create feature folder scaffolds for each target domain under `src/features/{domain}` with placeholder `index.ts` and `README.md`.
- Follow the colocation principle for tests: do NOT create a centralized `tests/` folder inside the scaffold. Instead, add guidance or an example showing that tests should live next to the component (e.g., `components/RuleEditor/RuleEditor.test.tsx`).
- Add a migration README inside each scaffold explaining what will be moved and why.
- Ensure `tsconfig` paths and ESLint import/resolver accept the planned new locations (absolute alias `@/features/...`).
- Add a feature-level test runner pattern (scripts to run scoped tests) to speed verification.
- Commit scaffold-only PRs first (no behavior changes). This allows reviewing structure before moves.

- Acceptance for scaffolds:
- Scaffolds exist for the initial features: `extraction-rules`, `document-processing`, `forms`, `viewer`.
- Running scoped tests for a feature runs (even if the feature currently has no tests) without introducing build errors. When tests are added, they must be colocated with source files.

---

## Global housekeeping
- Scope: repo-wide build/lint/test infra
- Tasks:
  - Ensure `tsconfig.json` strict settings are enabled and consistent.
  - Fix ESLint rules to enforce `@typescript-eslint/no-explicit-any`, exhaustive-deps, no-console (except logger), import/order.
  - Standardize Prettier / formatting rules. Add pre-commit hook for lint-staged checks.
  - Confirm alias `@` works in tsconfig and eslint resolver.
  - Add CI workflow: lint, build, test, typecheck.
- Owner: infra
- Priority: High
- Estimate: 1-2 days
- Status: todo
- Acceptance:
  - CI pipeline runs lint + typecheck + tests and succeeds.
  - Pre-commit prevents bad commits.

---

## 1) Design system & UI wrappers
- Scope: `src/components/ui/` and usage across the app
- Tasks:
  - Audit `src/components/ui/` for components that wrap MUI. Ensure all UI comes from this folder.
  - Replace direct MUI imports in the codebase with imports from `@/components/ui` wrappers.
  - Remove `sx` usage and convert to Tailwind classes or wrapper props.
  - Standardize props/variants and storybook/examples (if any).
  - Add a migration guide for common replacements (Button, Input, Modal).
- Owner: frontend
- Priority: High
- Estimate: 2-4 days
- Status: todo
- Acceptance:
  - No files import directly from `@mui/material`.
  - Visual parity tests (spot-check pages) pass.

---

## 2) Domain re-organization (DDD)
- Scope: move feature code into `src/features/` subfolders; avoid cross-domain imports
- Tasks:
  - Identify feature candidates: `document-processing`, `extraction-rules`, `mapping`, etc.
  - Move UI components that are domain-specific into `src/features/{domain}/components`.
  - Move domain hooks into `src/features/{domain}/hooks`.
  - Move domain services into `src/features/{domain}/services` and API-related code into `src/features/{domain}/api`.
  - Leave shared utilities in `src/lib/` or `src/types/`.
  - Update imports to use absolute aliases.
- Owner: arch
- Priority: High
- Estimate: 3-7 days (iterative, per-feature)
- Status: todo
- Acceptance:
  - No cross-domain imports (lint rule or CI check catches violations).
  - Feature folders contain components, hooks, services, types, api.

---

## 3) API routes and service layer
- Scope: `src/app/api/**` and `src/features/**/api` services
- Tasks:
  - Convert API route handlers to "thin" entry points that validate via zod and call service functions.
  - Create/update `src/features/{domain}/api/schemas.ts` with zod validators and inferred TypeScript types.
  - Implement service functions (`create`, `get`, `update`, `delete`) in feature `api` directories.
  - Centralize error handling: create `src/lib/errors.ts` and map errors in routes to appropriate responses.
- Owner: backend
- Priority: High
- Estimate: 2-4 days
- Status: todo
- Acceptance:
  - Each API route calls a service function; no business logic in routes.
  - zod schemas exist and are used for validation.

Additional infra tasks (install & scaffold)
- Initialize Prisma: add `prisma/` folder and run `npx prisma init` locally to create `schema.prisma`.
- Add `prisma` scripts to `package.json`: `prisma:generate`, `prisma:migrate:dev`, `prisma:studio`.
- Add `.env.example` with placeholders for `DATABASE_URL` and `DIRECT_URL` and document local SQLite fallback for dev.
- Add `prisma/seed.ts` to import sample layout maps and documents from `public/data`.

TDD and migration approach for API/DB
1. Add zod schemas and unit tests for validation logic (no DB access yet).
2. Design minimal Prisma models for persisted artifacts (layout maps, documents, rules) and add migrations.
3. Implement repository functions with tests using SQLite in-memory or a test DB.
4. Convert API routes to call services; add integration tests for the routes.

---

## 4) Database access
- Scope: `src/lib/db.ts`, prisma usage across repo
- Tasks:
  - Ensure a single Prisma client export at `src/lib/db.ts`.
  - Replace any ad-hoc DB client creations with the shared client.
  - Add repository or repository-like thin wrappers in features for data access.
- Owner: backend
- Priority: High
- Estimate: 1-2 days
- Status: todo
- Acceptance:
  - No direct PrismaClient instantiations apart from `src/lib/db.ts`.
  - Database queries are called from services/repositories in feature folders.

Installation & setup tasks
- Add Prisma as a dependency and commit `prisma/schema.prisma` with initial models.
- Create `prisma/seed.ts` to load sample JSON from `public/data/` into the DB.
- Provide a SQLite dev database option (`prisma/dev.db`) for local testing before Neon is provisioned.
- Document environment setup in `.env.example` and `README.md`.

Acceptance for DB setup:
- Local dev can run migrations and seed data using `pnpm prisma:migrate:dev && pnpm prisma:seed`.
- Tests can run against SQLite or a disposable test DB.

---

## 5) Types and schemas
- Scope: `src/types/`, feature-level `types/`, and zod schemas
- Tasks:
  - Audit `src/types` for global types; move domain types into feature `types` when appropriate.
  - Add or convert data-shape validations to zod in feature `api/schemas.ts`.
  - Ensure parser/extraction types (`AnchorRule`, `ParserPattern`, etc.) are typed and used (no any).
- Owner: frontend/backend
- Priority: High
- Estimate: 2-4 days
- Status: todo
- Acceptance:
  - Type coverage increased; no `any` in public APIs.
  - zod schemas and TypeScript types are in sync.

---

## 6) Services & extraction engine
- Scope: `src/services/extractionEngine.ts`, `src/services/*`
- Tasks:
  - Audit `extractionEngine` for public API and side-effects; extract pure functions where possible.
  - Add unit tests for engine behaviors (anchor finding, parsing, startingPosition, pageScope, instanceFrom).
  - Ensure engine code is headless and testable (no DOM/Next specifics).
  - Document inputs/outputs (shape of bounding boxes, layoutMap) and error modes.
- Owner: backend/engine
- Priority: High
- Estimate: 3-5 days
- Status: todo
- Acceptance:
  - Engine functions are covered by unit tests and exported with clear types.
  - No runtime-only side effects; parsing behavior well-documented.

TDD & incremental refactor
1. Write unit tests that capture the current engine behavior (golden inputs => expected outputs).
2. Refactor one small pure function at a time (e.g., normalize text, calculateBounds, findAnchor) and run tests after each change.
3. Add edge-case tests (multi-page anchors, empty input, overlapping boxes) before and after changes.
4. Only move the engine file into a feature folder after its tests are present and passing in the new location.

---

## 7) Components: Rules editor & RegexPatterns
- Scope: `src/components/Rules.tsx`, `src/components/rules/*` → move to `src/features/extraction-rules/components/*`
- Tasks:
  - Move rule-specific components into the `extraction-rules` feature folder, one component at a time.
  - For each component moved:
    1. Add or update unit/integration tests that describe current behavior (TDD-first).
    2. Move component and update imports.
    3. Run tests and perform manual checks of the Rules UI.
  - Ensure Regex presets are validated (zod) and reachable from a headless loader if persistence is needed.
- Owner: frontend
- Priority: High
- Estimate: 3-5 days
- Status: todo
- Acceptance:
  - Rules editor lives under `src/features/extraction-rules`.
  - Save flow unit tests pass; no runtime errors.

---

## 8) Hooks & client utilities
- Scope: `src/hooks/*`, `src/utils/*`
- Tasks:
  - Move universal hooks used across domains into `src/lib/hooks` or retain under feature if domain-specific.
  - Add TypeScript types for hook inputs and outputs.
  - Remove any side-effectful logic from hooks that should be in services.
- Owner: frontend
- Priority: Medium
- Estimate: 2-3 days
- Status: todo
- Acceptance:
  - Hooks have clear type signatures and are colocated appropriately.

---

## 9) Tests
- Scope: `src/__tests__`, feature test files
- Tasks:
  - Move or create tests as part of each component migration step (TDD-first).
  - Maintain a test-per-move rule: every file moved or refactored must have tests added/updated in the new location and pass before the commit.
  - Use sqlite in-memory or a scoped test DB for repository tests when DB changes are included.
  - Add CI job to run tests. Ensure fast tests run in PRs and full test suite runs on main.
- Owner: qa/engine
- Priority: High
- Estimate: 3-6 days
- Status: todo
- Acceptance:
  - Unit/integration tests exist for critical paths and run in CI.

---

## 10) Public data and presets
- Scope: `public/data/*` and any in-repo JSON presets
- Tasks:
  - Standardize preset locations (prefer `public/data/regex_presets.json` or `src/features/extraction-rules/data/` for headless access).
  - Add loader utilities to fetch/parse presets through `src/lib/api.ts` if runtime fetching is necessary.
  - Validate presets with zod at load-time.
- Owner: frontend
- Priority: Medium
- Estimate: 1-2 days
- Status: todo
- Acceptance:
  - Presets validated and accessible through a small API function.

---

## 11) Logging & Error Reporting
- Scope: app-wide
- Tasks:
  - Replace stray console.* with a small logging wrapper in `src/lib/logger.ts`.
  - Ensure parsing/engine warnings use console.warn or logger.warn; errors use logger.error.
  - Integrate optional Sentry/monitoring later (add as a follow-up).
- Owner: infra
- Priority: Low
- Estimate: 1 day
- Status: todo
- Acceptance:
  - No `console.log` in production code; logging wrapper used.

---

## Granular migration checklist (example sequence)
Each bullet corresponds to a small PR with the pattern: add tests → scaffold → move/refactor one file → run tests → manual verify → merge.

- Feature: `extraction-rules`
  - Move `src/components/rules/RegexPatterns.tsx` → `src/features/extraction-rules/components/RegexPatterns/`
  - Move `src/components/rules/AnchorConfig.tsx` → `src/features/extraction-rules/components/AnchorConfig/`
  - Move `src/components/Rules.tsx` → `src/features/extraction-rules/components/Rules/`
  - For each move: add unit/integration tests and manual verification steps.

- Feature: `document-processing`
  - Move `Viewer.tsx`, `Workspace.tsx`, `DropZone.tsx` into `src/features/document-processing/components/`
  - Add engine integration smoke tests that exercise document loading and simple extraction flows.

- Feature: `services`
  - Extract `src/services/extractionEngine.ts` into `src/features/extraction-rules/services/extractionEngine.ts` (after engine tests exist)

- Feature: `form` / `mapping`
  - Move mapping dialogs and forms into corresponding feature folders; add interaction tests.

---

When you are ready, I can scaffold the feature folders and add the initial per-feature test harnesses and package.json scripts to run scoped tests. Tell me which feature to scaffold first (recommended: `extraction-rules`).

---

## 12) Backlog & Nice-to-haves
- Add Storybook for UI components
- Add visual regression tests for critical pages
- Improve UX feedback (snackbars) on rule save
- Support regex flags in presets

---

## Migration plan and ordering (recommended)
1. Global infra: lint, tsconfig, CI (reduce PR friction)
2. Design system audit + replace direct MUI imports
3. Domain re-organization: move feature code incrementally, one feature at a time
4. API/service refactor + zod schemas
5. Database client consolidation
6. Extraction engine unit tests and cleanup
7. Rules editor: move to feature, tests, UX polish
8. Hooks and utils cleanup
9. Tests and coverage hardening
10. Final QA, visual checks, and release

---

## How to update this file
- Mark Status: todo -> in-progress -> done and add a short note when completed.
- Add PR references and checklist items under each section when you implement changes.


*Created by automation on behalf of the engineering team. Update as you iterate.*
