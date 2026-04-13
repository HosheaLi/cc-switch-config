# Phase 4: Services Layer - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-13
**Phase:** 04-services-layer
**Areas discussed:** Architecture, Error Handling, Template Application, Project Detection, Scan Directories, Provider Test, Service Export

---

## Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| 类 + 构造函数注入 | Services 作为类实现，注入 Repository 依赖 | ✓ |
| 函数 + 直接导入 | Services 作为纯函数，直接导入 Repositories | |
| 单例类 | Services 作为单例类，全局共享实例 | |

**User's choice:** 类 + 构造函数注入

---

## Error Handling

| Option | Description | Selected |
|--------|-------------|----------|
| 抛出 Error | Service 失败时抛出 Error，调用方 try/catch | ✓ |
| 返回 Result 类型 | 返回 { success, data/error } 结构 | |
| 混合策略 | 低级错误抛出，业务错误返回 Result | |

**User's choice:** 抛出 Error

---

## Template Application

| Option | Description | Selected |
|--------|-------------|----------|
| Deep Merge | 模板与现有配置 deep merge | ✓ |
| 完全替换 | 模板完全替换现有配置 | |
| Preview + Confirm | 应用前显示 merge preview | |

**User's choice:** Deep Merge

---

## Project Detection

| Option | Description | Selected |
|--------|-------------|----------|
| 手动注册 | 用户手动 add/remove 项目 | |
| 自动扫描 + 手动确认 | 扫描指定目录发现项目，弹出确认列表 | ✓ |
| 进入目录时检测 | 进入目录时自动检测并提示注册 | |

**User's choice:** 自动扫描 + 手动确认

---

## Scan Directories

| Option | Description | Selected |
|--------|-------------|----------|
| 最近项目父目录 | 扫描 AppState 中记录的最近项目列表目录 | |
| 用户配置根目录 | 用户指定一个或多个目录作为扫描根目录 | ✓ |
| 两者结合 | 扫描最近项目父目录 + 用户配置的额外目录 | |

**User's choice:** 用户配置根目录

---

## Provider Test

| Option | Description | Selected |
|--------|-------------|----------|
| 基础连通性测试 | HEAD / 或 health endpoint | ✓ |
| 完整请求测试 | 使用真实或模拟请求测试 API 响应 | |
| 可选测试 | Provider 保存时测试可选 | |

**User's choice:** 基础连通性测试

---

## Service Export

| Option | Description | Selected |
|--------|-------------|----------|
| Barrel Export | 统一从 src/lib/services/index.ts 导出 | ✓ |
| 直接导入 | 直接从具体文件导入 Service | |

**User's choice:** Barrel Export

---

## Claude's Discretion

- Service 类方法命名风格
- 具体方法签名细节
- Scan 目录默认值
- Provider 测试超时时间
- 扫描并发数和性能优化策略

---

*Discussion log for: 04-services-layer*
*Date: 2026-04-13*
