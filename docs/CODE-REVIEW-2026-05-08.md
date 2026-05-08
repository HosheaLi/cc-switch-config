# 全量代码审查报告 - P07_CCAPISwitch

审查日期: 2026-05-08 | 审查范围: 全量代码 (src/)

---

## 一、代码风格 / 格式化

### 1.1 重复工具函数 (DRY 违规)

**`stripAnsi` 重复定义** — 在两个文件中各自定义了一模一样的函数：
- `src/cli/output/table.ts:14`
- `src/cli/utils/diff-render.ts:24`

应提取到 `src/cli/utils/` 或 `theme/` 模块共用。

**`truncatePath` 重复定义** — 同样逻辑出现在两个文件：
- `src/cli/output/table.ts:61` (默认 maxLength=40)
- `src/cli/commands/scan.ts:180` (默认 maxLength=48)

两个函数相同逻辑不同默认值，应统一为一个可配置的工具函数。

### 1.2 注释语言不一致

| 文件 | 注释语言 |
|------|---------|
| `src/cli/theme/detection.ts` | 英文为主 |
| `src/cli/theme/colors.ts` | 中文为主 |
| `src/lib/store/state.ts` | 英文 |
| `src/cli/commands/switch.ts` | 中文 |

应根据 CLAUDE.md 要求（中文提交/注释/日志）统一为中文注释。

### 1.3 未使用的导入

| 文件 | 行号 | 未使用导入 |
|------|------|-----------|
| `src/cli/commands/switch.ts` | 19 | `separator` — 导入但从未使用 |
| `src/cli/commands/scan.ts` | 18 | `formatters` — 导入但从未使用 |
| `src/cli/commands/export.ts` | 12 | `ServiceError` 类型导入但未使用 (仅测试中用) |
| `src/cli/utils/diff.ts` | 11 | `addedDiff`, `deletedDiff` 导入但完全未使用 |

### 1.4 导入路径风格不一致

有时从 barrel export 导入，有时直接从源模块导入：
- `src/cli/commands/list.ts:10` → `import { colors } from '../theme/index.js'` (barrel)
- `src/cli/commands/list.ts:12` → `import { formatProjectTable } from '../output/table.js'` (直接模块)

建议统一使用 barrel export (`index.js`) 路径。

### 1.5 硬编码数字 (Magic Numbers)

- `src/cli/commands/export.ts:81` — `process.exit(3)` 硬编码，应使用 `ExitCodes.NOT_FOUND`
- `src/cli/commands/import.ts:80,86` — `process.exit(4)` 硬编码，应使用 `ExitCodes.CONFIG_ERROR`

---

## 二、代码逻辑静态审查

### 2.1 已确认的 Bug

**`src/cli/commands/switch.ts:117` — 元数据更新使用错误变量**

```typescript
await projectIndex.update(projectEntry.id, { activeConfig: config });
```

当用户省略 `config` 参数并通过交互式选择配置时，函数参数 `config` 仍是 `undefined`。应使用已解析的 `configName`：

```typescript
await projectIndex.update(projectEntry.id, { activeConfig: configName });
```

这会导致 interactive select 成功后 project metadata 的 `activeConfig` 被设为 `undefined`。

### 2.2 `scanProjectsCLI` 深度 0 解析错误

`src/cli/commands/scan.ts:81`:

```typescript
const depth = options.depth ? parseInt(options.depth, 10) : 3;
```

`options.depth` 声明为 `string | undefined`。`parseInt('0')` 返回 `0`，但 `0` 是 falsy，条件判断会走 `?? 3` 分支。这意味着 `--depth 0` 会被错误地解析为深度 3。

### 2.3 `launchImportConflictTUI` 永远返回 `merge`

`src/cli/commands/import.ts:145-171`: 函数展示冲突详情后，**始终返回 `'merge'`**。这是 TODO 占位代码，使整个交互式冲突解决流程形同虚设。用户无论看到什么冲突内容都会执行 merge 策略。

### 2.4 `selectConfigInCLI` 始终返回 null

`src/cli/utils/cli-launch.ts:42-71`: 这个函数永远返回 `null`，仅打印可用配置列表和提示。不执行任何实际的配置选择交互。

### 2.5 API Key 在错误消息中潜在泄露

`src/cli/commands/register.ts:63-64`:

```typescript
console.error(colors.danger(`Path does not exist: ${expandedPath}`));
throw new Error(`Path does not exist: ${expandedPath}`);
```

- 先 `console.error` 再 `throw new Error` → 被 `handleCLIError` 捕获后**错误消息输出两次**
- `throw new Error` 而非 `ServiceError` → 不会映射到正确的退出码

---

## 三、冗余代码 / 死代码

### 3.1 多余的 detectConflicts 三重导出

`src/lib/services/export-service.ts` 中 `detectConflicts` 存在三种形式：
1. 实例方法 (line 138)
2. 静态方法 (line 149)
3. 独立函数导出 (line 349)

只需保留静态方法 + 独立导出函数即可。实例方法是多余的包装。

### 3.2 空占位测试

| 文件 | 行号 | 问题 |
|------|------|------|
| `src/cli/commands/export.test.ts` | 63-88 | 4 个测试全部 `expect(true).toBe(true)` |
| `src/cli/commands/import.test.ts` | 63-89 | 5 个测试全部 `expect(true).toBe(true)` |

这些测试不验证任何行为——要么实现要么删除。

### 3.3 死 Mock

`src/cli/commands/current.test.ts:14-23`: 文件 mock 了 `chalk`，但项目实际使用 `picocolors`。此 mock 永远不生效，属于残留代码。

### 3.4 无用的 `formatValidationErrors` 函数

`src/lib/types/validation.ts:93-103` 定义了 `formatValidationErrors` 用于格式化 error issues。但 `src/cli/commands/config.ts` 中的 `displayValidationErrors` 实现了自己的分组输出逻辑。`formatValidationErrors` 可能完全不被任何地方调用。

### 3.5 未调用的私有方法 `deriveProjectName`

`src/lib/services/export-service.ts:289-291`: 私有方法 `deriveProjectName` 在类中定义，但 `exportProject` 直接使用 `project.name`，此方法从未被调用。

---

## 四、逻辑问题

### 4.1 `buildUnifiedEnv` 使用非空断言无安全校验

`src/lib/types/replacement.ts:71-74`:

```typescript
ANTHROPIC_MODEL: config.modelName!,
```

如果 `modelName` 实际为 `undefined`（如 JSON 反序列化绕过 Zod），会在 env 对象中注入 `undefined` 值，导致 Claude Code 配置异常。

### 4.2 `handleCLIError` 中 `process.exit` 使函数不可组合

`src/cli/output/error.ts:45-53`: 直接调用 `process.exit()` 使该函数在任何单元测试中都必须 mock `process.exit`。更好的设计是返回退出码，让调用者决定退出。

### 4.3 `defaultOnCancel` 过度激进

`src/cli/prompts/utils/handle-cancel.ts:23-26`: `defaultOnCancel` 调用 `process.exit(0)`。在中间步骤（如 wizard 第 2 步取消）会导致整个 TUI 被杀死，而非优雅返回到上一步。

### 4.4 Service 层直接 I/O

`src/lib/services/project-service.ts:99-100`: Service 层直接使用 `console.error` 输出，违反了 Service 层不应直接做 I/O 的设计原则。应使用 logger 注入或返回错误让 CLI 层处理。

### 4.5 `walkDirectory` 过滤所有隐藏目录

`src/lib/services/project-service.ts:163`:

```typescript
.filter(e => !e.name.startsWith('.'))
```

这会跳过所有以 `.` 开头的目录。如果用户将项目放在 `~/.local/projects/` 这样的隐藏目录下，扫描将无法发现。

### 4.6 数据存储路径文档与实际严重不符

`src/lib/store/api-config.ts:29`: 注释说文件路径是 `~/.claude/api-configs.json`（Claude 的配置目录），但代码使用 `getConfigDir()`（XDG 目录）。在 macOS 上实际路径为 `~/Library/Preferences/cc-config-switch-nodejs/api-configs.json`。注释完全错误，会误导开发者。

### 4.7 `ApiConfigStore.save` 缺少备份保护

对比 `ProjectIndex.save`（会调用 `createBackup`），`ApiConfigStore.save` 直接写入而不备份。备份只在 `set`/`delete` 方法中手动执行。如果未来新增调用路径直接调用 `save`，会导致无备份写入。

### 4.8 `FileWatcher.start` 中 `ready` 事件监听器注册两次

`src/lib/store/watcher.ts:251-266`: 同一个 `start()` 方法内 `ready` 事件处理器被注册两次（一次 resolve promise，一次 clearTimeout）。两个处理器都会触发，虽然无功能性 bug，但代码意图不清，存在重复 clear 风险。

---

## 总结

| 严重度 | 数量 | 关键问题 |
|--------|------|---------|
| HIGH (Bug) | 3 | switch 元数据更新变量错误、scan depth 0 解析错误、import 冲突解决完全失效 |
| MEDIUM | 5 | 重复函数、硬编码 exit code、占位函数、路径注释错误、handleCLIError 不可组合 |
| LOW | 8 | 未使用导入、注释语言不一致、空占位测试、死 mock、重复导出、死代码 |

### 建议优先修复顺序

1. `switch.ts:117` — activeConfig 更新用错变量 (Bug)
2. `scan.ts:81` — depth 0 被错误解析为 3 (Bug)
3. `import.ts:145-171` — 冲突解决 TUI 始终返回 merge (Bug)
4. 提取 `stripAnsi` / `truncatePath` 为共享工具函数 (重复代码)
5. 统一硬编码 `process.exit(N)` 为 `ExitCodes` 常量
6. 修复 `api-config.ts` 路径注释
7. 清理所有未使用导入
8. 实现或删除空占位测试
