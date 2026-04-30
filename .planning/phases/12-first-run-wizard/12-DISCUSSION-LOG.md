# Phase 12: First-Run Wizard - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-30
**Phase:** 12-first-run-wizard
**Areas discussed:** 首次检测触发, 扫描并行化, 跳过目录扩展, 进度指示器样式

---

## 首次检测触发

| Option | Description | Selected |
|--------|-------------|----------|
| CLI entry point | 无注册项目 + 无 API 配置时自动触发 wizard | ✓ |
| 每次命令检查 | 每次命令执行前都检查 firstRunCompleted | |
| 显式 wizard 命令 | 只在用户运行 cc-config 或 cc-config wizard 时触发 | |

**User's choice:** CLI entry point (Recommended)
**Notes:** 符合 ROADMAP ONB-01 流程描述，无参数调用自动进入 wizard

---

## 触发条件

| Option | Description | Selected |
|--------|-------------|----------|
| 无配置 + 无项目 | 同时检查 ApiConfigStore + ProjectIndex 是否为空 | ✓ |
| 只 firstRunCompleted flag | 只检查 flag，不考虑实际数据状态 | |
| flag + 后台验证 | 以 flag 为主，首次完成时后台验证配置/项目是否存在 | |

**User's choice:** 无配置 + 无项目 (Recommended)
**Notes:** 双条件检测，更可靠

---

## 扫描并行化策略

| Option | Description | Selected |
|--------|-------------|----------|
| 子目录 Promise.all | L128 for-of 改为 Promise.all，并行扫描子目录 | ✓ |
| Root + 子目录全并行 | 同时启动多个 rootDir 扫描 | |
| Worker threads | 使用 worker threads 进行 CPU 密集型文件检查 | |

**User's choice:** 子目录 Promise.all (Recommended)
**Notes:** 简单修改，保持 maxDepth 限制

---

## 并行扫描错误处理

| Option | Description | Selected |
|--------|-------------|----------|
| 部分失败继续 | 每个目录独立 catch，失败不影响其他 | ✓ |
| 任一失败即中止 | 任一目录失败则整体扫描失败 | |
| 收集后汇总报告 | 收集所有错误，扫描结束后汇总报告 | |

**User's choice:** 部分失败继续 (Recommended)
**Notes:** 保持现有 console.error 日志

---

## 跳过目录策略

| Option | Description | Selected |
|--------|-------------|----------|
| 硬编码常量 | DEFAULT_SKIP_DIRS 常量，无需用户配置 | |
| 用户配置化 | AppState skipDirectories 字段，用户可自定义 | |
| 默认 + 可覆盖 | 硬编码默认值 + AppState 可覆盖 | ✓ |

**User's choice:** 默认 + 可覆盖
**Notes:** 兼顾简单和灵活

---

## 进度指示器样式

| Option | Description | Selected |
|--------|-------------|----------|
| 简单 spinner | 保持现有实现，无新依赖 | |
| ora + 实时计数 | 安装 ora，显示实时扫描计数 | |
| 静默扫描 + 完成总结 | 终端标题显示项目计数，无额外输出 | |

**User's choice:** 先使用 spinner，后期根据使用情况决定是否增加
**Notes:** 灵活方案，保持现有实现，不做过度优化

---

## Claude's Discretion

- walkDirectory Promise.all 具体实现细节
- DEFAULT_SKIP_DIRS 常量命名和位置
- spinner 帧率和样式
- firstRunCompleted 检测在 CLI index.ts 中的位置

---

## Deferred Ideas

- ora 库安装 + 实时计数 — 后期根据用户反馈
- fuzzy 搜索集成 — v3 FUZZ-01
- wizard 状态持久化（中断恢复） — v2 STATE-01