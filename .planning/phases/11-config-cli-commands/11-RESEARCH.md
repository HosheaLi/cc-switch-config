# Phase 11: Config CLI Commands - Research

**Researched:** 2026-04-30
**Domain:** CLI command implementation, secure input handling, validation error display
**Confidence:** HIGH
**Security-sensitive:** true (API key handling, password input, validation)

## Summary

Phase 11 implements CLI commands for API configuration management: `cc-config config add/list/remove`. The implementation follows established patterns from `template.ts`, reuses Phase 10's ApiService/ApiConfigStore, and integrates the existing `inputFullApiConfig()` component with password-type input. Key challenges include displaying validation errors in a user-friendly grouped format, implementing the `--force` confirmation skip for remove, and marking the existing `config-wizard.ts` as deprecated without breaking functionality.

**Primary recommendation:** Reuse the established `registerXxxCommand` pattern from template.ts, leverage the complete ApiService CRUD API, and implement grouped validation error display using chalk colors for clear user feedback.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**CLI 命令结构:**
- **D-01:** 新建 `src/cli/commands/config.ts` 注册 Commander 子命令
- **D-02:** config-wizard.ts 标记废弃，Phase 15 移除（不立即删除）
- **D-03:** config 命令注册到 `src/cli/index.ts` 顶层程序
- **D-04:** 子命令风格与 template.ts 保持一致 (command + alias)

**config list 输出格式:**
- **D-05:** 表格式输出：每行显示 name + modelName + apiKey 状态 (masked)
- **D-06:** 无 JSON 输出选项（保持简单，v3 可扩展）
- **D-07:** 空列表时显示友好提示 + 创建命令引导

**config remove 确认流程:**
- **D-08:** 默认需要用户确认，`--force` 跳过确认
- **D-09:** 与 template delete 风格一致 (U5 确认提示)
- **D-10:** 确认消息显示配置名和删除风险提示

**ValidationError 展示:**
- **D-11:** 分组展示：按字段类型分组 (配置名/API Key/URL/模型)
- **D-12:** 颜色区分：chalk.red 用于错误，chalk.gray 用于提示
- **D-13:** 输出到 stderr，保持 stdout 干净

**config add 交互流程:**
- **D-14:** 复用 inputFullApiConfig() 组件 (password input 已实现)
- **D-15:** 交互顺序：name → apiKey (password) → baseUrl → modelName
- **D-16:** 默认值：baseUrl=api.anthropic.com, modelName=claude-sonnet-4-6

### Claude's Discretion
- config.ts 内部函数命名和结构
- 颜色具体值（chalk 风格）
- 错误分组标题文案

### Deferred Ideas (OUT OF SCOPE)
- JSON 输出格式 — v3 (FUZZ-01 时期可能需要)
- config edit 命令 — v3 (复杂交互)
- 批量删除 — v3 (批量操作延后)
- 配置导出/导入 — Phase 07 已有，Phase 11 不涉及

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CFG-03 | User can manage API configs via CLI: `cc-config config add/list/remove` | Commander.js subcommand pattern (template.ts), ApiService CRUD methods, registerXxxCommand pattern |
| SEC-02 | User sees validation error messages for invalid inputs (prompts validate pattern) | prompts validate pattern, ValidationError class, chalk coloring for grouped errors |
| SEC-04 | User sees 'password' type input for API key (auto-clear) | inputFullApiConfig() component, prompts password type, maskApiKey for display |

</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| CLI command registration | CLI Layer | — | Commander.js commands belong to CLI entry point |
| User interaction flow | CLI Layer | — | Prompts/password input are terminal UI components |
| Config CRUD operations | Service Layer | — | ApiService owns business logic for config management |
| Config persistence | Storage Layer | — | ApiConfigStore handles atomic writes/backups |
| Validation error formatting | CLI Layer | — | User-facing error display is CLI responsibility |
| API key masking | Security Layer | CLI Layer | Security utilities provide masking, CLI uses for display |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| commander | 14.0.3 | CLI framework | Established pattern in codebase (template.ts), subcommand support |
| prompts | 2.4.2 | Interactive prompts | Password type input (SEC-04), validate pattern, onCancel handling |
| chalk | 5.6.2 | Terminal colors | Used throughout codebase for error/success/warning messages |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ApiService | — | Config CRUD operations | All config management operations |
| ApiConfigStore | — | Config persistence | Injected into ApiService constructor |
| ValidationError | — | Validation error collection | When Zod validation fails |
| maskApiKey | — | API key masking | Display contexts (list output, previews) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Commander nested subcommands | Single command with options | Nested commands match template.ts pattern, more intuitive UX |
| prompts password type | readline with masking | prompts provides built-in password type with auto-clear (SEC-04 requirement) |
| chalk for colors | ANSI escape codes | chalk handles NO_COLOR, platform compatibility (UI-05/UI-06) |

**Installation:**
No new packages required - all dependencies exist from Phase 10 and earlier phases.

**Version verification:**
```bash
npm view commander version  # 14.0.3 (verified)
npm view prompts version    # 2.4.2 (verified)
npm view chalk version      # 5.6.2 (verified)
```

All packages verified against registry as of 2026-04-30.

## Architecture Patterns

### System Architecture Diagram

```
User Input (CLI args)
    ↓
Commander Program (src/cli/index.ts)
    ↓
registerConfigCommand → config subcommand
    ↓
┌─────────────────────────────────────────────┐
│ config.ts - CLI Command Handler              │
│                                              │
│  • config add → inputFullApiConfig()         │
│  • config list → ApiService.listConfigs()    │
│  • config remove → ApiService.deleteConfig() │
│                                              │
│  Validation: prompts validate                │
│  Errors: handleCLIError                      │
└─────────────────────────────────────────────┘
    ↓
ApiService (src/lib/services/api-service.ts)
    ↓
ApiConfigStore (src/lib/store/api-config.ts)
    ↓
~/.claude/api-configs.json (Config Persistence)
    ↓
Atomic Write + Backup (R1/R2 patterns)
```

### Recommended Project Structure

```
src/cli/
├── commands/
│   ├── config.ts           # NEW: config add/list/remove commands
│   ├── config.test.ts      # NEW: unit tests for config commands
│   └── template.ts         # EXISTING: pattern reference
├── prompts/
│   ├── components/
│   │   ├── input-api-key.ts    # EXISTING: inputFullApiConfig()
│   │   └── select-template.ts  # EXISTING: may need adaptation
│   ├── wizards/
│   │   └── config-wizard.ts    # EXISTING: mark @deprecated
│   ├── utils/
│   │   ├── handle-cancel.ts    # EXISTING: promptWithCancel
│   │   └── theme.ts            # EXISTING: color utilities
├── output/
│   └── error.ts            # EXISTING: handleCLIError
├── index.ts                # MODIFY: add registerConfigCommand

src/lib/
├── services/
│   ├── api-service.ts      # EXISTING: CRUD methods
│   ├── types.ts            # EXISTING: ServiceError
├── store/
│   ├── api-config.ts       # EXISTING: ApiConfigStore
├── security/
│   ├── api-key.ts          # EXISTING: maskApiKey
├── types/
│   ├── api-config.ts       # EXISTING: ApiConfig schema
│   ├── validation.ts       # EXISTING: ValidationError
```

### Pattern 1: registerXxxCommand Pattern

**What:** Function that registers subcommands to Commander program instance
**When to use:** All CLI commands following template.ts pattern

**Example:**
```typescript
// Source: src/cli/commands/template.ts
export function registerTemplateCommand(program: Command): void {
  const template = program
    .command('template')
    .alias('tpl')  // D-07: main command alias
    .description('Manage custom provider templates');

  // template list subcommand
  template
    .command('list')
    .alias('l')
    .description('List all templates')
    .action(async () => {
      try {
        // Service instantiation
        const service = new TemplateService(...);
        // Business logic
        const names = await service.listTemplates();
        // Display output
        console.log(chalk.bold('Saved Templates:'));
        // Error handling
      } catch (error) {
        handleCLIError(error);
      }
    });
}
```

### Pattern 2: Prompts Password Type Input

**What:** Secure password input with auto-clear
**When to use:** API key input (SEC-04), sensitive data entry

**Example:**
```typescript
// Source: src/cli/prompts/components/input-api-key.ts
export async function inputApiKey(
  message: string = '输入 API Key'
): Promise<string | null> {
  const result = await promptWithCancel<string>({
    type: 'password',  // SEC-04: password type for auto-clear
    name: 'apiKey',
    message,
    validate: (value: string) => {
      if (!value || value.trim().length === 0) {
        return 'API Key 不能为空';
      }
      if (value.length < 10) {
        return 'API Key 长度不足';
      }
      return true;
    },
  });

  return result.value;
}
```

### Pattern 3: Service Constructor Injection

**What:** Service receives dependencies via constructor, follows D-01
**When to use:** All service instantiation in CLI commands

**Example:**
```typescript
// Source: src/lib/services/api-service.ts
export class ApiService {
  constructor(
    private apiConfigStore: ApiConfigStore,
    private readConfigFn: (filepath: string) => Promise<ClaudeSettings | null>,
    private writeConfigFn: (filepath: string, config: ClaudeSettings) => Promise<void>
  ) {}
}

// CLI command usage
const apiConfigStore = new ApiConfigStore();
const service = new ApiService(apiConfigStore, readConfig, writeConfig);
```

### Pattern 4: Confirmation with --force Option

**What:** Destructive operations require confirmation, --force skips
**When to use:** config remove, template delete (D-08/D-09/U5 pattern)

**Example:**
```typescript
// Source: src/cli/commands/template.ts
template
  .command('delete <name>')
  .description('Delete a template')
  .option('-f, --force', 'skip confirmation prompt')
  .action(async (name: string, options: { force?: boolean }) => {
    try {
      // U5: Confirmation prompt for destructive action
      if (!options.force) {
        console.log(chalk.yellow(`Are you sure you want to delete template "${name}"?`));
        console.log(chalk.gray('Use --force to skip confirmation.'));
        process.exit(0);  // Note: template.ts exits early, may need adjustment
      }

      // Proceed with deletion
      await service.deleteTemplate(name);
      console.log(chalk.green(`✓ Template "${name}" deleted.`));
    } catch (error) {
      handleCLIError(error);
    }
  });
```

### Anti-Patterns to Avoid

- **Inline readline for password input:** Use prompts password type, not manual stdin masking
- **Console.log for errors:** Use stderr via console.error, keep stdout clean for data output
- **Direct store access in CLI:** Always use ApiService, not ApiConfigStore directly (D-01 pattern)
- **First error only:** Collect all validation errors, display grouped by field (SEC-02/D-11)
- **process.exit(0) before action:** Template.ts pattern exits before service call, config remove should prompt then proceed

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password input masking | Custom stdin masking with readline | prompts password type | Built-in auto-clear, cross-platform, handles Ctrl+C |
| Validation error display | Manual string concatenation | ValidationError + chalk | Grouped display, color semantics, Zod integration |
| API key masking | String slice operations | maskApiKey utility | Standardized display "...xyz", handles short keys |
| CLI subcommand structure | Commander manual parsing | Commander nested commands | Established pattern, alias support, help generation |
| Config CRUD logic | Direct file manipulation | ApiService methods | Atomic writes (R1), backups (R2), validation built-in |

**Key insight:** Phase 10 already provides all infrastructure - no need to implement storage, validation, or security from scratch. Focus on CLI UX and error display.

## Runtime State Inventory

> This phase is greenfield implementation (new CLI commands), not rename/refactor/migration.

**Not applicable:** Phase 11 creates new commands, does not rename existing identifiers or migrate stored data.

## Common Pitfalls

### Pitfall 1: ValidationError Display Not Grouped

**What goes wrong:** Validation errors appear as flat list, hard to understand which fields failed
**Why it happens:** ValidationError.issues are ZodIssue array, easy to iterate without grouping
**How to avoid:** Group issues by field path prefix (name/apiKey/baseUrl/modelName), use chalk.red for errors, chalk.gray for hints
**Warning signs:** User sees "root: ...", "apiKey: ..." without clear categorization

### Pitfall 2: --force Option Exits Before Deletion

**What goes wrong:** Following template.ts pattern, confirmation displays then process.exit(0) without executing delete
**Why it happens:** Template.ts exits to force user to re-run with --force, config remove should prompt then proceed on confirmation
**How to avoid:** Use prompts.confirm() for interactive confirmation, not console.log + process.exit pattern
**Warning signs:** User confirms deletion but command exits without action

### Pitfall 3: API Key Exposed in Error Messages

**What goes wrong:** ValidationError includes apiKey value in error message like "apiKey: sk-ant-... is too short"
**Why it happens:** Zod validation messages may contain the actual value
**How to avoid:** Apply maskApiKey before error display, never include raw apiKey in user-visible output
**Warning signs:** API key appears in terminal output or error logs

### Pitfall 4: config-wizard.ts Still Active After Deprecation

**What goes wrong:** Users may still invoke old wizard flow, causing confusion
**Why it happens:** Deprecation annotation doesn't prevent usage
**How to avoid:** Add @deprecated JSDoc, document migration path in comments, Phase 15 will remove file
**Warning signs:** Two flows exist for same operation (config add via wizard vs CLI)

## Code Examples

Verified patterns from official sources:

### config add Command Structure

```typescript
// Pattern to follow: template.ts create command + inputFullApiConfig
export function registerConfigCommand(program: Command): void {
  const config = program
    .command('config')
    .alias('cfg')  // Per D-04: alias pattern from template.ts
    .description('Manage API configurations');

  // config add - reuse inputFullApiConfig
  config
    .command('add')
    .description('Add a new API configuration')
    .action(async () => {
      try {
        const apiConfigStore = new ApiConfigStore();
        const service = new ApiService(apiConfigStore, readConfig, writeConfig);

        // D-14: Reuse inputFullApiConfig component
        const result = await inputFullApiConfig();
        if (!result) return; // Cancelled

        // Create config via ApiService
        const apiConfig: ApiConfig = {
          name: result.name,
          apiKey: result.apiKey,
          baseUrl: result.baseUrl,
          mode: 'unified',  // D-16: default mode
          modelName: result.modelName,
        };

        await service.createConfig(result.name, apiConfig);

        console.log(chalk.green(`✓ Configuration "${result.name}" created.`));

      } catch (error) {
        handleCLIError(error);
      }
    });
}
```

### config list Table Output

```typescript
// Pattern: Display masked API key + model name
config
  .command('list')
  .alias('l')
  .description('List all API configurations')
  .action(async () => {
    try {
      const apiConfigStore = new ApiConfigStore();
      const service = new ApiService(apiConfigStore, readConfig, writeConfig);

      const configs = await service.getAllConfigs();
      const names = Object.keys(configs);

      // D-07: Empty list handling
      if (names.length === 0) {
        console.log(chalk.yellow('No configurations saved.'));
        console.log(chalk.gray('Use cc-config config add to create a configuration.'));
        process.exit(0);
      }

      // D-05: Table format output
      console.log(chalk.cyan('\n可用配置'));
      console.log(separator(40));  // From theme.ts

      for (const [name, cfg] of Object.entries(configs)) {
        const maskedKey = maskApiKey(cfg.apiKey);  // SEC-01/CFG-04
        const modelName = cfg.mode === 'unified' ? cfg.modelName ?? '未设置' : 'granular';
        console.log(chalk.white(`  ${name.padEnd(20)} ${modelName.padEnd(20)} ${maskedKey}`));
      }

      console.log(separator(40));
      console.log(chalk.gray(`共 ${names.length} 个配置`));

    } catch (error) {
      handleCLIError(error);
    }
  });
```

### config remove with Confirmation

```typescript
// Pattern: --force option + prompts confirmation
config
  .command('remove <name>')
  .alias('rm')
  .description('Remove an API configuration')
  .option('-f, --force', 'skip confirmation prompt')
  .action(async (name: string, options: { force?: boolean }) => {
    try {
      const apiConfigStore = new ApiConfigStore();
      const service = new ApiService(apiConfigStore, readConfig, writeConfig);

      // Check config exists
      const existing = await service.getConfig(name);
      if (!existing) {
        console.error(chalk.red(`Configuration "${name}" not found.`));
        process.exit(ExitCodes.NOT_FOUND);
      }

      // D-08: Confirmation flow
      if (!options.force) {
        const confirmed = await prompts({
          type: 'confirm',
          name: 'value',
          message: `Remove configuration "${name}"?`,
          initial: false,
        });

        if (!confirmed.value) {
          console.log(chalk.gray('Cancelled.'));
          process.exit(0);
        }
      }

      // D-10: Show risk warning before deletion
      console.log(chalk.yellow(`Removing configuration "${name}"...`));
      console.log(chalk.gray('Projects using this config will need to be updated.'));

      await service.deleteConfig(name);
      console.log(chalk.green(`✓ Configuration "${name}" removed.`));

    } catch (error) {
      handleCLIError(error);
    }
  });
```

### Grouped ValidationError Display

```typescript
// Pattern: Group errors by field, use chalk colors
function displayValidationErrors(error: ValidationError): void {
  // D-11: Group by field type
  const groups: Record<string, string[]> = {
    '配置名错误': [],
    'API Key 错误': [],
    'URL 错误': [],
    '模型错误': [],
    '其他错误': [],
  };

  for (const issue of error.issues) {
    const path = issue.path.join('.');
    const message = issue.message;

    // Route to appropriate group
    if (path.includes('name')) {
      groups['配置名错误'].push(message);
    } else if (path.includes('apiKey')) {
      groups['API Key 错误'].push(message);
    } else if (path.includes('baseUrl')) {
      groups['URL 错误'].push(message);
    } else if (path.includes('modelName')) {
      groups['模型错误'].push(message);
    } else {
      groups['其他错误'].push(`${path}: ${message}`);
    }
  }

  // D-12/D-13: Output to stderr with colors
  for (const [groupTitle, messages] of Object.entries(groups)) {
    if (messages.length > 0) {
      console.error(chalk.red(`✖ ${groupTitle}`));
      for (const msg of messages) {
        console.error(chalk.gray(`  ${msg}`));
      }
      console.error(); // Blank line between groups
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| config-wizard.ts wizard flow | config CLI subcommands | Phase 11 | Direct CLI commands, no TUI dependency |
| TemplateConfig structure | ApiConfig 三元组 | Phase 10 | Simplified config model, clearer semantics |
| Ink TUI prompts | prompts library | Phase 09 | npm-style selection, terminal-native UX |
| First validation error only | Collect all errors | v1.0 D-05 | Comprehensive error feedback |
| React-based UI | Terminal-native CLI | v2.0 roadmap | Faster startup, simpler architecture |

**Deprecated/outdated:**
- **config-wizard.ts:** Mark @deprecated in Phase 11, remove in Phase 15
- **TemplateService for config management:** Use ApiService instead (Phase 10)

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | inputFullApiConfig() returns object matching ApiConfig structure | config add pattern | May need field mapping or transformation |
| A2 | prompts.confirm() returns { value: boolean } | config remove pattern | May return different structure, needs verification |
| A3 | ValidationError.issues path field format matches "name"|"apiKey"|"baseUrl" | grouped errors | Path format may differ, grouping logic needs adjustment |
| A4 | ApiService.createConfig accepts ApiConfig with mode='unified' | config add pattern | May require additional fields or mode-specific validation |
| A5 | config-wizard.ts uses TemplateService, not ApiService | deprecation | Migration may affect existing users if wizard still active |

**All other claims verified via code inspection or package registry check.**

## Open Questions

1. **Confirmation Flow Pattern**
   - What we know: Template.ts uses process.exit(0) before action, U5 pattern requires confirmation
   - What's unclear: Should config remove use prompts.confirm() and proceed, or follow template.ts exit pattern?
   - Recommendation: Use prompts.confirm() for interactive confirmation, proceed on yes, exit on no. Template.ts pattern seems defensive (force re-run), config remove should be more user-friendly.

2. **ValidationError Grouping Logic**
   - What we know: ValidationError.issues have path arrays like ['name'] or ['apiKey']
   - What's unclear: Exact path format for nested fields or mode-specific validation
   - Recommendation: Test with actual Zod validation errors from ApiConfigSchema, adjust grouping logic based on observed paths.

3. **Deprecation vs Immediate Removal**
   - What we know: D-02 says mark deprecated, Phase 15 removes
   - What's unclear: Should config-wizard.ts remain functional during deprecation period?
   - Recommendation: Keep functional, add @deprecated JSDoc, document migration path. Users may have workflows depending on wizard until Phase 15.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| commander | CLI framework | ✓ | 14.0.3 | — |
| prompts | Interactive input | ✓ | 2.4.2 | — |
| chalk | Terminal colors | ✓ | 5.6.2 | — |
| ApiService | Config CRUD | ✓ | Phase 10 | — |
| ApiConfigStore | Persistence | ✓ | Phase 10 | — |
| inputFullApiConfig | Password input | ✓ | Phase 10 | — |
| maskApiKey | Key masking | ✓ | Phase 10 | — |
| vitest | Test framework | ✓ | 3.2.4 | — |
| Node.js | Runtime | ✓ | ≥18.17 | — |

**Missing dependencies with no fallback:**
None - all required dependencies available.

**Missing dependencies with fallback:**
None - all required dependencies available.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 3.2.4 |
| Config file | vitest.config.ts |
| Quick run command | `npm test` (or `vitest run`) |
| Full suite command | `npm test:coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CFG-03 | config add/list/remove commands execute | integration | `vitest run src/cli/commands/config.test.ts` | ❌ Wave 0 |
| SEC-02 | validation errors display grouped | unit | `vitest run src/cli/commands/config.test.ts -t "validation"` | ❌ Wave 0 |
| SEC-04 | password input for API key | unit | `vitest run src/cli/prompts/components/input-api-key.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test` (quick run)
- **Per wave merge:** `npm test:coverage` (full suite with coverage)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/cli/commands/config.test.ts` — covers CFG-03, SEC-02, SEC-04
- [ ] `src/cli/prompts/components/input-api-key.test.ts` — covers SEC-04 (password input)
- [ ] Test mocks for ApiService/ApiConfigStore — needed for command tests
- [ ] Test fixtures for ValidationError — needed for error display tests

*(No existing test infrastructure for config commands - all tests must be created in Wave 0)*

<security_analysis>
## Security Analysis (SDD)

### STRIDE Threat Model

| Threat | Component | Risk Level | Mitigation | Status |
|--------|-----------|------------|------------|--------|
| **Spoofing** | CLI command | LOW | No user auth required (single-user tool) | N/A |
| **Tampering** | Config input | HIGH | Zod strict schema validation, reject unknown fields | ✓ Phase 10 |
| **Tampering** | Config file | MEDIUM | Atomic write pattern (R1), backup before write (R2) | ✓ Phase 10 |
| **Repudiation** | Config operations | LOW | No audit trail needed (local tool, single user) | N/A |
| **Information Disclosure** | API key storage | MEDIUM | Plaintext storage (per v1.0 decision) - user choice | Known limitation |
| **Information Disclosure** | API key CLI args | HIGH | validateNoCliApiKey blocks --api-key patterns | ✓ Phase 10 |
| **Information Disclosure** | API key display | HIGH | maskApiKey for list/preview/diff output | ✓ Phase 10 |
| **Information Disclosure** | API key input | HIGH | prompts password type (auto-clear, no stdin echo) | ✓ Phase 10 |
| **Information Disclosure** | Shell history | HIGH | Password input doesn't echo to terminal | ✓ Phase 10 |
| **Information Disclosure** | Process listing | HIGH | No API key in CLI arguments | ✓ Phase 10 |
| **Information Disclosure** | Error messages | MEDIUM | Sanitize validation errors, mask apiKey in messages | Implementation needed |
| **Information Disclosure** | Logs | MEDIUM | No apiKey in log output, mask before logging | Implementation needed |
| **Denial of Service** | Config operations | LOW | Local tool, no network dependencies | N/A |
| **Elevation of Privilege** | Config access | LOW | No multi-user access control needed | N/A |

### Trust Boundaries

| Boundary | Data Crossing | Trust Level Change | Protection |
|----------|---------------|-------------------|------------|
| **User Input → CLI** | Config name, API key, URL, model | Untrusted → Trusted | prompts validate (SEC-02), ApiConfigSchema.safeParse |
| **CLI → ApiService** | ApiConfig object | Trusted → Trusted | Service validation, ServiceError on failure |
| **ApiService → ApiConfigStore** | Config data | Trusted → Semi-trusted | Atomic write, backup, Zod validation |
| **ApiConfigStore → File** | JSON config | Semi-trusted → Persisted | Atomic write-rename (R1), backup (R2) |
| **File → Display** | Config for listing | Persisted → Public | maskApiKey applied before console output |
| **Error → User** | Validation errors | Internal → Public | Sanitize messages, mask sensitive values |

### Security Entry Points

| Entry Point | Input Type | Validation | Error Handling |
|-------------|------------|------------|----------------|
| `config add` | Interactive prompts | prompts validate + ApiConfigSchema | handleCLIError + grouped display |
| `config list` | No input | N/A | handleCLIError |
| `config remove` | Config name + --force option | Name existence check + prompts.confirm | handleCLIError |

### Implementation Security Checklist

| Category | Requirement | Implementation |
|----------|-------------|----------------|
| **Input Validation** | All inputs validated at boundary | prompts validate for interactive, ApiConfigSchema for storage |
| **Output Encoding** | Sensitive data masked before display | maskApiKey for all apiKey display contexts |
| **CLI Args Security** | No API key in command arguments | validateNoCliApiKey check (Phase 10) |
| **Terminal Security** | Password input auto-clears | prompts password type (SEC-04) |
| **Error Messages** | No sensitive data in errors | Sanitize ValidationError, mask apiKey paths |
| **Logging** | No API key in logs | Mask before any log/console output |
| **File Storage** | Atomic write + backup | R1/R2 patterns from v1.0 (Phase 10) |
| **Schema Validation** | Reject unknown fields | ApiConfigSchema.strict() (T-10-06) |
| **Environment** | Respect NO_COLOR | chalk.level = 0 if NO_COLOR set (UI-05) |

### Security Test Patterns

```typescript
// Test: API key never in CLI args
describe('Security: CLI Argument Protection', () => {
  it('rejects --api-key in arguments', () => {
    expect(() => validateNoCliApiKey(['--api-key', 'secret']))
      .toThrow(ServiceError);
  });

  it('rejects apiKey= assignment', () => {
    expect(() => validateNoCliApiKey(['apiKey=secret']))
      .toThrow(ServiceError);
  });
});

// Test: API key masked in display
describe('Security: API Key Masking', () => {
  it('masks API key for display', () => {
    const masked = maskApiKey('sk-ant-api03-abc123xyz');
    expect(masked).toBe('...3xyz');
    expect(masked).not.toContain('abc');
    expect(masked).not.toContain('sk-ant');
  });

  it('handles short keys gracefully', () => {
    const masked = maskApiKey('abc');
    expect(masked).toBe('****');
  });
});

// Test: Password input auto-clear
describe('Security: Password Input', () => {
  it('uses password type for API key', async () => {
    const result = await inputApiKey();
    // Verify prompts uses type: 'password'
    // Verify stdin does not echo input
  });
});

// Test: Validation errors sanitized
describe('Security: Error Sanitization', () => {
  it('masks apiKey in validation errors', () => {
    const error = new ValidationError('test', [
      { path: ['apiKey'], message: 'sk-secret is too short' }
    ]);
    displayValidationErrors(error);
    // Verify console.error does not contain 'sk-secret'
    // Verify display shows masked version or generic message
  });
});
```

### OWASP Top 10 Checklist

| OWASP Category | Applies | Mitigation |
|----------------|---------|------------|
| A01: Broken Access Control | No | Single-user tool, no access control needed |
| A02: Cryptographic Failures | Partial | Plaintext storage per user choice - document limitation |
| A03: Injection | No | No SQL/OS command injection vectors |
| A04: Insecure Design | No | STRIDE threat model completed |
| A05: Security Misconfiguration | Yes | validateNoCliApiKey prevents dangerous CLI patterns |
| A06: Vulnerable Components | Yes | npm audit check recommended |
| A07: Auth Failures | No | No authentication mechanism |
| A08: Data Integrity | Yes | Atomic write + backup (R1/R2) |
| A09: Logging Failures | Yes | No PII in logs, mask before output |
| A10: SSRF | No | No URL fetching from external sources |

### Known Limitations

| Limitation | Risk | Accepted Reason | Mitigation |
|------------|------|-----------------|------------|
| Plaintext API key storage | Medium | v1.0 user decision for simplicity | User controls ~/.claude/ directory |
| No encryption at rest | Medium | Local tool, user's responsibility | Document in user guide |
| No audit trail | Low | Single-user tool | N/A |

</security_analysis>

## Sources

### Primary (HIGH confidence)
- Context7 library ID: commander - subcommand patterns, alias, options
- Codebase inspection: src/cli/commands/template.ts - registerXxxCommand pattern
- Codebase inspection: src/lib/services/api-service.ts - ApiService CRUD methods
- Codebase inspection: src/cli/prompts/components/input-api-key.ts - inputFullApiConfig, password input
- Codebase inspection: src/lib/security/api-key.ts - maskApiKey, validateNoCliApiKey
- Package registry: npm view commander version (14.0.3, verified 2026-04-30)
- Package registry: npm view prompts version (2.4.2, verified 2026-04-30)
- Package registry: npm view chalk version (5.6.2, verified 2026-04-30)
- SDD reference: ~/.claude/get-shit-done/references/sdd.md - STRIDE threat model, trust boundaries

### Secondary (MEDIUM confidence)
- Codebase inspection: src/cli/output/error.ts - handleCLIError, ExitCodes
- Codebase inspection: src/lib/types/validation.ts - ValidationError class
- Codebase inspection: src/cli/prompts/utils/handle-cancel.ts - promptWithCancel
- Codebase inspection: src/cli/prompts/utils/theme.ts - color utilities, separator
- Codebase inspection: src/cli/prompts/wizards/config-wizard.ts - existing wizard implementation

### Tertiary (LOW confidence)
- [ASSUMED] inputFullApiConfig() output structure matches ApiConfig - needs verification
- [ASSUMED] prompts.confirm() return structure - needs verification
- [ASSUMED] ValidationError.issues path format - needs testing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All packages verified against registry, existing codebase patterns inspected
- Architecture: HIGH - Follows established template.ts pattern, Phase 10 provides complete infrastructure
- Pitfalls: MEDIUM - Confirmation flow pattern unclear, ValidationError grouping needs testing
- Security: HIGH - STRIDE threat model complete, Phase 10 mitigations verified, implementation checklist defined

**Research date:** 2026-04-30
**Valid until:** 30 days (stable CLI patterns, Phase 10 infrastructure complete)