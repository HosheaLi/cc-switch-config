# CC Config Manager

## What This Is

一个 CLI/TUI 工具，用于管理 Claude Code 的项目级配置。让用户能够轻松为不同项目目录配置不同的 API 服务和模型，管理 MCP 服务器配置，并通过供应商模板快速切换配置。

目标用户：个人使用 → 后续开源发布到 GitHub。

## Core Value

**一站式配置管理**：让 Claude Code 的多项目、多 API、多模型配置变得简单、可靠、可视化。如果一切失败，用户至少能快速查看和编辑所有项目的配置状态。

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] 项目目录管理：手动添加/移除项目目录，自动扫描指定目录
- [ ] 项目列表展示：显示每个项目的当前配置状态（API、模型、MCP）
- [ ] API/模型配置：为项目选择 API 服务、配置模型参数
- [ ] MCP 配置：管理项目级 MCP 服务器配置
- [ ] 供应商模板：创建和管理自定义 API 供应商模板
- [ ] 配置预览：显示生成的 settings.json 内容
- [ ] 配置验证：验证配置是否有效、API 是否可达

### Out of Scope

- 预定义供应商模板 — 后续版本添加，先只支持自定义模板
- 桌面 GUI 应用 — 第一期只做 TUI，第二期可选 Tauri 桌面应用
- API Token 加密存储 — 明文存储于 settings.local.json（不提交 git）
- 云端同步 — 本地工具，不涉及云端服务
- 多用户协作 — 个人工具，无需用户管理

## Context

### 问题背景

Claude Code 支持项目级配置（`.claude/settings.json`），但当前只能通过手动编辑 JSON 文件来配置。用户有多个项目使用不同的 API 服务和模型，管理分散且容易出错。

### 参考项目

- **cc-switch** (https://github.com/farion1231/cc-switch)：成熟的桌面配置管理工具，支持多供应商、多项目管理。基于 Tauri 2 + React。

### 配置层级

Claude Code 配置层级：
| 层级 | 配置文件位置 | 优先级 |
|------|-------------|--------|
| User (全局) | `~/.claude/settings.json` | 低 |
| Project (项目) | `<项目根目录>/ .claude/settings.json` | 高 |
| Local (本地) | `<项目根目录>/ .claude/settings.local.json` | 最高 |

### 可覆盖字段

- `env`: ANTHROPIC_MODEL, ANTHROPIC_BASE_URL, ANTHROPIC_AUTH_TOKEN 等
- `model`: 默认模型
- `mcpServers`: MCP 服务器配置
- `permissions`: 权限规则
- `hooks`: 项目级钩子

## Constraints

- **技术栈**: Node.js 18+ + ink (React for CLI)
- **平台**: macOS, Windows, Linux
- **分发**: npm 包 + Git 仓库
- **安全**: API Token 存于 settings.local.json（不提交 git）
- **无外部服务**: 本地工具，不依赖云端服务

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 先 TUI 后桌面 | 快速迭代验证功能，降低开发风险 | — Pending |
| ink + React | React 组件式开发熟悉度高，生态成熟 | — Pending |
| 自定义模板先行 | 灵活性优先，预定义后续添加 | — Pending |
| 明文存储 Token | Claude Code 本身用明文，保持一致 | — Pending |
| npm + Git 分发 | npm 便于安装，Git 便于查看源码 | — Pending |

---
*Last updated: 2026-04-14 after Phase 05 completion (CLI Interface)*

## Evolution

**Phase 05 (CLI Interface) - Completed 2026-04-14:**
- CLI layer foundation complete: Commander.js entry point, 4 core commands (list, switch, current, template)
- Error handling module with ExitCodes and colored output via chalk
- Table formatter with cli-table3 for project listing
- TUI launch stubs ready for Phase 06 integration
- M4 verified: CLI independent of ink/react (architectural boundary enforced)
- 491 tests passing, D-01 through D-08 design decisions implemented
- Ready for Phase 06 (Core TUI) parallel execution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state