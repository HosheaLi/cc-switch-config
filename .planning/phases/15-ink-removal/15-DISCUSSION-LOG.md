# Phase 15: Ink Removal - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in 15-CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-08
**Phase:** 15-ink-removal
**Areas discussed:** Template* 命运, tui-launch.ts 重构, 依赖清理策略, 测试覆盖缺口

---

## Template* 命运

| Option | Description | Selected |
|--------|-------------|----------|
| 保留 Template*，仅删 CFG-06 标记 | TemplateConfig 和 ApiConfig 服务不同场景，两者共存合理 | |
| 逐步迁移，Phase 15 只删 src/tui/ | Template* → ApiConfig 迁移留到后续重构 | |
| 删除 Template*，迁移到 ApiConfig | 严格按 CFG-06 执行，需重构 template 命令/export/import/wizard/ConfigService | ✓ |

**User's choice:** 删除 Template*，迁移到 ApiConfig
**Notes:** 严格按 ROADMAP 成功标准 CFG-06 执行。工作量显著增加但用户接受。

---

## tui-launch.ts 重构

| Option | Description | Selected |
|--------|-------------|----------|
| 重构 + 重命名 | 删 launchInkTUI()，保留纯 CLI 函数，重命名为 cli-launch.ts | ✓ |
| 拆分迁移 + 删除文件 | 将函数迁移到对应 wizard，删除整个文件 | |
| 最小改动 | 仅删 Ink 引用，保留文件名 | |

**User's choice:** 重构 + 重命名 (推荐)
**Notes:** 文件名 "tui-launch" 有误导性，重命名消除概念残留。

---

## 依赖清理策略

| Option | Description | Selected |
|--------|-------------|----------|
| 删除 9 个包 + 保留 fuse.js | ink(5)+react(1)+dev(3) 删除，fuse.js 保留 | ✓ |
| 删除 9 个包 + 删除 fuse.js | 额外删除 fuse.js，需确认无 prompts 层依赖 | |

**User's choice:** 删除 9 个包 + 保留 fuse.js (推荐)

---

## Chalk 引用清理

| Option | Description | Selected |
|--------|-------------|----------|
| 迁移到 picocolors 主题模块 | prompts 层 chalk → src/lib/theme/ 模块 | ✓ |
| 保留 chalk，不扩展范围 | Phase 15 只关注 Ink 移除和 Template* 迁移 | |

**User's choice:** 迁移到 picocolors 主题模块 (推荐)
**Notes:** Phase 14 已建立主题模块，顺带完成迁移是合理的。

---

## 测试覆盖缺口

| Option | Description | Selected |
|--------|-------------|----------|
| 补充迁移路径测试 | 聚焦 Template* → ApiConfig 迁移关键路径的集成测试 | ✓ |
| 不新增，依赖现有覆盖 | 信任现有 prompts 和 lib 层测试 | |
| 端到端回归测试 | 对所有受影响命令补充 E2E 测试 | |

**User's choice:** 补充迁移路径测试 (推荐)
**Notes:** 不回溯式补充 tui/ 测试，聚焦迁移路径。

---

## Claude's Discretion

- 数据迁移脚本具体实现（自动 vs 手动 vs 首次运行检测）
- template 命令废弃策略（删除 vs 重定向 vs alias）
- cli-launch.ts 函数命名
- 迁移测试用例设计

## Deferred Ideas

- Fuzzy search 改进 (FUZZ-01) — v3
