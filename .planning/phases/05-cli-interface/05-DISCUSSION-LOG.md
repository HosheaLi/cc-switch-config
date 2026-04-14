# Phase 5: CLI Interface - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-14
**Phase:** 05-cli-interface
**Areas discussed:** 命令结构, TUI触发, 错误处理, 核心命令, 输出格式, switch设计, tpl子命令, 代码结构

---

## 命令结构设计

| Option | Description | Selected |
|--------|-------------|----------|
| Subcommand 风格 | cc-config list/switch/current。标准易扩展 | |
| Flags 风格 | cc-config -l/-s/-c。快速操作，不易扩展 | |
| **混合风格** | -l 快捷 + list 明确。兼顾速度和清晰度 | ✓ |

**User's choice:** 混合风格
**Notes:** 兼顾快速操作和清晰语义

---

## TUI 触发方式

| Option | Description | Selected |
|--------|-------------|----------|
| 默认启动 TUI | 无参数进 TUI，交互式首选 | |
| 明确子命令 | cc-config tui 启动，无参数显示帮助 | |
| **智能模式** | 无参数进 TUI，--help 显示帮助 | ✓ |

**User's choice:** 智能模式
**Notes:** 符合用户直觉，同时保留标准 CLI 帮助

---

## 错误呈现方式

| Option | Description | Selected |
|--------|-------------|----------|
| 标准 CLI 错误 | stderr + 非 0 exit code，脚本集成友好 | |
| 友好错误消息 | 颜色消息 + 建议操作，用户友好 | |
| **混合模式** | 标准格式 + 颜色友好提示 | ✓ |

**User's choice:** 混合模式
**Notes:** 脚本可解析，人也易读

---

## CLI 核心命令集

| Option | Description | Selected |
|--------|-------------|----------|
| **list (ls)** | 显示项目列表及配置状态 | ✓ |
| **switch (sw)** | 切换配置模板 | ✓ |
| **current (cur)** | 显示当前激活配置 | ✓ |
| **template (tpl)** | 模板管理 CRUD | ✓ |

**User's choice:** 全部 4 个核心命令
**Notes:** Phase 5 实现完整核心命令集

---

## CLI 输出格式

| Option | Description | Selected |
|--------|-------------|----------|
| **彩色表格** | 彩色表格 + 状态图标，信息密度高 | ✓ |
| 简洁列表 | 每项一行，适合管道处理 | |
| JSON 格式 | 便于脚本集成和解析 | |
| 默认 + --json | 兼顾两种场景 | |

**User's choice:** 彩色表格
**Notes:** 美观可读，chalk 支持颜色

---

## switch 命令参数设计

| Option | Description | Selected |
|--------|-------------|----------|
| 必填参数 | cc-config switch <name>，明确清晰 | |
| **可选 + TUI** | 有参数快速切换，无参数进 TUI 选择 | ✓ |
| 分拆命令 | switch 必填，另有 select 进 TUI | |

**User's choice:** 可选 + TUI
**Notes:** 兼顾两种场景

---

## template 命令子结构

| Option | Description | Selected |
|--------|-------------|----------|
| 子命令风格 | tpl list/create/delete | |
| Flags 风格 | tpl -l/-c/-d | |
| **混合风格** | tpl list 明确 + tpl -l 快捷 | ✓ |

**User's choice:** 混合风格
**Notes:** 与主命令风格一致

---

## CLI 代码结构

| Option | Description | Selected |
|--------|-------------|----------|
| **src/cli/ 目录** | CLI 代码独立目录 | ✓ |
| src/index.ts | 直接在入口文件实现 | |
| cli 入口 + commands | src/cli/cli.ts + src/cli/commands/ | |

**User's choice:** src/cli/ 目录
**Notes:** CLI 代码独立于 Services 和 Types

---

## Claude's Discretion

- 具体命令别名命名 (ls vs l, sw vs s)
- 影响表格显示的具体列和字段
- 命令文件拆分粒度
- commander version 显示策略
- 是否添加 --json 输出选项

## Deferred Ideas

None — discussion stayed within phase scope.