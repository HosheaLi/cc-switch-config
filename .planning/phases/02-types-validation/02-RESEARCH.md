# Phase 02: Types & Validation - Research

**Researched:** 2026-04-13
**Domain:** TypeScript type system, Zod schema validation, config merge algorithms
**Confidence:** HIGH

## Summary

This phase establishes the type system foundation for CCAPISwitch. Zod 4.x provides excellent TypeScript integration with `z.infer<>` for type inference from schemas, eliminating duplicate type definitions. The key API changes from Zod 3 include `strict()` for rejecting unknown keys (instead of deprecated `noUnknown()`), and new error formatting utilities like `prettifyError()` for user-friendly messages.

Deep merge for config layering follows standard patterns: recursive merge for objects, replacement for arrays. The three-layer priority (user < project < local) requires careful merge order to ensure higher priority values overwrite lower ones.

**Primary recommendation:** Define all types via Zod schemas, infer TypeScript types with `z.infer<>`, implement deep merge with array replacement strategy, use `prettifyError()` for validation failures.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Zod schema as single source of truth — TypeScript types inferred from Zod schema (`z.infer<>`)
  - **Why:** Reduce duplicate definitions, types auto-sync, Zod official pattern
  - **How:** All type definitions in Zod schema, TypeScript interfaces via `type X = z.infer<typeof XSchema>`

- **D-02:** Complete Claude Code config schema — Cover all config fields
  - **Why:** Ensure complete validation, prevent invalid fields
  - **How:** Define complete settings.json schema including env, model, mcpServers, permissions, hooks

- **D-03:** Validate on load — Execute schema validation after readJSON
  - **Why:** Highest security, reject invalid configs
  - **How:** Config load flow: readJSON → parse → validate → return valid config or throw ValidationError

- **D-04:** Deep merge for nested objects — (mcpServers, permissions) merge layer by layer
  - **Why:** Suitable for config inheritance, preserve nested configs at each layer
  - **How:** Implement deep merge algorithm, handle array and object merge strategies

- **D-05:** Collect all validation errors — Return complete error list
  - **Why:** Users fix all issues at once, reduce iterations
  - **How:** Zod `.safeParse()` returns all errors, format into user-friendly messages

- **D-06:** Three-layer priority — user < project < local
  - **Why:** Match Claude Code cascade semantics, complete config inheritance support
  - **How:** Define ConfigLayer type, merge by priority order

- **D-07:** No JSON Schema export — Only use Zod schema in code
  - **Why:** No external tool needs currently, keep simple
  - **How:** If future needs, use `zod-to-json-schema` export

- **D-08:** Centralized module — `src/lib/types/` directory for all types
  - **Why:** Types centralized, easy to find and maintain
  - **How:** `src/lib/types/index.ts` exports all types, each major type separate file

- **D-09:** Detailed API types — Include name, baseUrl, auth type
  - **Why:** Provider template feature needs complete API config structure
  - **How:** Define ApiProviderConfig schema (name, baseUrl, authType, headers)

### Claude's Discretion

- Type naming style (camelCase/PascalCase) — Follow TypeScript conventions
- Schema fine-grained split strategy — Split by config domain (base schema + feature schemas)
- Default value definition location — Can be in schema or DEFAULT_CONFIG constant

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zod | 4.3.6 | Schema validation, type inference | Industry standard, TypeScript-first, excellent inference |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| TypeScript | 6.0.2 | Type system | All modules, `z.infer<>` integration |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| zod | ajv + JSON Schema | JSON Schema has weaker TypeScript inference, manual type definitions needed |
| zod | yup | yup has less type inference capability, larger bundle size |
| zod | io-ts | io-ts uses fp-ts, functional paradigm less familiar |

**Installation:**
```bash
# Already installed in Phase 01
npm install zod@4.3.6
```

**Version verification:**
```bash
npm view zod version
# "4.3.6" - verified 2026-04-13
```

## Architecture Patterns

### Recommended Project Structure
```
src/lib/types/
├── index.ts           # Barrel export, exports all types
├── config.ts          # Claude Code config schema (settings.json)
├── provider.ts        # API provider schema (templates)
├── project.ts         # Project config schema
├── validation.ts      # Validation utilities and error formatting
└── merge.ts           # Config merge algorithms
```

### Pattern 1: Zod Schema → TypeScript Type Inference
**What:** Define Zod schema once, infer TypeScript type with `z.infer<>`
**When to use:** All type definitions to avoid duplicate declarations
**Example:**
```typescript
// Source: Zod 4 official API
import { z } from 'zod';

// Define schema (single source of truth)
const EnvConfigSchema = z.object({
  ANTHROPIC_MODEL: z.string().optional(),
  ANTHROPIC_BASE_URL: z.string().url().optional(),
  ANTHROPIC_AUTH_TOKEN: z.string().optional(),
});

// Infer TypeScript type (no duplicate definition)
type EnvConfig = z.infer<typeof EnvConfigSchema>;

// Use in code
function getEnvConfig(): EnvConfig {
  // TypeScript knows exact structure
}
```

### Pattern 2: Strict Object Validation
**What:** Use `strict()` to reject unknown properties
**When to use:** Config validation to catch typos and invalid fields
**Example:**
```typescript
// Source: Zod 4 API (node_modules/zod/src/v4/classic/schemas.ts)
import { z } from 'zod';

const SettingsSchema = z.object({
  env: z.record(z.string()).optional(),
  model: z.string().optional(),
}).strict();  // Rejects unknown keys

// Invalid config with typo
const invalidConfig = { env: {}, modle: 'claude-3' }; // typo: modle
const result = SettingsSchema.safeParse(invalidConfig);

if (!result.success) {
  // result.error.issues contains $ZodIssueUnrecognizedKeys
  // issue.keys = ['modle'] - tells user which keys are wrong
}
```

### Pattern 3: Error Formatting for User Messages
**What:** Use `prettifyError()` for user-friendly multi-line messages
**When to use:** Displaying validation errors to users
**Example:**
```typescript
// Source: Zod 4 core errors.ts
import { z, prettifyError } from 'zod';

const result = schema.safeParse(config);
if (!result.success) {
  // prettifyError creates:
  // "✖ Invalid input: expected string, received undefined"
  // "  → at env.ANTHROPIC_MODEL"
  const message = prettifyError(result);
  console.error(message);
}
```

### Pattern 4: Deep Merge Algorithm
**What:** Recursive merge for objects, replacement for arrays
**When to use:** Merging config layers (user → project → local)
**Example:**
```typescript
// Standard deep merge pattern for config objects
function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target } as T;

  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = result[key];

    if (
      sourceValue !== undefined &&
      sourceValue !== null &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue !== undefined &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      // Deep merge nested objects
      result[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      ) as T[Extract<keyof T, string>];
    } else {
      // Replace for arrays and primitives (higher priority wins)
      result[key] = sourceValue as T[Extract<keyof T, string>];
    }
  }

  return result;
}
```

### Pattern 5: Config Layer Merge
**What:** Merge configs in priority order (lower → higher)
**When to use:** Combining user/project/local configs
**Example:**
```typescript
// Three-layer config merge: user < project < local
type ConfigLayer = 'user' | 'project' | 'local';

interface LayeredConfig {
  user?: ClaudeConfig;
  project?: ClaudeConfig;
  local?: ClaudeConfig;
}

function mergeConfigs(layers: LayeredConfig): ClaudeConfig {
  // Start with default config
  let merged = DEFAULT_CONFIG;

  // Merge in priority order (lowest to highest)
  if (layers.user) {
    merged = deepMerge(merged, layers.user);
  }
  if (layers.project) {
    merged = deepMerge(merged, layers.project);
  }
  if (layers.local) {
    merged = deepMerge(merged, layers.local);
  }

  return merged;
}
```

### Anti-Patterns to Avoid

- **Duplicate type definitions:** Don't define TypeScript interface AND Zod schema separately — use `z.infer<>`
- **Using `noUnknown()` in Zod 4:** Deprecated, use `.strict()` instead
- **Array merging:** Don't concatenate arrays — use replacement strategy (higher priority wins)
- **Silent validation failures:** Don't catch ZodError and continue — invalid configs cause data loss

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Type inference | Manual TypeScript interfaces | `z.infer<typeof Schema>` | Auto-sync, less code |
| Error formatting | Custom error message builder | `z.prettifyError()` | Handles all Zod issue types |
| Object strictness | Custom unknown key detection | `z.object({...}).strict()` | Built-in, correct behavior |
| Config flattening | Manual error grouping | `z.flattenError()` | Groups by field automatically |

**Key insight:** Zod 4 provides comprehensive error utilities. Custom error formatting is unnecessary complexity.

## Common Pitfalls

### Pitfall 1: Zod 3 vs Zod 4 API Differences
**What goes wrong:** Using `noUnknown()` (Zod 3) which doesn't exist in Zod 4
**Why it happens:** Documentation may reference Zod 3 APIs
**How to avoid:** Use `.strict()` for strict validation, `.strip()` for stripping unknown keys
**Warning signs:** TypeScript error "Property 'noUnknown' does not exist"

### Pitfall 2: Array Merge vs Replace
**What goes wrong:** Config arrays merge unexpectedly (concatenation)
**Why it happens:** Deep merge treats arrays as objects by default
**How to avoid:** Explicitly check `Array.isArray()` and use replacement strategy
**Warning signs:** mcpServers list doubles after merge instead of being overwritten

### Pitfall 3: Missing z.infer for Optional Fields
**What goes wrong:** Type inference includes `| undefined` for `.optional()` but code assumes required
**Why it happens:** Zod correctly models optional as `T | undefined`
**How to avoid:** Use `.required()` when needed, or handle undefined explicitly
**Warning signs:** TypeScript errors about possibly undefined values

### Pitfall 4: Transform Types Diverge
**What goes wrong:** Input and output types differ after `.transform()`, `z.infer` gives output type
**Why it happens:** Transform changes the type, input remains original
**How to avoid:** Use `z.input<typeof schema>` for input type, `z.output<typeof schema>` for output
**Warning signs:** Type mismatch when passing raw config to transform schema

### Pitfall 5: Validation Error Path Encoding
**What goes wrong:** Error path shows `[0]` instead of expected key name
**Why it happens:** Array indices encoded as numbers, object keys as strings
**How to avoid:** Use `prettifyError()` which formats paths correctly (`.items[0].name`)
**Warning signs:** Users can't locate error position from raw path array

## Code Examples

### Complete Claude Config Schema
```typescript
// Source: Based on Claude Code settings.json structure
import { z } from 'zod';

// MCP Server configuration
const McpServerConfigSchema = z.object({
  command: z.string(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
  disabled: z.boolean().optional(),
}).strict();

// Permission rule
const PermissionRuleSchema = z.object({
  allow: z.string().optional(),
  deny: z.string().optional(),
}).strict();

// Hook configuration
const HookConfigSchema = z.object({
  match: z.string(),
  run: z.string(),
  timeout: z.number().optional(),
}).strict();

// Full settings.json schema
const ClaudeSettingsSchema = z.object({
  env: z.record(z.string(), z.string()).optional(),
  model: z.string().optional(),
  mcpServers: z.record(z.string(), McpServerConfigSchema).optional(),
  permissions: z.array(PermissionRuleSchema).optional(),
  hooks: z.array(HookConfigSchema).optional(),
}).strict();

// Infer TypeScript type
type ClaudeSettings = z.infer<typeof ClaudeSettingsSchema>;
```

### Validation with User-Friendly Errors
```typescript
// Source: Zod 4 error utilities
import { z, prettifyError } from 'zod';

/**
 * Validate config and return user-friendly error message
 */
export function validateConfig(config: unknown): ClaudeSettings {
  const result = ClaudeSettingsSchema.safeParse(config);

  if (!result.success) {
    // Format all errors into readable message
    const message = prettifyError(result);
    throw new ValidationError(message, result.error.issues);
  }

  return result.data;
}

/**
 * Custom error class with structured issues
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly issues: z.core.$ZodIssue[]
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

### Deep Merge with Array Replacement
```typescript
// Standard pattern for config merging
export function deepMergeConfig<T extends Record<string, unknown>>(
  base: T,
  override: Partial<T>
): T {
  const result = { ...base } as T;

  for (const key in override) {
    if (override[key] === undefined) continue;

    const baseValue = base[key];
    const overrideValue = override[key];

    // Arrays: replace (not concatenate)
    if (Array.isArray(overrideValue)) {
      result[key] = overrideValue as T[Extract<keyof T, string>];
      continue;
    }

    // Objects: deep merge recursively
    if (
      typeof overrideValue === 'object' &&
      overrideValue !== null &&
      typeof baseValue === 'object' &&
      baseValue !== null &&
      !Array.isArray(baseValue)
    ) {
      result[key] = deepMergeConfig(
        baseValue as Record<string, unknown>,
        overrideValue as Record<string, unknown>
      ) as T[Extract<keyof T, string>];
      continue;
    }

    // Primitives: replace
    result[key] = overrideValue as T[Extract<keyof T, string>];
  }

  return result;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual interface + separate validator | Zod schema + `z.infer` | Zod 3 (2022) | Single source of truth |
| `noUnknown()` for strict objects | `.strict()` method | Zod 4 (2024) | Cleaner API |
| Custom error formatting | `prettifyError()` utility | Zod 4 (2024) | Consistent formatting |
| `error.format()` | `treeifyError()` | Zod 4 (2024) | Better type inference |
| `error.flatten()` | `flattenError()` | Zod 4 (2024) | Simplified API |

**Deprecated/outdated:**
- `noUnknown()`: Use `.strict()` instead (Zod 4)
- `error.format()`: Use `z.treeifyError(error)` instead
- `error.flatten()`: Use `z.flattenError(error)` instead
- `_def`: Use `.def` property instead (Zod 4)

## Open Questions

1. **Default value placement**
   - What we know: Can be in schema `.default()` or DEFAULT_CONFIG constant
   - What's unclear: Which is cleaner for layered configs
   - Recommendation: Use DEFAULT_CONFIG constant for base defaults, `.default()` for field-level defaults

2. **Partial schema for config layers**
   - What we know: Each layer may have subset of fields
   - What's unclear: Should we define separate PartialSchema for each layer
   - Recommendation: Use `ClaudeSettingsSchema.partial()` for layer validation, full schema for merged result

## Environment Availability

> SKIPPED — Phase has no external dependencies beyond already-installed Zod 4.3.6

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| zod | Schema validation | ✓ | 4.3.6 | — |
| TypeScript | Type inference | ✓ | 6.0.2 | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 3.2.4 |
| Config file | vitest.config.ts (implicit from package.json) |
| Quick run command | `npm run test` |
| Full suite command | `npm run test:coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| M2 | Type coverage, no `any` | unit | `vitest run src/lib/types/*.test.ts` | ❌ Wave 0 |
| F11 | Config validation (syntax + semantic) | unit | `vitest run src/lib/types/validation.test.ts` | ❌ Wave 0 |
| M4 | Module separation | integration | File structure check | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test` (105 tests, ~300ms)
- **Per wave merge:** `npm run test:coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/types/config.ts` — Claude settings schema
- [ ] `src/lib/types/config.test.ts` — Schema validation tests
- [ ] `src/lib/types/provider.ts` — API provider schema
- [ ] `src/lib/types/provider.test.ts` — Provider validation tests
- [ ] `src/lib/types/merge.ts` — Deep merge algorithm
- [ ] `src/lib/types/merge.test.ts` — Merge behavior tests
- [ ] `src/lib/types/validation.ts` — Validation utilities
- [ ] `src/lib/types/validation.test.ts` — Error formatting tests
- [ ] `src/lib/types/index.ts` — Barrel export

*(No existing test infrastructure for types module — all Wave 0)*

## Sources

### Primary (HIGH confidence)
- Zod 4 source code (node_modules/zod/src/v4/) — Verified API structure
- Zod package.json — Confirmed version 4.3.6
- Zod tests (node_modules/zod/src/v4/classic/tests/) — Verified API usage patterns

### Secondary (MEDIUM confidence)
- Zod README (node_modules/zod/README.md) — Basic usage patterns
- Web search results for deep merge patterns — Standard algorithm confirmed

### Tertiary (LOW confidence)
- Web search results — Limited due to web fetch failures, verified via source code instead

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Zod 4.3.6 verified in package.json, API verified in source
- Architecture: HIGH — Patterns verified in Zod source tests, standard deep merge algorithm
- Pitfalls: HIGH — Zod 4 API differences confirmed in source, deprecation notices in type definitions

**Research date:** 2026-04-13
**Valid until:** 30 days (Zod API stable, standard patterns)