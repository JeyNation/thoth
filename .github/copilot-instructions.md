# Copilot Instructions for Thoth - Document Processing Pipeline

## 1. Project Overview

- React/Next.js document processing pipeline for extracting data from PO/Invoice documents through configurable extraction rules.
- **Current State:** Legacy codebase under incremental refactoring. All touched files must be updated to current standards.
- **Core Principle:** **Domain-Driven Design (DDD)**, organize by business domains, not technical layers.

## 2. Tech Stack & Constraints

| Technology                | Notes                                    |
| ------------------------- | ---------------------------------------- |
| **Next.js 15**            | App Router, Server Components by default |
| **TypeScript**            | Strict mode, no `any` types              |
| **Neon PostgreSQL**       | With Prisma ORM                          |
| **MUI + Tailwind CSS**    | Custom wrappers only, no `sx` prop       |
| **React Query + Zustand** | Server vs client state                   |

**Key Constraints:**

- API calls: Use `src/lib/api.ts` wrapper only
- UI: Import from `/src/components/ui/` only
- Styling: Tailwind classes only
- Architecture: Domain-driven organization

## 3. Project Structure (DDD)

```
src/
├── app/                    # Next.js App Router
├── components/ui/          # Design System (import from here)
├── features/               # Business Domains
│   ├── document-processing/
│   │   ├── components/     # Domain components
│   │   ├── hooks/          # Domain hooks
│   │   ├── api/            # API services & schemas
│   │   ├── types/          # Domain entities
│   │   ├── services/       # Business logic
│   │   └── utils/          # Domain utilities
│   └── extraction-rules/   # Same structure
├── lib/                    # Global utilities
├── providers/              # React Context
└── types/                  # Global types only
```

## 4. Component Organization Rules

### **Colocation Principle**

Code that changes together should live together. Start private, promote when shared.

### **Location Hierarchy**

1. **Component-private** → Component folder
2. **Feature-level** → `/features/{domain}/`
3. **Global** → `/src/lib/` or `/src/types/`

### **File Patterns**

```typescript
// Single-file components (UI)
src/components/ui/Button.tsx

// Complex components (features)
src/features/extraction-rules/components/RuleEditor/
├── index.ts             # Public API
├── RuleEditor.tsx       # Main component
├── types.ts             # Private types
└── helpers.ts           # Private utilities
```

## 5. Testing Strategy

### **Colocation Principle**

- All test files (`.test.tsx` or `.spec.tsx`) MUST live in the same folder as the code they are testing.
- **E2E Tests:** End-to-end tests (Playwright) are the only exception and live in a top-level `/playwright` folder.

### **Testing Philosophy**

- **Primary Goal:** We test user behavior, not implementation details
- **Tool:** Use React Testing Library + Playwright for E2E
- **Pattern:** Follow the "Arrange, Act, Assert" pattern for all tests
- **Focus:** Prioritize Integration Tests (L2) for feature components. Unit tests (L1) are for pure logic (e.g., in `utils.ts`)
- **AI Usage:** Use the `/tests` command to generate test boilerplate, then review it to ensure it tests the correct user behaviors
- **Pattern:** Arrange, Act, Assert

## 6. Coding Standards

- **TypeScript:** No `any` types. Use `unknown` for unsafe types.

  **Pragmatic exceptions during large refactors:**

  - This repo prefers zero `any`, but large migrations and codemods sometimes introduce temporary `any` usage. That's acceptable only when all of the following are true:
    1. The `any` is limited in scope (single file or small helper) and cannot be trivially typed without a larger change.
    2. The `any` is annotated with a standard comment token: `// TODO(types): tighten` placed on the same line or immediately above the declaration.
    3. A follow-up issue or PR is created and linked in the commit message (or PR body) that tracks removing the `any` within 2 weeks.
  - Prefer `unknown`, `Record<string, unknown>`, or a narrowly-scoped union type over `any` whenever practical. Use helper assertion functions to convert `unknown` to typed values.
  - Example pattern for temporary `any`:
    ```ts
    // TODO(types): tighten - temporary `any` after automated codemod, tracked in a follow-up GitHub issue
    const payload: any = parseLegacy(input);
    ```

- **Error Handling:** All async functions must include `try/catch` or equivalent.
- **Imports:** Use absolute paths (`@/components/ui/Button`) not relative (`../../`).
- **Naming:** Components `PascalCase`, functions `camelCase`, types `PascalCase`.
- **Components:** Default to Server Components. Use `"use client"` only when needed.

## 7. Anti-Patterns to Avoid

- ❌ Direct MUI imports: `import { Button } from '@mui/material'`
- ❌ Using `sx` prop: `<Button sx={{ margin: 2 }}>`
- ❌ Custom CSS files or styled-components
- ❌ Relative imports: `../../../components/ui/Button`
- ❌ Using `any` type in TypeScript
  - If `any` is introduced during a migration, it must follow the Pragmatic exceptions rules above and be removed before the next minor release.
- ❌ Raw `fetch()` calls instead of `src/lib/api.ts`
- ❌ Feature code in global folders (`/src/lib/`, `/src/types/`)
- ❌ Cross-domain dependencies (extraction-rules importing from document-processing)
- ❌ Technical layer organization (all components in one folder, all hooks in another)
- ❌ Generic naming that doesn't reflect domain concepts
- ❌ Testing implementation details instead of user behavior
- ❌ Test files in separate `/tests/` folders instead of colocation

## 8. Quick Reference

### **Key Commands**

```bash
pnpm dev                    # Start development
pnpm lint                   # Test lint
pnpm test                   # Run unit tests
npx prisma studio           # Database management
npx prisma generate         # Generate Prisma client
npx prisma db push          # Push schema to Neon
```

### **Folder Promotion Rules**

1. Start private in component folder
2. Move to feature-level when used by 2+ components in same feature
3. Move to global (`/src/lib/` or `/src/types/`) when used by 2+ features
