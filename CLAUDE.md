# cc-config — CLAUDE.md

## 项目概述

CLI/TUI 工具，管理 Claude Code 项目级 API 提供商配置。
- 版本: 0.4.0
- 里程碑: v2.0 Terminal-Native ✅ (2026-05-12)
- 语言: TypeScript (ESM, NodeNext)
- 构建: tsup → ESM, `dist/index.js`
- 测试: vitest + v8 coverage

## 架构

```
src/index.ts          # shebang 入口 → CLI
src/cli/              # CLI 层 (commands/prompts/dashboard/theme/output)
src/lib/              # 核心库 (services/store/types/security/file-system/config)
  services/           # 业务逻辑 (ConfigService/ProjectService/ExportService/UndoService/ApiService)
  store/              # 数据存储 (api-config/watcher)
  types/              # Zod 类型定义 + 验证
  security/           # API key 安全 (加密/脱敏/token检查)
  file-system/        # 文件操作 (JSON/备份/错误增强)
  config/             # 配置版本管理 + 迁移
  constants/          # 常量
  paths/              # 路径解析
```

## 关键约定

- **D-01**: Services 作为类 + 构造函数注入
- **D-02**: Services 抛出 Error 错误处理
- **D-04**: 项目检测：自动扫描 + 手动确认
- **M4**: 模块分离（Services 不依赖 UI）
- **R1**: 原子写入（write-rename pattern）
- **R2**: 备份系统（备份 → 操作 → 回滚）
- 配置存储三元组: `(name/apiKey/baseUrl/modelName)` 或 `(name/mode/env[])`
- 精确字段替换: 只修改 env/model，保留 permissions/hooks/mcpServers
- API key: password-type input + masked display + 不暴露于 CLI args/logs
- 主题: OpenCode Terminal Aesthetic (picocolors, NO_COLOR 支持)

## 命令

```bash
npm run dev           # tsx 热重载开发
npm run build         # tsup 构建
npm test              # vitest run
npm run test:coverage # vitest run --coverage
npm run test:watch    # vitest 监听模式
npm run typecheck     # tsc --noEmit 类型检查
npm run bench         # 性能基准测试
npm run docs          # TypeDoc API 文档生成
```

## 文档

- [DEVELOPMENT.md](./DEVELOPMENT.md) — 开发指南（架构、测试、贡献）
- [RELEASE.md](./RELEASE.md) — 发布清单
- [USAGE.md](./USAGE.md) — 使用参考
- [README.md](./README.md) — 项目主页（英文）
- [README_CN.md](./README_CN.md) — 项目主页（中文）

## GSD 项目信息

- GSD 规划目录: `.planning/`
- 里程碑: v1.0 MVP (已发布) → v2.0 Terminal-Native (已完成) → v3.x (待规划)
- 15 阶段完成，核心模块测试覆盖 >=80%
- STATE.md 和 MILESTONES.md 在里程碑完成时归档
- 已归档阶段不再强制回溯，除非发现关键缺陷

## 代码风格

- ES2022 target, NodeNext module resolution
- 严格模式 `strict: true`
- 测试: vitest globals, Arrange-Act-Assert 模式
- 中文注释/提交/文档
- 函数 <50行, 文件 <800行, 嵌套 ≤4层
