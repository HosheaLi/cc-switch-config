# Phase 5: CLI Interface - Research

**Researched:** 2026-04-14
**Domain:** Node.js CLI Framework (Commander.js), Output Formatting, Error Handling
**Confidence:** HIGH

## Summary

Phase 5 实现 CLI 入口和命令路由，基于 Commander.js 14.0.3 构建命令解析架构。研究覆盖 Commander.js 子命令模式、别名设置、选项解析、错误处理和退出码控制。输出格式化使用已安装的 chalk 5.6.2 实现彩色输出，表格输出可选用 cli-table3（需新增依赖）。CLI 通过 Services 层 barrel export 调用业务逻辑，遵循 Clean Architecture 单向依赖原则。

**Primary recommendation:** 使用 Commander.js `.command()` + `.action()` 模式实现子命令，`.alias()` 注册快捷别名，`exitOverride()` 控制退出行为配合 async handler。

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** 混合风格 — 短选项 + 明确子命令
  - **Why:** 兼顾快速操作和清晰语义，如 `-l` 快捷 + `list` 明确
  - **How:** commander 注册别名，如 `.command('list').alias('ls')`

- **D-02:** 智能模式 — 无参数启动 TUI，--help 显示帮助
  - **Why:** 符合用户直觉（直接运行进交互界面），同时保留标准 CLI 帮助
  - **How:** 检测参数数量，无参数调用 TUI 入口

- **D-03:** 混合模式 — stderr + exit code + 颜色友好提示
  - **Why:** 脚本可解析 exit code，用户看到友好消息
  - **How:** 使用 chalk 添加颜色，console.error 输出，process.exit(code)

- **D-04:** Phase 5 实现 4 个核心命令
  - `list` (ls): 显示项目列表及配置状态
  - `switch` (sw): 切换配置模板
  - `current` (cur): 显示当前激活配置
  - `template` (tpl): 模板管理 CRUD

- **D-05:** 彩色表格输出
  - **Why:** 信息密度高，美观可读，chalk 支持颜色
  - **How:** 使用 cli-table3 或自定义格式化函数

- **D-06:** 可选参数 + TUI fallback
  - **Why:** 有模板名快速切换，无模板名进 TUI 选择
  - **How:** 参数可选，检测缺失时调用 TUI 选择界面

- **D-07:** 混合风格 — tpl list/create/delete + -l/-c/-d 别名
  - **Why:** 与主命令风格一致，子命令清晰 + 快捷选项
  - **How:** commander 子命令 + 别名注册

- **D-08:** src/cli/ 目录组织
  - **Why:** CLI 代码独立于 Services 和 Types，便于维护
  - **How:** `src/cli/index.ts` 入口 + `src/cli/commands/*.ts` 各命令实现

### Claude's Discretion

- 具体命令别名命名 (ls vs l, sw vs s)
- 影响表格显示的具体列和字段
- 命令文件拆分粒度
- commander version 显示策略
- 是否添加 --json 输出选项

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| F5 | Quick Switch Command - `cc-config switch <name>` 一键切换 | Commander `.command('switch').argument('[name]')` pattern |
| F6 | Current Status Display - `cc-config current` 显示当前激活配置 | Commander `.command('current')` + ConfigService.readProjectConfig |
| F4 | List All Projects - 显示所有管理的项目及其配置状态 | Commander `.command('list')` + ProjectService.listProjects |
| U4 | Help Documentation - 命令参考 | Commander auto-generated --help + `.addHelpText()` |
| F7 | Custom Provider Templates - 用户自定义模板 CRUD | Commander nested subcommand `.command('template')` pattern |
| N2 | Quick Operations - < 100ms for switch/list | Commander parse + Services call pattern |
| U1 | Clear Errors - JSON errors with line numbers | Commander `.error()` + chalk formatting |
| U5 | Confirmation Prompts - 破坏性操作需确认 | Commander action handler + interactive prompt |
| M4 | Module Separation - Clear layer boundaries | CLI → Services → Store → Repository dependency chain |

</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| commander | 14.0.3 | CLI framework | Industry standard, full subcommand support, TypeScript ready |
| chalk | 5.6.2 | Output coloring | ESM-native, tree-shakeable, cross-platform color support |

### Supporting (Required)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| cli-table3 | 0.6.5 | Table formatting | list 命令输出项目表格 |

### Supporting (Optional)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ora | 9.3.0 | Progress spinner | 长时间操作（如 scan projects）|
| boxen | 8.0.1 | Bordered messages | 重要信息高亮（如 current 状态）|

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| cli-table3 | Custom formatting function | cli-table3: 特性丰富但需新增依赖；Custom: 轻量但功能有限 |
| commander | yargs | commander: API 更清晰；yargs: 更灵活但配置复杂 |
| chalk | ansi-colors | chalk: 生态成熟；ansi-colors: 更小但功能少 |

**Installation:**

```bash
# 新增 cli-table3（表格输出）
npm install cli-table3
```

**Version verification:**
- commander: 14.0.3 (registry: 2026-02-21) - matches package.json ✓
- chalk: 5.6.2 (registry: 2025-09-08) - matches package.json ✓
- cli-table3: 0.6.5 (registry verified) - needs installation

## Architecture Patterns

### Recommended Project Structure

```
src/
├── cli/
│   ├── index.ts          # CLI entry point (shebang + commander setup)
│   ├── commands/
│   │   ├── list.ts       # list/ls 命令实现
│   │   ├── switch.ts     # switch/sw 命令实现
│   │   ├── current.ts    # current/cur 命令实现
│   │   └── template.ts   # template/tpl 子命令
│   ├── output/
│   │   ├── table.ts      # 表格格式化 (cli-table3)
│   │   ├── colors.ts     # 颜色主题定义 (chalk)
│   │   └── error.ts      # 错误输出格式化
│   └── utils/
│       ├── exit.ts       # 退出码处理
│       └── tui-launch.ts # TUI 启动逻辑
├── lib/
│   ├── services/         # Services Layer (Phase 04)
│   └── store/            # State Management (Phase 01-03)
└── index.ts              # 替换现有 skeleton → CLI 入口
```

### Pattern 1: Commander Entry Point Setup

**What:** CLI 入口配置 commander 程序对象，注册命令和全局选项
**When to use:** src/cli/index.ts 或 src/index.ts 入口文件

**Example:**

```typescript
// Source: Commander.js README + project patterns
import { Command } from 'commander';
import { VERSION } from '../lib/config/version.js';
import { registerListCommand } from './commands/list.js';
import { registerSwitchCommand } from './commands/switch.js';
import { registerCurrentCommand } from './commands/current.js';
import { registerTemplateCommand } from './commands/template.js';
import { launchTUI } from './utils/tui-launch.js';

const program = new Command();

program
  .name('cc-config')
  .description('CLI tool for managing Claude Code API provider configurations')
  .version(VERSION, '-v, --version', 'output the current version')
  .helpOption('-h, --help', 'display help for command');

// Register commands
registerListCommand(program);
registerSwitchCommand(program);
registerCurrentCommand(program);
registerTemplateCommand(program);

// D-02: 无参数启动 TUI
const args = process.argv.slice(2);
if (args.length === 0) {
  launchTUI();
} else {
  program.parseAsync(process.argv);
}
```

### Pattern 2: Subcommand with Alias

**What:** 使用 `.command()` + `.alias()` + `.action()` 实现子命令
**When to use:** 各命令实现文件

**Example:**

```typescript
// Source: Commander.js README - Commands section
import type { Command } from 'commander';
import { ProjectService } from '../../lib/services/index.js';
import { formatProjectTable } from '../output/table.js';

export function registerListCommand(program: Command): void {
  program
    .command('list')
    .alias('ls')  // D-01: 短选项别名
    .description('Display all registered projects and their config status')
    .option('-j, --json', 'output as JSON format')
    .action(async (options) => {
      try {
        const service = new ProjectService(/* injected deps */);
        const projects = await service.listProjects();
        
        if (options.json) {
          console.log(JSON.stringify(projects, null, 2));
        } else {
          console.log(formatProjectTable(projects));
        }
      } catch (error) {
        handleCLIError(error);
      }
    });
}
```

### Pattern 3: Nested Subcommand (template CRUD)

**What:** 子命令下的嵌套子命令，用于 template list/create/delete
**When to use:** template 命令实现

**Example:**

```typescript
// Source: Commander.js README - nestedCommands.js example
import type { Command } from 'commander';
import { TemplateService } from '../../lib/services/index.js';

export function registerTemplateCommand(program: Command): void {
  const template = program
    .command('template')
    .alias('tpl')
    .description('Manage custom provider templates');

  // D-07: 子命令 + 别名
  template
    .command('list')
    .alias('l')
    .description('List all templates')
    .action(async () => {
      const service = new TemplateService(/* deps */);
      const names = await service.listTemplates();
      console.log(names.join('\n'));
    });

  template
    .command('create <name>')
    .alias('c')
    .description('Create a new template')
    .action(async (name) => {
      // 调用 TUI 表单或交互式输入
    });

  template
    .command('delete <name>')
    .alias('d')
    .description('Delete a template')
    .action(async (name) => {
      // 确认后删除
    });
}
```

### Pattern 4: Optional Argument with Fallback

**What:** 可选参数 `[name]`，缺失时调用 TUI 选择界面
**When to use:** switch 命令 (D-06)

**Example:**

```typescript
// Source: Commander.js README - argument.js example
import type { Command } from 'commander';
import { TemplateService } from '../../lib/services/index.js';
import { selectTemplateInTUI } from '../utils/tui-launch.js';

export function registerSwitchCommand(program: Command): void {
  program
    .command('switch [template-name]')
    .alias('sw')
    .description('Switch to a provider template')
    .action(async (templateName) => {
      // D-06: 无参数时进 TUI 选择
      const targetTemplate = templateName ?? await selectTemplateInTUI();
      
      if (!targetTemplate) {
        console.error(chalk.yellow('No template selected'));
        process.exit(0);
      }
      
      const service = new TemplateService(/* deps */);
      await service.applyTemplate(process.cwd(), targetTemplate);
      console.log(chalk.green(`✓ Switched to template: ${targetTemplate}`));
    });
}
```

### Pattern 5: Error Handling with Exit Override

**What:** 使用 `exitOverride()` 捕获 commander 错误，自定义退出行为
**When to use:** CLI 入口 + 命令错误处理

**Example:**

```typescript
// Source: Commander.js README - Override exit and output handling
import { Command } from 'commander';
import chalk from 'chalk';

const program = new Command();

program
  .exitOverride((err) => {
    // Commander 错误（如未知选项）不直接退出
    // 由 action handler 处理
    throw err;
  })
  .configureOutput({
    writeErr: (str) => process.stderr.write(str),
    outputError: (str, write) => write(chalk.red(str))
  });

// 命令内错误处理
function handleCLIError(error: unknown, code: number = 1): void {
  if (error instanceof ServiceError) {
    console.error(chalk.red(`Error [${error.code}]: ${error.message}`));
    process.exit(code);
  } else if (error instanceof Error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(code);
  }
}
```

### Pattern 6: Table Output with cli-table3

**What:** 使用 cli-table3 生成彩色表格输出
**When to use:** list 命令输出

**Example:**

```typescript
// Source: cli-table3 npm documentation
import Table from 'cli-table3';
import chalk from 'chalk';
import type { ProjectEntry } from '../../lib/store/project.js';

export function formatProjectTable(projects: ProjectEntry[]): string {
  const table = new Table({
    head: [
      chalk.cyan.bold('Project'),
      chalk.cyan.bold('Path'),
      chalk.cyan.bold('Config'),
      chalk.cyan.bold('Status')
    ],
    colWidths: [20, 40, 15, 10],
    style: {
      head: [],
      border: ['gray']
    }
  });

  for (const project of projects) {
    const statusIcon = project.activeConfig 
      ? chalk.green('✓') 
      : chalk.yellow('○');
    table.push([
      project.name,
      chalk.gray(project.path),
      project.activeConfig ?? chalk.gray('none'),
      statusIcon
    ]);
  }

  return table.toString();
}
```

### Anti-Patterns to Avoid

- **Direct fs in CLI:** CLI 应调用 Services，不直接操作文件系统（违反 Clean Architecture）
- **process.exit in Services:** Services 层抛出 Error，CLI 层负责退出（违反 D-02）
- **Hardcoded colors:** 使用 chalk 主题函数，不直接写 ANSI 代码
- **Missing async handler:** async action 必须用 `.parseAsync()`，否则错误无法捕获
- **Ignoring NO_COLOR:** 应检测 `process.env.NO_COLOR` 并禁用颜色输出

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Argument parsing | Manual argv parsing | Commander `.argument()` | Edge cases, validation, help generation |
| Help text | Custom help formatting | Commander auto-help | Consistency, maintenance burden |
| Table formatting | String concatenation | cli-table3 | Alignment, borders, truncation |
| Error codes | Hardcoded numbers | Standard exit codes | Script compatibility |

**Key insight:** Commander.js 处理了所有 CLI 边界情况（未知选项、缺失参数、参数解析），手工实现容易遗漏边缘场景。

## Runtime State Inventory

> Not applicable — Phase 5 is greenfield CLI implementation, no rename/refactor involved.

## Common Pitfalls

### Pitfall 1: Missing parseAsync for async actions

**What goes wrong:** async action handler 内错误无法被 Commander 捕获，程序静默失败
**Why it happens:** `.parse()` 不支持 async action，错误被吞没
**How to avoid:** 所有 async action 必须用 `.parseAsync()`
**Warning signs:** 测试中 async 命令抛错后进程不退出

```typescript
// Wrong
program.parse(process.argv);  // async errors lost

// Correct
await program.parseAsync(process.argv);
```

### Pitfall 2: Commander default exit breaks error handling

**What goes wrong:** Commander 默认在错误/help/version 后调用 `process.exit()`，无法自定义错误处理
**Why it happens:** Commander 内部直接退出进程
**How to avoid:** 使用 `.exitOverride()` 捕获退出事件
**Warning signs:** try-catch 无法捕获 Commander 错误

```typescript
// Wrong
try {
  program.parse(process.argv);  // exit inside, catch never reached
} catch (err) {}

// Correct
program.exitOverride();
try {
  program.parse(process.argv);
} catch (err) {
  handleCLIError(err);
}
```

### Pitfall 3: Subcommand not receiving injected services

**What goes wrong:** 命令 handler 内无法获取 Services 实例，依赖注入失败
**Why it happens:** action handler 在 commander.parse 时执行，DI 容器尚未初始化
**How to avoid:** 在 action handler 内动态创建 Services，或使用 factory pattern
**Warning signs:** handler 内 `service` 变量为 undefined

```typescript
// Correct approach - factory in action
.action(async () => {
  const service = createProjectService();  // factory pattern
  const projects = await service.listProjects();
});
```

### Pitfall 4: Color output in non-TTY environment

**What goes wrong:** CI/CD 或管道输出时 ANSI 码干扰日志解析
**Why it happens:** chalk 默认在所有环境输出颜色
**How to avoid:** 检测 `process.stdout.isTTY` 和 `NO_COLOR` 环境变量
**Warning signs:** CI 日志包含乱码 ANSI 序列

```typescript
// Respect NO_COLOR standard
if (process.env.NO_COLOR || !process.stdout.isTTY) {
  chalk.level = 0;
}
```

### Pitfall 5: Missing shebang in bin entry

**What goes wrong:** npm install 后 `cc-config` 命令无法执行
**Why it happens:** 缺少 `#!/usr/bin/env node` shebang 行
**How to avoid:** 入口文件第一行添加 shebang
**Warning signs:** 安装后执行报错 "Permission denied" 或 syntax error

```typescript
// First line of src/index.ts or src/cli/index.ts
#!/usr/bin/env node
```

## Code Examples

### CLI Entry Point (Complete)

```typescript
// Source: Commander.js README patterns + project requirements
#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { VERSION } from '../lib/config/version.js';
import { registerListCommand } from './commands/list.js';
import { registerSwitchCommand } from './commands/switch.js';
import { registerCurrentCommand } from './commands/current.js';
import { registerTemplateCommand } from './commands/template.js';
import { launchTUI } from './utils/tui-launch.js';
import { handleCLIError } from './output/error.js';

// Respect NO_COLOR
if (process.env.NO_COLOR) chalk.level = 0;

const program = new Command();

program
  .name('cc-config')
  .description('CLI tool for managing Claude Code API provider configurations')
  .version(VERSION)
  .exitOverride()
  .configureOutput({
    writeErr: (str) => process.stderr.write(str),
  });

registerListCommand(program);
registerSwitchCommand(program);
registerCurrentCommand(program);
registerTemplateCommand(program);

// D-02: Smart mode - no args launches TUI
const args = process.argv.slice(2);
if (args.length === 0) {
  launchTUI().catch(handleCLIError);
} else {
  program.parseAsync(process.argv).catch(handleCLIError);
}
```

### Error Output Module

```typescript
// Source: Web search - Node.js CLI error handling best practices
import chalk from 'chalk';
import { ServiceError } from '../../lib/services/types.js';

/** Standard exit codes */
export const ExitCodes = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  MISUSE: 2,        // Invalid arguments
  NOT_FOUND: 3,     // Template/project not found
  CONFIG_ERROR: 4,  // Config validation failed
} as const;

export function handleCLIError(error: unknown): void {
  if (error instanceof ServiceError) {
    console.error(chalk.red(`[${error.code}] ${error.message}`));
    const exitCode = mapErrorToExitCode(error.code);
    process.exit(exitCode);
  } else if (error instanceof Error) {
    console.error(chalk.red(error.message));
    process.exit(ExitCodes.GENERAL_ERROR);
  } else {
    console.error(chalk.red('Unknown error'));
    process.exit(ExitCodes.GENERAL_ERROR);
  }
}

function mapErrorToExitCode(code: string): number {
  const codeMap: Record<string, number> = {
    'TEMPLATE_NOT_FOUND': ExitCodes.NOT_FOUND,
    'PROJECT_NOT_FOUND': ExitCodes.NOT_FOUND,
    'CONFIG_READ_FAILED': ExitCodes.CONFIG_ERROR,
    'CONFIG_WRITE_FAILED': ExitCodes.CONFIG_ERROR,
    'VALIDATION_ERROR': ExitCodes.CONFIG_ERROR,
  };
  return codeMap[code] ?? ExitCodes.GENERAL_ERROR;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CommonJS require() | ESM import | chalk 5.x (2023) | 需 package.json `type: module` |
| process.argv manual parse | Commander.parse() | Commander 2.x+ | 自动处理选项、参数、帮助 |
| Hardcoded ANSI codes | chalk functions | chalk 3.x+ | 跨平台兼容、可测试 |

**Deprecated/outdated:**
- `program.storeOptionsAsProperties()`: Commander 7 前的模式，现用 `.opts()` 方法
- `require('chalk')`: chalk 5.x 只支持 ESM import

## Open Questions

1. **cli-table3 dependency decision**
   - What we know: cli-table3 0.6.5 available, ~15KB added
   - What's unclear: 是否需要复杂表格特性（多行单元格、自动截断）
   - Recommendation: 先安装 cli-table3，如 list 命令需求简单可后续替换为 custom formatter

2. **TUI integration boundary**
   - What we know: Phase 06 实现 TUI，CLI 需调用 TUI 入口
   - What's unclear: CLI→TUI 调用时的数据传递方式（参数 vs 共享 state）
   - Recommendation: CLI action 检测无参数时调用 TUI 入口函数，TUI 自己初始化 Services

3. **JSON output option (--json)**
   - What we know: Claude's discretion area
   - What's unclear: 用户是否需要脚本友好的 JSON 输出
   - Recommendation: 为 list/current 命令添加 `-j, --json` 选项，便于脚本集成

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Commander.js | CLI framework | ✓ | 14.0.3 | — |
| chalk | Output formatting | ✓ | 5.6.2 | — |
| cli-table3 | Table output | ✗ | — | Custom formatter |
| Node.js | Runtime | ✓ | ≥18.17 | — |
| tsx | Development | ✓ | 4.19.4 | — |

**Missing dependencies with no fallback:**
- None — all core dependencies available

**Missing dependencies with fallback:**
- cli-table3 — can use custom formatter for simple cases

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | vitest.config.ts |
| Quick run command | `npm test` |
| Full suite command | `npm run test:coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| F5 | switch command parses template name | unit | `vitest run src/cli/commands/switch.test.ts` | ❌ Wave 0 |
| F5 | switch without name launches TUI | unit | `vitest run src/cli/commands/switch.test.ts` | ❌ Wave 0 |
| F6 | current displays active config | unit | `vitest run src/cli/commands/current.test.ts` | ❌ Wave 0 |
| F4 | list outputs project table | unit | `vitest run src/cli/commands/list.test.ts` | ❌ Wave 0 |
| F4 | list --json outputs JSON | unit | `vitest run src/cli/commands/list.test.ts` | ❌ Wave 0 |
| U4 | --help shows command reference | unit | `vitest run src/cli/index.test.ts` | ❌ Wave 0 |
| F7 | template list/create/delete CRUD | unit | `vitest run src/cli/commands/template.test.ts` | ❌ Wave 0 |
| U1 | ServiceError maps to exit code | unit | `vitest run src/cli/output/error.test.ts` | ❌ Wave 0 |
| D-02 | no args launches TUI | unit | `vitest run src/cli/index.test.ts` | ❌ Wave 0 |
| N2 | list completes < 100ms | perf | `vitest run src/cli/commands/list.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test` (quick unit tests)
- **Per wave merge:** `npm run test:coverage` (full suite + coverage)
- **Phase gate:** Full suite green, ≥80% coverage for CLI module

### Wave 0 Gaps

- [ ] `src/cli/index.test.ts` — CLI entry point tests (help, TUI launch)
- [ ] `src/cli/commands/list.test.ts` — list command tests
- [ ] `src/cli/commands/switch.test.ts` — switch command tests
- [ ] `src/cli/commands/current.test.ts` — current command tests
- [ ] `src/cli/commands/template.test.ts` — template subcommand tests
- [ ] `src/cli/output/table.test.ts` — table formatting tests
- [ ] `src/cli/output/error.test.ts` — error handling tests
- [ ] Framework config: vitest.config.ts exists ✓
- [ ] Test utilities: mock Commander, mock Services for unit tests

*(Wave 0 will create test infrastructure and stub implementations)*

## Sources

### Primary (HIGH confidence)

- Commander.js README (node_modules/commander/README.md) — setup, options, commands, action handlers, exit override, help
- package.json — installed versions verification
- npm registry — commander 14.0.3 (2026-02-21), chalk 5.6.2 (2025-09-08)

### Secondary (MEDIUM confidence)

- Web search: Node.js CLI exit codes stderr error handling best practices 2026 — standard exit codes, error patterns
- Web search: chalk 5.x CLI output formatting colors tables cli-table3 best practices 2026 — ESM patterns, cli-table3 integration

### Tertiary (LOW confidence)

- None — all findings verified with primary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Commander/chalk versions verified in package.json and npm registry
- Architecture: HIGH — Commander patterns from official README, project structure from CONTEXT.md
- Pitfalls: HIGH — Common Commander/chalk pitfalls documented in README and web search

**Research date:** 2026-04-14
**Valid until:** 30 days (stable libraries, patterns well-established)