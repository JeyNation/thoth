## Design System Migration — Trackable TODO

This file lists the prioritized work to create a design-system (UI primitives) and migrate UI components into the design system and feature folders. Use this as a checklist for small, reviewable PRs.

Status: in-progress

High-level goals

- Create `src/components/ui/` design-system with Theme wrapper and primitive components (Button, Input, IconButton, Labels, Loading, EmptyState).
- Move domain-specific UI into feature folders under `src/features/{domain}/components` (e.g., extraction-rules, document-processing, form/mapping).
- Replace direct imports from `@mui/*` in application code with imports from `@/components/ui/*` or feature-level components.

Checklist (small, incremental PRs)

1. Scaffold design system (PR: scaffold/design-system)

   - [x] Create `src/components/ui/` with subfolders: `Button/`, `Input/`, `Icons/`, `Loading/`, `Labels/`, `Theme/`.
   - [x] Add `src/components/ui/index.ts` that re-exports primitives.
   - Acceptance: files exist and build passes.

2. Theme & Tokens (PR: ui/theme)

   - [x] Create `src/components/ui/Theme/ThemeRegistry.tsx` (wrap MUI ThemeProvider + CssBaseline).
   - [x] Add a small `theme.ts` with tokens used across the app.
   - Acceptance: App starts with ThemeRegistry and no runtime errors.

3. Primitives (PR: ui/primitives-1)

   - [x] Input: `src/components/ui/Input/TextInput.tsx` (wraps MUI TextField)
   - [x] Button: `src/components/ui/Button/TextButton.tsx` and a generic `Button.tsx`
   - [x] IconButton: `src/components/ui/IconButton.tsx`
   - Acceptance: unit tests for primitives exist and pass; one consumer replaced successfully.

4. Common UI (PR: ui/primitives-2)

   - [ ] LoadingIndicator -> `src/components/ui/Loading/LoadingIndicator.tsx`
   - [ ] EmptyState -> `src/components/ui/EmptyState.tsx`
   - [ ] Labels -> `src/components/ui/Labels/SectionLabel.tsx` & `SubsectionLabel.tsx`
   - Acceptance: callers updated and UI unchanged.

5. Migrate ThemeRegistry and update app layout (PR: ui/app)

   - [ ] Replace `src/components/ThemeRegistry.tsx` references with new ThemeRegistry and import from `@/components/ui`.
   - Acceptance: app builds and pages render the themed UI.

6. Feature migration: extraction-rules (PRs: feature/extraction-rules/\*)

   - [ ] Create `src/features/extraction-rules/components/`.
   - [ ] Move and adapt the following files (one-by-one):
     - `src/components/rules/AnchorConfig.tsx` -> `src/features/extraction-rules/components/AnchorConfig/AnchorConfig.tsx`
     - `src/components/rules/FieldRulesList.tsx` -> `.../FieldRulesList/`
     - `src/components/rules/RulesActionBar.tsx`
     - `src/components/rules/ViewRule.tsx`
     - `src/components/rules/SearchZone.tsx`
     - `src/components/rules/RuleText.tsx`
     - `src/components/rules/RegexPatterns.tsx`
     - `src/components/rules/FieldRulesSection.tsx`
     - `src/components/rules/EditRule.tsx`
   - Acceptance: tests pass and no runtime errors in Rules UI.

7. Feature migration: document-processing (PRs: feature/document-processing/\*)

   - [ ] Create `src/features/document-processing/components/`.
   - [ ] Move Viewer and Workspace related files:
     - `src/components/Viewer.tsx` -> `src/features/document-processing/components/Viewer/Viewer.tsx`
     - `src/components/viewer/ViewerPage.tsx`, `ViewerControls.tsx` -> `.../viewer/`
     - `src/components/Workspace.tsx`, `src/components/workspace/*` -> `.../Workspace/`
   - Acceptance: Viewer/Workspace behavior unchanged; tests and build pass.

8. Feature migration: form & mapping (PRs: feature/form-mapping/\*)

   - [ ] Move form components to `src/features/form/components/` or `src/features/mapping/components/` as appropriate:
     - `src/components/form/FieldInput.tsx` -> `.../FieldInput`
     - `src/components/form/LineItemCard.tsx`
     - `src/components/form/ColumnDropZone.tsx` and `RowDropZone.tsx`
     - Dialogs: `src/components/dialogs/*` -> feature/dialogs
   - Acceptance: forms and dialogs work after migrations.

9. Styles & tokens (PR: ui/styles)

   - [ ] Move design tokens into `src/components/ui/Theme/theme.ts` and update style helpers to use tokens.
   - [ ] Replace `SxProps` usage where appropriate with theme-aware classes or central sx types.
   - Acceptance: no type errors and consistent styling.

10. Clean-up (PR: cleanup/ui)

- [ ] Remove any remaining direct `@mui/*` imports across the repo (or rationalize where they must remain).
- [ ] Run `grep` to verify all UI imports come from `@/components/ui` or feature folders.
- Acceptance: repo-wide import check passes and CI green.

Mapping of current files (scan results)

- common primitives:
  - `src/components/common/TextInput.tsx`
  - `src/components/common/TextButton.tsx`
  - `src/components/common/IconButton.tsx`
  - `src/components/common/LoadingIndicator.tsx`
  - `src/components/common/EmptyState.tsx`
  - `src/components/common/SectionLabel.tsx`
  - `src/components/common/SubsectionLabel.tsx`
- theme & top-level:
  - `src/components/ThemeRegistry.tsx`
  - `src/app/layout.tsx`
- feature candidates:
  - `src/components/rules/*` (move to `extraction-rules`)
  - `src/components/viewer/*` and `src/components/Workspace*` (move to `document-processing`)
  - `src/components/form/*` and `src/components/dialogs/*` (move to `form`/`mapping`)

How to use this doc

- Create one small PR per checklist item. Keep each PR focused (one primitive or one moved file).
- Add a short PR description with the files moved and the verification steps you ran locally.

If you want, I can scaffold `src/components/ui/` and implement the first primitives (TextInput, Button, IconButton) in a branch. Ask and I'll start that as the next step.

---

Last updated: 2025-11-06
