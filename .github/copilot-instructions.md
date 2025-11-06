# Copilot Instructions for Thoth - Document Processing Pipeline

> **📖 This File**: Essential development guidelines for AI-assisted coding  
> **README.md**: Project setup guide for contributors

## 1. Project Overview
React/Next.js document processing pipeline for extracting data from PO/Invoice documents through configurable extraction rules.

**Current State:** Legacy codebase under incremental refactoring. All touched files must be updated to current standards.

**Core Principle:** **Domain-Driven Design (DDD)** - organize by business domains, not technical layers.

## 2. Tech Stack & Constraints
| Technology | Notes |
|------------|-------|
| **Next.js 15** | App Router, Server Components by default |
| **TypeScript** | Strict mode, no `any` types |
| **Neon PostgreSQL** | With Prisma ORM |
| **MUI + Tailwind** | Custom wrappers only, no `sx` prop |
| **React Query + Zustand** | Server vs client state |

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
├── index.ts              # Public API
├── RuleEditor.tsx        # Main component
├── types.ts             # Private types
└── helpers.ts           # Private utilities
```

## 5. Testing Strategy

### **File Location (Colocation)**
All test files (`.test.tsx` or `.spec.tsx`) MUST live in the same folder as the code they are testing.

```
src/components/ui/Button.test.tsx              # For UI components
src/features/.../UserProfileCard/UserProfileCard.test.tsx  # For feature components  
src/lib/utils.test.ts                          # For utilities
```

**E2E Tests:** End-to-end tests (Playwright, Cypress) are the only exception and live in a top-level `/playwright` folder.

### **Testing Philosophy**
- **Primary Goal:** We test user behavior, not implementation details
- **Tool:** Use React Testing Library (`@testing-library/react`)
- **Pattern:** Follow the "Arrange, Act, Assert" pattern for all tests
- **Focus:** Prioritize Integration Tests (L2) for feature components. Unit tests (L1) are for pure logic (e.g., in `utils.ts`)
- **AI Usage:** Use the `/tests` command to generate test boilerplate, then review it to ensure it tests the correct user behaviors

### **Test Types by Layer**
```typescript
// ✅ Unit Tests (L1) - Pure logic
// src/lib/utils.test.ts
describe('formatCurrency', () => {
  it('should format number as USD currency', () => {
    // Arrange
    const amount = 1234.56;
    
    // Act
    const result = formatCurrency(amount);
    
    // Assert
    expect(result).toBe('$1,234.56');
  });
});

// ✅ Integration Tests (L2) - Feature components with user interactions
// src/features/extraction-rules/components/RuleEditor/RuleEditor.test.tsx
describe('RuleEditor', () => {
  it('should save rule when user clicks save button', async () => {
    // Arrange
    const mockSave = jest.fn();
    const rule = createMockRule();
    render(<RuleEditor rule={rule} onSave={mockSave} />);
    
    // Act
    await user.type(screen.getByLabelText(/rule name/i), 'New Rule');
    await user.click(screen.getByRole('button', { name: /save/i }));
    
    // Assert
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New Rule' })
    );
  });
});

// ✅ E2E Tests (L3) - User workflows
// playwright/document-processing.spec.ts
test('user can upload document and create extraction rule', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('upload-button').click();
  await page.setInputFiles('input[type="file"]', 'test-document.pdf');
  await expect(page.getByText('Document uploaded')).toBeVisible();
});
```

## 6. Back-End Strategy (API Routes & Server Logic)

Our back-end uses Next.js API Routes with the **"Thin API"** pattern.

### **A. Thin API Routes**
API Route files in `src/app/api/**` **MUST** be "thin" entry points:

```typescript
// ✅ Good - Thin API route
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createRuleSchema.parse(body);
    const rule = await createExtractionRule(validatedData);
    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 });
  }
}
```

### **B. Service Layer**
All business logic **MUST** live in feature folders under `/api/`:

```typescript
// src/features/extraction-rules/api/ruleService.ts
export const createExtractionRule = async (input: CreateRuleInput): Promise<ExtractionRule> => {
  const validationResult = validateRuleConstraints(input);
  if (!validationResult.isValid) {
    throw new Error(`Invalid rule: ${validationResult.errors.join(', ')}`);
  }

  return await db.extractionRule.create({
    data: { ...input, priority: input.priority || calculateDefaultPriority() },
  });
};
```

### **C. Database Access (Neon + Prisma)**
```typescript
// src/lib/db.ts
export const db = globalForPrisma.prisma ?? new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

// Environment setup
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/db?sslmode=require"
DIRECT_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/db?sslmode=require"
```

### **D. Data Validation**
```typescript
// src/features/extraction-rules/api/schemas.ts
export const createRuleSchema = z.object({
  name: z.string().min(1).max(100),
  documentType: z.enum(['BC', 'MP', 'POS', 'DEMO']),
  anchorText: z.string().optional(),
  regexPattern: z.string().optional(),
}).refine(data => data.anchorText || data.regexPattern);

export type CreateRuleInput = z.infer<typeof createRuleSchema>;
```

## 7. Coding Standards
- **TypeScript:** No `any` types. Use `unknown` for unsafe types.
- **Error Handling:** All async functions must include `try/catch` or equivalent.
- **Imports:** Use absolute paths (`@/components/ui/Button`) not relative (`../../`).
- **Naming:** Components `PascalCase`, functions `camelCase`, types `PascalCase`.
- **Components:** Default to Server Components. Use `"use client"` only when needed.

## 8. Anti-Patterns to Avoid
- ❌ Direct MUI imports: `import { Button } from '@mui/material'`
- ❌ Using `sx` prop: `<Button sx={{ margin: 2 }}>`
- ❌ Custom CSS files or styled-components
- ❌ Relative imports: `../../../components/ui/Button`
- ❌ Using `any` type in TypeScript
- ❌ Raw `fetch()` calls instead of `src/lib/api.ts`
- ❌ Feature code in global folders (`/src/lib/`, `/src/types/`)
- ❌ Cross-domain dependencies
- ❌ Testing implementation details instead of user behavior
- ❌ Test files in separate `/tests/` folders instead of colocation

## 9. Quick Reference

### **Essential File Locations**
- UI Components: `/src/components/ui/` (import from here only)
- Feature Code: `/src/features/{domain}/` (components, hooks, api, types, services, utils)
- Global Utils: `/src/lib/` (only cross-domain utilities)
- Database: `/src/lib/db.ts` (shared Neon + Prisma client)
- API Routes: `/src/app/api/` (thin wrappers only)

### **Key Commands**
```bash
pnpm dev                    # Start development
npx prisma studio          # Database management
npx prisma generate         # Generate Prisma client
npx prisma db push          # Push schema to Neon
```

### **Component Import Pattern**
```typescript
// ✅ Always use these imports
import { Button, Input, Card } from '@/components/ui';
import { ExtractionRule } from '@/features/extraction-rules/types';
import { createRule } from '@/features/extraction-rules/api/ruleService';

// ❌ Never use these
import { Button } from '@mui/material';
import { ExtractionRule } from '../../../types/rules';
```

### **Folder Promotion Rules**
1. Start private in component folder
2. Move to feature-level when used by 2+ components in same feature
3. Move to global (`/src/lib/` or `/src/types/`) when used by 2+ features

### **Testing Strategy**
- **Colocation:** Tests live next to source files
- **Focus:** User behavior over implementation details  
- **Tools:** React Testing Library + Playwright for E2E
- **Pattern:** Arrange, Act, Assert

Our back-end uses Next.js API Routes with the **"Thin API"** or **"Service Layer"** pattern.

### **A. Thin API Routes**
API Route files in `src/app/api/**` **MUST** be "thin" entry points with minimal responsibility:

```typescript
// ✅ Good - Thin API route
// src/app/api/extraction-rules/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createExtractionRule } from '@/features/extraction-rules/api/ruleService';
import { createRuleSchema } from '@/features/extraction-rules/api/schemas';

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request
    const body = await request.json();
    const validatedData = createRuleSchema.parse(body);
    
    // 2. Call service function
    const rule = await createExtractionRule(validatedData);
    
    // 3. Return response
    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create rule' },
      { status: 500 }
    );
  }
}

// ❌ Bad - Business logic in API route
export async function POST(request: NextRequest) {
  const body = await request.json();
  // Database calls, validation, business logic here...
  const result = await db.rule.create({ data: body });
  return NextResponse.json(result);
}
```

**API Route Responsibilities:**
1. Parse incoming request (params, body, headers)
2. Call service/handler function from relevant feature folder
3. Catch errors and return appropriate `NextResponse`
4. **NO business logic, database calls, or complex calculations**

### **B. Business Logic (Service Layer)**
All business logic **MUST** live in feature folders under `/api/` subdirectories:

```typescript
// ✅ Service Layer - Feature-specific business logic
// src/features/extraction-rules/api/ruleService.ts
import { db } from '@/lib/db';
import { ExtractionRule, CreateRuleInput } from '../types';
import { validateRuleConstraints } from '../services/ruleValidation';

export const createExtractionRule = async (
  input: CreateRuleInput
): Promise<ExtractionRule> => {
  // Domain-specific validation
  const validationResult = validateRuleConstraints(input);
  if (!validationResult.isValid) {
    throw new Error(`Invalid rule: ${validationResult.errors.join(', ')}`);
  }

  // Database operation
  const rule = await db.extractionRule.create({
    data: {
      ...input,
      priority: input.priority || calculateDefaultPriority(),
    },
  });

  return rule;
};

// ✅ Headless functions - No knowledge of HTTP
export const getRulesByDocument = async (
  documentType: string
): Promise<ExtractionRule[]> => {
  return await db.extractionRule.findMany({
    where: { documentType, status: 'active' },
    orderBy: { priority: 'asc' },
  });
};
```

**Service Layer Benefits:**
- **Headless:** No knowledge of `NextRequest`/`NextResponse`
- **Testable:** Easy to unit test without HTTP concerns
- **Reusable:** Can be called from other services or background jobs
- **Domain-focused:** Encapsulates business rules and domain logic

### **C. Data Validation**
All incoming data **MUST** be validated using `zod` schemas:

```typescript
// src/features/extraction-rules/api/schemas.ts
import { z } from 'zod';

export const createRuleSchema = z.object({
  name: z.string().min(1).max(100),
  documentType: z.enum(['BC', 'MP', 'POS', 'DEMO']),
  anchorText: z.string().optional(),
  regexPattern: z.string().optional(),
  priority: z.number().int().min(0).max(100).optional(),
}).refine(
  (data) => data.anchorText || data.regexPattern,
  { message: 'Either anchorText or regexPattern is required' }
);

export const updateRuleSchema = createRuleSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateRuleInput = z.infer<typeof createRuleSchema>;
export type UpdateRuleInput = z.infer<typeof updateRuleSchema>;
```

**Validation Strategy:**
- Define schemas in feature folders: `/features/{domain}/api/schemas.ts`
- Use schema inference for TypeScript types: `z.infer<typeof schema>`
- Add custom validation rules using `.refine()` for business constraints
- Validate in API routes before calling service functions

### **D. Database Access**
All database access should be centralized and consistent using **Neon (PostgreSQL)** with **Prisma ORM**:

```typescript
// src/lib/db.ts - Shared Neon database client
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL, // Neon connection string
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

// src/features/extraction-rules/api/ruleRepository.ts - Data access layer
import { db } from '@/lib/db';
import { ExtractionRule, Prisma } from '@prisma/client';

export const ruleRepository = {
  async findByDocumentType(documentType: string): Promise<ExtractionRule[]> {
    return await db.extractionRule.findMany({
      where: { documentType },
      include: { validationRules: true },
    });
  },

  async createWithValidation(
    data: Prisma.ExtractionRuleCreateInput
  ): Promise<ExtractionRule> {
    return await db.extractionRule.create({
      data,
      include: { validationRules: true },
    });
  },

  // Neon-optimized queries with connection pooling
  async findActiveRulesOptimized(documentType: string): Promise<ExtractionRule[]> {
    return await db.$queryRaw`
      SELECT * FROM "ExtractionRule" 
      WHERE "documentType" = ${documentType} 
      AND "status" = 'active'
      ORDER BY "priority" ASC
    `;
  },
};
```

**Neon Database Guidelines:**
- Use single shared Prisma client from `/src/lib/db.ts`
- Leverage Neon's serverless PostgreSQL features (auto-scaling, branching)
- Create repository pattern for complex queries
- Handle database operations in service layer, not API routes
- Use TypeScript types generated from Prisma schema
- Optimize for Neon's connection pooling with `@prisma/adapter-neon`

**Environment Configuration:**
```env
# .env.local
DATABASE_URL="postgresql://username:password@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://username:password@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

**Prisma Schema Setup for Neon:**
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model ExtractionRule {
  id           String   @id @default(cuid())
  name         String
  documentType String
  status       String   @default("active")
  priority     Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  validationRules ValidationRule[]
  
  @@map("ExtractionRule")
}
```

### **E. Authentication & Authorization**
All protected routes must implement authentication/authorization:

```typescript
// src/lib/auth.ts - Authentication utilities
import { NextRequest } from 'next/server';
import { verify } from 'jsonwebtoken';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

export const authenticateRequest = async (
  request: NextRequest
): Promise<AuthenticatedUser> => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('No authentication token provided');
  }

  try {
    const payload = verify(token, process.env.JWT_SECRET!) as AuthenticatedUser;
    return payload;
  } catch (error) {
    throw new Error('Invalid authentication token');
  }
};

// src/features/extraction-rules/api/ruleService.ts - Authorization in service
export const deleteExtractionRule = async (
  ruleId: string,
  user: AuthenticatedUser
): Promise<void> => {
  // Authorization check
  if (user.role !== 'admin') {
    throw new Error('Insufficient permissions to delete rules');
  }

  // Business logic
  const rule = await db.extractionRule.findUnique({ where: { id: ruleId } });
  if (!rule) {
    throw new Error('Rule not found');
  }

  await db.extractionRule.delete({ where: { id: ruleId } });
};

// API Route with authentication
// src/app/api/extraction-rules/[id]/route.ts
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request);
    await deleteExtractionRule(params.id, user);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message.includes('permissions') ? 403 : 401 }
    );
  }
}
```

**Authentication Guidelines:**
- Check authentication at the **start** of protected API routes
- Pass authenticated user to service functions for authorization
- Handle authorization logic in service layer, not API routes
- Return appropriate HTTP status codes (401 for auth, 403 for authorization)

### **F. Error Handling Strategy**

```typescript
// src/lib/errors.ts - Custom error types
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`);
    this.name = 'NotFoundError';
  }
}

// API Route with proper error handling
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    const body = await request.json();
    const validatedData = createRuleSchema.parse(body);
    
    const rule = await createExtractionRule(validatedData, user);
    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    
    // Unexpected errors
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## 9. General Coding Standards
- **TypeScript:** **Do NOT use `any`**. Use `unknown` for unsafe types or define an interface.
- **Error Handling:** All async functions, API calls, and data-fetching hooks MUST include `try/catch` blocks or equivalent error handling (e.g., `react-query`'s `isError` state).
- **Imports:** Always use absolute path aliases (`@/components/ui/Button`) instead of relative paths (`../../components/ui/Button`).
- **Naming:**
    - Components: `PascalCase` (e.g., `UserProfileCard.tsx`)
    - Functions/Variables: `camelCase` (e.g., `getUserProfile`)
    - Types: `PascalCase` (e.g., `interface IUserProfile`)
- **Components:** Default to Server Components. Only use `"use client"` when interactivity or React hooks are required.

## 10. Anti-Patterns to Avoid
- ❌ Direct MUI imports: `import { Button } from '@mui/material'`
- ❌ Using `sx` prop: `<Button sx={{ margin: 2 }}>`
- ❌ Custom CSS files or styled-components
- ❌ Relative imports: `../../../components/ui/Button`
- ❌ Using `any` type in TypeScript
- ❌ Raw `fetch()` calls instead of `src/lib/api.ts`
- ❌ Feature code in global folders (`/src/lib/`, `/src/types/`)
- ❌ Cross-domain dependencies (extraction-rules importing from document-processing)
- ❌ Technical layer organization (all components in one folder, all hooks in another)
- ❌ Generic naming that doesn't reflect domain concepts
- ❌ Testing implementation details instead of user behavior
- ❌ Test files in separate `/tests/` folders instead of colocation