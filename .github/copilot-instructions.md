# Copilot Instructions for Thoth - Document Processing Pipeline

> **📖 Documentation Guide:**
> - **This File**: Comprehensive development guidelines for AI-assisted coding
> - **README.md**: Project overview and setup guide for new contributors

## 1. Project Overview
This is a React/Next.js/Node.js document processing pipeline focused on extracting data from PO/Invoice documents through configurable extraction rules.

**Current State:** Legacy codebase under incremental refactoring. All touched files must be updated to current standards before adding new features.

**Project Goals:**
- Create robust document processing rules
- Maintain type safety and code quality
- Follow domain-driven architecture
- Ensure consistent UI/UX patterns

**Core Architecture Principle:** This project follows **Domain-Driven Design (DDD)** where code is organized by business domains rather than technical layers. Every new feature must align with this principle.

## 2. Tech Stack
| Category | Technology | Notes |
|----------|------------|-------|
| **Framework** | Next.js 15 (App Router) | Use App Router patterns, Server Components by default |
| **Language** | TypeScript | Strict mode enabled, no `any` types |
| **Database** | Neon (PostgreSQL) | Serverless PostgreSQL with Prisma ORM |
| **ORM** | Prisma | Type-safe database client with migrations |
| **UI Framework** | MUI (Material-UI) | Via custom wrappers only |
| **Styling** | Tailwind CSS | Utility-first, no custom CSS files |
| **State Management** | React Query + Zustand | Server state vs. client state |
| **HTTP Client** | Axios wrapper | Located at `src/lib/api.ts` |
| **Testing** | Jest + Playwright | Unit tests + E2E testing |

### Key Constraints
- **API Calls:** Always use `src/lib/api.ts` wrapper, never raw `fetch()`
- **UI Components:** Only import from `/src/components/ui/`, never directly from `@mui/material`
- **Styling:** Tailwind classes only, no `sx` prop or styled-components
- **Architecture:** All new code must follow domain-driven design principles - organize by business domain, not technical layer

## 3. Code Style Guide

### Component Development
```typescript
// ✅ Good - Custom UI component with Tailwind
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const UserForm = () => {
  return (
    <form className="space-y-4 p-6">
      <Input label="Name" className="w-full" />
      <Button variant="primary" className="mt-4">Submit</Button>
    </form>
  );
};

// ❌ Bad - Direct MUI import with sx prop
import { Button } from '@mui/material';
export const BadForm = () => (
  <Button sx={{ margin: 2 }}>Submit</Button>
);
```

### TypeScript Standards
```typescript
// ✅ Good - Proper typing
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

const fetchUser = async (id: string): Promise<UserProfile> => {
  try {
    return await apiClient.get(`/users/${id}`);
  } catch (error) {
    throw new Error(`Failed to fetch user: ${error}`);
  }
};

// ❌ Bad - Using any
const fetchUser = async (id: any): Promise<any> => {
  return await fetch(`/users/${id}`).then(r => r.json());
};
```

## 4. Project Structure & Architecture
This project follows **Domain-Driven Design (DDD)** principles where code is organized by business domains rather than technical layers. All new code must be organized this way.

### **Domain-Driven Design Principles**
- **Ubiquitous Language:** Use business terminology in code (e.g., "extraction rules," "document processing," "layout mapping")
- **Bounded Contexts:** Clear boundaries between domains (document processing vs. rule extraction vs. workspace)
- **Domain Services:** Business logic stays within domain folders, not in global utilities
- **Aggregates:** Related entities are grouped together within their domain

### **Current Structure (Target)**
```
src/
├── app/                    # Next.js App Router pages
├── components/
│   ├── ui/                 # Design System (✅ THE DEFINITIVE SOURCE)
│   │   ├── Button.tsx      # MUI wrappers with Tailwind
│   │   ├── Input.tsx       # All features MUST import from here
│   │   ├── Card.tsx
│   │   ├── Dialog.tsx
│   │   └── index.ts        # Barrel exports for clean imports
│   └── layout/             # App-level layout components
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── Navigation.tsx
├── features/               # Business Domains (DDD Bounded Contexts)
│   ├── document-processing/
│   │   ├── components/     # DocumentList, DocumentViewer, DropZone
│   │   ├── hooks/          # useDocumentUpload, useDocumentProcessing
│   │   ├── api/            # documentApi.ts
│   │   ├── types/          # document.ts (Domain entities)
│   │   ├── services/       # Domain business logic
│   │   ├── utils/          # Feature-level utilities (when shared by 2+ components)
│   │   └── index.ts        # Feature barrel export
│   ├── extraction-rules/
│   │   ├── components/     # RulesEditor, RulesList, FieldMapping
│   │   ├── hooks/          # useRuleValidation, useLayoutMap
│   │   ├── api/            # rulesApi.ts
│   │   ├── types/          # rules.ts (Domain entities)
│   │   ├── services/       # Rule validation, transformation logic
│   │   ├── utils/          # Feature-level utilities (when shared by 2+ components)
│   │   └── index.ts
│   └── workspace/
│       ├── components/     # WorkspaceLayout, ConnectionOverlay
│       ├── hooks/          # useWorkspace
│       ├── services/       # Workspace state management
│       ├── utils/          # Feature-level utilities (when shared by 2+ components)
│       └── index.ts
├── lib/                    # Global utilities (replaces utils/, services/)
│   ├── api.ts              # Axios client (REQUIRED for all API calls)
│   ├── utils.ts            # Global helpers
│   ├── constants.ts        # App-wide constants
│   ├── validations.ts      # Shared validation schemas
│   └── hooks/              # Global hooks (useLocalStorage, useDebounce)
├── providers/              # React Context providers (replaces context/)
│   ├── ThemeProvider.tsx
│   ├── QueryProvider.tsx
│   └── index.ts
├── types/                  # Global types only
│   ├── api.ts              # API response types
│   ├── common.ts           # Shared interfaces
│   └── index.ts
└── styles/                 # Global styles
    └── globals.css
```

### **Key Rules**
- **Feature Isolation:** Each feature is self-contained with its own components, API, hooks, and types
- **UI Components:** Always import from `/src/components/ui/` - never directly from `@mui/material`
- **Global vs Feature:** Only truly global code goes in `/src/lib/` and `/src/types/`
- **Barrel Exports:** Use `index.ts` files for clean imports: `import { DocumentList } from '@/features/document-processing'`
- **Domain Logic:** Business logic stays within domain boundaries, avoid cross-domain dependencies
- **Ubiquitous Language:** Use consistent business terminology across code, comments, and naming
- **Services vs Utils:** Use `/services/` for business logic, `/utils/` for pure helper functions within features

## 5. Domain Component Organization Best Practices

### **The Golden Rule: Colocation**
**Code that changes together should live together.** By default, keep everything private to your component. Only "promote" it to a shared location when it's actually reused.

### **Two Component Strategies**

#### **Strategy 1: Single-File Components** (UI Components)
For primitive UI components (`/src/components/ui/`), use a single-file approach:

```typescript
// src/components/ui/Button.tsx
import React from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';

// ✅ TYPES: Export props type from SAME file (public API)
export type ButtonProps = MuiButtonProps;

// ✅ UTILITIES: Small private helpers in SAME file
const getAnalyticsId = (variant: string) => {
  return `btn-variant-${variant || 'default'}`;
};

export const Button = (props: ButtonProps) => {
  // ✅ FUNCTIONS: Private logic inside component
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log('Button clicked');
    if (props.onClick) props.onClick(e);
  };

  return (
    <MuiButton
      onClick={handleClick}
      data-testid={getAnalyticsId(props.variant)}
      {...props}
    />
  );
};
```

#### **Strategy 2: Component Folders** (Feature Components)
For complex feature components, use a folder structure:

```
/src/features/extraction-rules/components/
└── RuleEditor/
    ├── index.ts              # Public API (only exports RuleEditor)
    ├── RuleEditor.tsx        # Main component
    ├── RuleConfigPanel.tsx   # Private sub-component
    ├── ValidationSummary.tsx # Private sub-component
    ├── types.ts             # Private types for this component
    └── helpers.ts           # Private utilities for this component
```

**Component Folder Files:**

```typescript
// index.ts - Public API
export { RuleEditor } from './RuleEditor';
// Note: Don't export private sub-components

// RuleEditor.tsx - Main component
import { RuleConfigPanel } from './RuleConfigPanel';    // Private import
import { ValidationSummary } from './ValidationSummary'; // Private import
import { formatRuleError } from './helpers';            // Private import
import { RuleEditorProps } from './types';              // Private import

export const RuleEditor = ({ rule }: RuleEditorProps) => {
  // Component logic here
  return (
    <div>
      <RuleConfigPanel rule={rule} />
      <ValidationSummary errors={formatRuleError(rule.errors)} />
    </div>
  );
};

// types.ts - Private types
export interface RuleEditorProps {
  rule: ExtractionRule;
  onSave: (rule: ExtractionRule) => void;
}

// helpers.ts - Private utilities
export const formatRuleError = (errors: string[]): string => {
  return errors.join(', ');
};
```

### **The "Promotion" Strategy**

#### **Rule 1: Feature-Level Promotion**
If a helper/type is needed by **2+ components within the same feature**:

```bash
# Move from component-private:
/src/features/extraction-rules/components/RuleEditor/helpers.ts

# To feature-level:
/src/features/extraction-rules/utils/ruleHelpers.ts
```

#### **Rule 2: Global Promotion**
If a component/utility is needed by **2+ different features**:

```bash
# Move from feature-specific:
/src/features/extraction-rules/components/ValidationSummary.tsx

# To global:
/src/components/ui/ValidationSummary.tsx
```

### **Types & Interfaces Strategy**

**Location Hierarchy:**
1. **Component-Private Types:** Keep in component folder when only used by that component
2. **Feature-Level Types:** Move to `/features/{domain}/types/` when used by 2+ components in same feature
3. **Global Types:** Only move to `/src/types/` when used across multiple features

**Component-Private Types** (`/features/{domain}/components/{Component}/types.ts`)
```typescript
// src/features/extraction-rules/components/RuleEditor/types.ts
export interface RuleEditorProps {
  rule: ExtractionRule;
  onSave: (rule: ExtractionRule) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface ValidationState {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
```

**Feature-Level Types** (`/features/{domain}/types/`)
```typescript
// src/features/extraction-rules/types/rule.ts - When used by 2+ components
export interface ExtractionRule {
  id: string;
  name: string;
  priority: number;
  anchorConfig?: AnchorConfig;
  validationRules: ValidationRule[];
}

// Domain value objects
export type MatchMode = 'exact' | 'startsWith' | 'contains' | 'endsWith';
export type RuleStatus = 'active' | 'draft' | 'disabled';
```

**Global Types** (`/src/types/`)
```typescript
// src/types/api.ts - Only truly cross-domain types
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}
```

### **Functions & Utilities Organization**

**Location Hierarchy:**
1. **Component-Private:** Keep in component folder when only used by that component
2. **Feature-Level Utils:** Move to `/features/{domain}/utils/` when used by 2+ components (pure helper functions)
3. **Feature-Level Services:** Use `/features/{domain}/services/` for business logic
4. **Global:** Only move to `/src/lib/` when used across multiple features

**Component-Private Utilities** (`/features/{domain}/components/{Component}/helpers.ts`)
```typescript
// src/features/extraction-rules/components/RuleEditor/helpers.ts
export const formatRuleError = (errors: string[]): string => {
  return errors.join(', ');
};

export const calculateEstimatedTime = (rule: ExtractionRule): number => {
  // Component-specific logic
  return rule.validationRules.length * 2;
};
```

**Feature-Level Utilities** (`/features/{domain}/utils/`)
```typescript
// src/features/extraction-rules/utils/ruleHelpers.ts - When used by 2+ components
export const formatRuleDisplayName = (rule: ExtractionRule): string => {
  return `${rule.name} (Priority: ${rule.priority})`;
};

export const isRuleActive = (rule: ExtractionRule): boolean => {
  return rule.status === 'active' && rule.validationRules.length > 0;
};
```

**Domain Services** (`/features/{domain}/services/`)
```typescript
// src/features/extraction-rules/services/ruleValidation.ts
export const validateRule = (rule: ExtractionRule): ValidationResult => {
  // Domain-specific business logic
  const errors: string[] = [];
  
  if (!rule.anchorConfig?.anchorText) {
    errors.push('Anchor text is required');
  }
  
  return { isValid: errors.length === 0, errors };
};
```

**Global Utilities** (`/src/lib/utils.ts`)
```typescript
// Only cross-domain utilities
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US').format(date);
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};
```

### **Component Interface Patterns**

**Feature Component Props**
```typescript
// Always use domain entities as props
interface DocumentViewerProps {
  document: ProcessedDocument;        // Domain entity
  onDocumentUpdate: (doc: ProcessedDocument) => void;
  extractionRules: ExtractionRule[];  // Domain entity
  viewMode: ViewMode;                 // Domain value object
}

// Avoid technical props when possible
interface BadDocumentViewerProps {
  documentId: string;                 // ❌ Requires component to fetch
  onUpdate: (data: any) => void;      // ❌ Unclear what data is
  config: Record<string, unknown>;    // ❌ Not domain-specific
}
```

**Service Function Signatures**
```typescript
// Domain services should work with domain entities
export const processDocument = async (
  document: RawDocument,
  rules: ExtractionRule[]
): Promise<ProcessedDocument> => {
  // Business logic here
};

// Return domain-specific results
export const validateExtractionRules = (
  rules: ExtractionRule[]
): RuleValidationResult => {
  return {
    validRules: rules.filter(isValidRule),
    invalidRules: rules.filter(rule => !isValidRule(rule)),
    warnings: generateWarnings(rules)
  };
};
```

### **Error Handling Strategy**

**Domain Errors** (`/features/{domain}/types/errors.ts`)
```typescript
export class RuleValidationError extends Error {
  constructor(
    public rule: ExtractionRule,
    public validationErrors: string[]
  ) {
    super(`Rule validation failed: ${validationErrors.join(', ')}`);
    this.name = 'RuleValidationError';
  }
}

export class DocumentProcessingError extends Error {
  constructor(
    public documentId: string,
    public stage: ProcessingStage,
    originalError: Error
  ) {
    super(`Document processing failed at ${stage}: ${originalError.message}`);
    this.name = 'DocumentProcessingError';
  }
}
```

**Error Handling in Services**
```typescript
export const processDocumentWithRules = async (
  document: RawDocument,
  rules: ExtractionRule[]
): Promise<ProcessedDocument> => {
  try {
    const validatedRules = validateExtractionRules(rules);
    if (validatedRules.invalidRules.length > 0) {
      throw new RuleValidationError(rules[0], validatedRules.invalidRules);
    }
    
    return await applyRulesToDocument(document, validatedRules.validRules);
  } catch (error) {
    if (error instanceof RuleValidationError) {
      throw error; // Re-throw domain errors
    }
    throw new DocumentProcessingError(document.id, 'rule-application', error);
  }
};
```

### **Barrel Export Strategy**

**Feature Index** (`/features/{domain}/index.ts`)
```typescript
// Export main domain entities and services
export type { ExtractionRule, AnchorConfig, ValidationResult } from './types';
export { validateRule, calculateRulePriority } from './services/ruleValidation';
export { RuleEditor, RulesList } from './components';
export { useRuleValidation, useRuleManager } from './hooks';

// Don't export internal utilities or implementation details
```

**Component Folder Index** (`/features/{domain}/components/index.ts`)
```typescript
export { RuleEditor } from './RuleEditor';
export { RulesList } from './RulesList';
export { FieldMapping } from './FieldMapping';

// Export component prop types for testing
export type { RuleEditorProps } from './RuleEditor';
export type { RulesListProps } from './RulesList';
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

## 8. Back-End Strategy (API Routes & Server Logic)

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

## 11. Common Tasks & Examples

### Creating a New Component
```typescript
// src/features/user-profile/components/UserCard.tsx
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';

interface UserCardProps {
  user: User;
  onEdit: () => void;
}

export const UserCard = ({ user, onEdit }: UserCardProps) => {
  return (
    <Card className="p-6 space-y-4">
      <Avatar src={user.avatar} alt={user.name} />
      <h3 className="text-lg font-semibold">{user.name}</h3>
      <Button onClick={onEdit} variant="secondary">
        Edit Profile
      </Button>
    </Card>
  );
};
```

### Making API Calls
```typescript
// src/features/user-profile/api/userApi.ts
import { apiClient } from '@/lib/api';
import { User } from '../types';

export const getUserProfile = async (id: string): Promise<User> => {
  try {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch user profile: ${error}`);
  }
};
```

### Neon Database Service Example
```typescript
// src/features/extraction-rules/api/ruleService.ts
import { db } from '@/lib/db';
import { ExtractionRule, CreateRuleInput } from '../types';

export const createExtractionRule = async (
  input: CreateRuleInput
): Promise<ExtractionRule> => {
  // Use Neon with Prisma for type-safe database operations
  const rule = await db.extractionRule.create({
    data: {
      name: input.name,
      documentType: input.documentType,
      priority: input.priority || 0,
      status: 'active',
    },
    include: {
      validationRules: true, // Include related data
    },
  });

  return rule;
};

// Leverage Neon's serverless features for optimized queries
export const getActiveRulesByType = async (
  documentType: string
): Promise<ExtractionRule[]> => {
  return await db.extractionRule.findMany({
    where: {
      documentType,
      status: 'active',
    },
    orderBy: {
      priority: 'asc',
    },
    include: {
      validationRules: {
        where: {
          isEnabled: true,
        },
      },
    },
  });
};
```

### Domain Service Example
```typescript
// src/features/extraction-rules/services/ruleValidationService.ts
import { ExtractionRule, ValidationResult } from '../types';

export const validateExtractionRule = (rule: ExtractionRule): ValidationResult => {
  // Domain-specific validation logic
  if (!rule.anchorText && !rule.regexPattern) {
    return { isValid: false, errors: ['Rule must have anchor text or regex pattern'] };
  }
  
  return { isValid: true, errors: [] };
};

export const calculateRulePriority = (rules: ExtractionRule[]): ExtractionRule[] => {
  // Domain logic for rule prioritization
  return rules.sort((a, b) => (a.priority || 0) - (b.priority || 0));
};
```

## 12. Migration Guidelines
When working with legacy code:
1. **Before adding new features:** Refactor the touched files to meet current standards
2. **Update imports:** Change direct MUI imports to our UI components
3. **Remove `sx` props:** Replace with Tailwind classes
4. **Add proper TypeScript:** Remove `any` types, add interfaces
5. **Move to proper folders:** Relocate code following domain-driven structure
6. **Apply Domain Language:** Use business terminology in variable/function names
7. **Extract Domain Services:** Move business logic from components to domain services

### **Step-by-Step Migration from Current Structure**

**Phase 1: Create Design System (Priority 1)**
```bash
# Move common components to ui folder
mkdir src/components/ui
mv src/components/common/* src/components/ui/
# Create barrel export
echo "export * from './Button';" > src/components/ui/index.ts
```

**Phase 2: Feature Extraction (Priority 2)**
```bash
# Extract document processing features
mkdir -p src/features/document-processing/{components,hooks,api,types,services,utils}
mv src/components/DocumentList.tsx src/features/document-processing/components/
mv src/components/DropZone.tsx src/features/document-processing/components/
mv src/components/Viewer.tsx src/features/document-processing/components/

# Extract rule extraction features  
mkdir -p src/features/extraction-rules/{components,hooks,api,types,services,utils}
mv src/components/Rules.tsx src/features/extraction-rules/components/
mv src/components/rules/* src/features/extraction-rules/components/
mv src/components/form/* src/features/extraction-rules/components/
```

**Phase 3: Consolidate Global Code (Priority 3)**
```bash
# Move legacy global utilities to lib (only shared across features)
# Feature-specific utilities stay in feature folders
mv src/utils/uniq.ts src/lib/  # Global utility
mv src/utils/numbers.ts src/lib/  # Global utility
# Keep feature-specific utils in their domains
mv src/utils/formUtils.ts src/features/extraction-rules/utils/
mv src/utils/ruleUtils.ts src/features/extraction-rules/utils/
mv src/utils/mappingRemap.ts src/features/document-processing/utils/

# Move services to appropriate domains
mv src/services/extractionEngine.ts src/features/extraction-rules/services/
mv src/context/* src/providers/
rmdir src/context
```

**Phase 4: Type Organization (Priority 4)**
```bash
# Separate global vs feature types
mv src/types/extractionRules.ts src/features/extraction-rules/types/
mv src/types/PurchaseOrder.ts src/features/document-processing/types/
# Keep only truly global types in src/types/
```