# Phase 11: Config CLI Commands - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-30
**Phase:** 11-config-cli-commands
**Areas discussed:** CLI结构, List输出, Remove确认, 错误展示

---

## CLI 命令结构

| Option | Description | Selected |
|--------|-------------|----------|
| 重构现有 wizard | 重构 config-wizard.ts，改用 ApiService | |
| 新建 CLI 命令文件 | 新建 src/cli/commands/config.ts，wizard 标记废弃 | ✓ |
| 两者结合 | 新建 CLI + 重构 wizard | |

**User's choice:** 新建 CLI 命令文件
**Notes:** 保持简单，wizard.ts 标记废弃 Phase 15 移除

---

## config list 输出格式

| Option | Description | Selected |
|--------|-------------|----------|
| 表格式输出 | 每行 name + model + apiKey状态 | ✓ |
| 支持 JSON 输出 | 默认表格 + --json 选项 | |
| 洁列表 | 一行一个配置名 | |

**User's choice:** 表格式输出
**Notes:** 无 JSON 选项，保持简单。v3 可扩展。

---

## config remove 确认流程

| Option | Description | Selected |
|--------|-------------|----------|
| 默认确认 | 默认确认，--force 跳过 | ✓ |
| 直接删除 | 直接删除，--dry-run 预览 | |
| 交互式确认 | prompts confirm，无 --force | |

**User's choice:** 默认确认
**Notes:** 与 template delete 风格一致 (U5)

---

## ValidationError 展示格式

| Option | Description | Selected |
|--------|-------------|----------|
| 逐行展示 | 直接输出 getMessages() | |
| 分组展示 | 按字段类型分组，颜色区分 | ✓ |
| 简化消息 | 只输出 ServiceError message | |

**User's choice:** 分组展示
**Notes:** chalk.red 错误，chalk.gray 提示，输出 stderr

---

## Deferred Ideas

None — discussion stayed within phase scope

---
*Discussion log: 2026-04-30*