# Constitution: CCAPISwitch

> 项目核心原则，所有决策和实现必须遵循

---
version: 1.0
created: 2026-04-14
status: active
---

## Core Principles

> 定义项目的核心价值观和指导原则

- **Security-First**: Token 安全隔离，所有敏感数据存于 settings.local.json（不提交 git），检测 git tracking 防止泄露
- **Safety-First**: 原子写入、备份系统、错误恢复机制，防止配置损坏
- **TDD-Strict**: 测试驱动开发，先写测试再实现，核心模块 ≥80% 覆盖率

## Architecture Constraints

> 架构层面的硬性约束

- **Clean Architecture**: Services → Store → CLI/TUI 单向依赖，核心层不依赖外围层
- **Dependency Injection**: Services 构造函数注入 Repositories/Store，便于测试和替换
- **Schema-First**: Zod schemas 作为单一数据源，TypeScript 类型从 schema 推断
- **Barrel Export**: 每个模块必须有 index.ts barrel export，统一导出入口

## Code Standards

> 代码层面的标准要求

- **Full TypeScript**: 全部 TypeScript，禁用 `any`（CLI 边界可例外）
- **80% Test Coverage**: Services/Store/CLI/TUI 模块必须有 ≥80% 测试覆盖率
- **Barrel Export**: 每个模块必须有 `index.ts` barrel export
- **No UI in Services**: Services/Store 禁止导入 ink/react 等 UI 依赖（M4 验证）

## Technology Stack

> 技术栈选择

- **Language**: TypeScript (ESM)
- **Framework**: ink (React for CLI) + Commander.js
- **Database**: 本地 JSON 文件 (conf)
- **Deployment**: npm 包 + Git 仓库

## Forbidden Patterns

> 禁止使用的模式和做法

- ❌ **Hardcoded Tokens**: 所有 API tokens 必须存于 settings.local.json，禁止硬编码
- ❌ **Skip Atomic Writes**: 文件写入必须使用原子操作（write-rename pattern），禁止跳过
- ❌ **Skip Backup**: 修改配置前必须创建备份，禁止跳过备份步骤
- ❌ **Direct fs in Services**: Services/Store 禁止直接调用 fs 模块，必须通过 Repository 层

## Required Patterns

> 必须遵循的模式

- ✅ **Atomic Writes**: 所有文件写入使用 `write-rename` pattern (fs-extra)
- ✅ **Backup Before Modify**: 修改配置前创建 timestamped backup
- ✅ **Repository Pattern**: 数据访问通过 Repository 层封装
- ✅ **Service Layer**: 业务逻辑在 Services 层，CLI/TUI 调用 Services
- ✅ **Zod Validation**: 所有配置通过 Zod schema 验证
- ✅ **Constructor Injection**: Services 通过构造函数注入依赖

## Review Checklist

> 每次代码审查必须检查的项目

- [ ] 符合 Security-First（Token 隔离）
- [ ] 符合 Safety-First（原子写入、备份）
- [ ] 符合 TDD-Strict（测试覆盖率 ≥80%）
- [ ] 符合 Clean Architecture（单向依赖）
- [ ] 符合 Dependency Injection（构造函数注入）
- [ ] 符合 Schema-First（Zod 验证）
- [ ] 符合 Barrel Export（index.ts 导出）
- [ ] 无 Forbidden Patterns（硬编码、跳过安全机制）
- [ ] 有 Required Patterns（原子写入、备份、Repository）

---

## Enforcement

宪法在以下流程中强制执行：

1. **Phase Planning**: `/gsd:plan-phase` 检查架构约束
2. **Code Review**: 审查时检查违反禁止模式
3. **Test Coverage**: CI 验证 ≥80% 覆盖率
4. **M4 Verification**: Services 禁止导入 UI 依赖

---

*Constitution for: CCAPISwitch*
*Created: 2026-04-14*
*Status: Active*