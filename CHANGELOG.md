# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-05-09

### Changed

- **主题系统重构**：移除 Ink/chalk 依赖，迁移至基于 picocolors 的自定义 theme 模块
- **TUI 架构重构**：删除旧 config/main/scan/switch 向导，统一为 onboarding-wizard
- **命令输出统一**：所有 CLI 命令输出迁移至 theme 模块，确保一致的颜色和样式

### Added

- **Dashboard 模块**：新增仪表盘界面和 quick-switch 快捷切换功能
- **工具模块**：mask-config（配置脱敏）、service-factory（服务工厂）、spinner（加载动画）
- **共享版本管理**：新增 `src/version.ts` 统一管理版本号

### Removed

- 废弃类型 `provider.ts` 及其测试，由 store 层直接管理
- 空 `.gitkeep` 占位文件（file-system, security, docs/api）
- 旧 `select-template` 组件

### Fixed

- 根据代码审查报告修复多项问题（类型安全、错误处理）

## [0.1.0] - 2025-05-08

### Added

- Initial release of CC Config Switch
- CLI commands: `list`, `current`, `switch`, `undo`, `template`, `scan`, `auto-check`, `import`, `export`
- Interactive TUI for visual configuration management
- Profile CRUD operations for provider templates
- Configuration preview with unified diff display
- Automatic backup before every configuration change with undo support
- Schema validation for configurations with helpful error messages
- Shell hook integration for auto-switching on directory change
- Import/export functionality for backup and sharing
- Project scanning with registration support
- Connectivity testing for provider endpoints
- Watch mode for monitoring configuration changes

### Features

- Keyboard navigation (arrow keys + vim j/k)
- Fuzzy search for quick project filtering
- Real-time preview panel in TUI
- Color-coded diff display (red/green for removed/added)
- Merge or replace strategies for import
- Non-interactive mode for CLI automation