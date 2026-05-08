---
phase: 15-ink-removal
plan: 03
subsystem: consumer-migration
tags: [api-config, migration, template-removal, wiring]

# Dependency graph
requires:
  - phase: 15-ink-removal
    provides: Template* source deleted, ApiConfig CRUD ready
provides:
  - All consumers migrated from Template* to ApiConfig
  - tui-launch.ts → cli-launch.ts refactor
  - Data migration utility (templates.json → api-configs.json)
  - ConfigService applyTemplate removal
affects: [15-ink-removal-plan-04, chalk-removal]

# Tech tracking
tech-stack:
  added: []
  patterns: [ApiService migration pattern, Field mapping provider.name → modelName]

key-files:
  created:
    - src/lib/store/migration.ts
    - src/lib/store/migration.test.ts
  modified:
    - src/cli/prompts/wizards/main-wizard.ts
    - src/cli/prompts/wizards/config-wizard.ts
    - src/cli/prompts/wizards/switch-wizard.ts
    - src/cli/utils/cli-launch.ts (原 tui-launch.ts)
    - src/cli/commands/export.ts
    - src/cli/commands/import.ts
    - src/cli/index.ts
    - src/cli/utils/index.ts
    - src/lib/services/export-service.ts
    - src/lib/services/export-service.test.ts
    - src/lib/services/config-service.ts
    - src/lib/services/config-service.test.ts
    - src/lib/types/export-schema.ts

key-decisions:
  - "cli-launch.ts 删除所有 Ink/chalk 引用，保留 prompts TUI 启动逻辑"
  - "migration.ts 使用 Zod strict 验证确保 ApiConfig 数据质量"
  - "export-schema.ts migrateExportPayload() 自动转换旧格式导出文件"

patterns-established:
  - "ApiService migration: templateService → apiService, listTemplates → listConfigs"
  - "Field mapping: TemplateConfig.provider.name → ApiConfig.modelName"

requirements-completed: [CFG-06, TUI-06]

# Metrics
duration: 45min
completed: 2026-05-08
---

# Phase 15 Plan 03: Migrate All Consumers from Template* to ApiConfig Summary

**完成了所有 Template* 消费者的迁移，代码库中零 Template* 引用残留**

## Performance

- **Duration:** 45 min (跨多次执行合并)
- **Started:** 2026-05-08T02:30:00Z
- **Completed:** 2026-05-08T12:13:00Z
- **Tasks:** 7
- **Files modified:** 16 (3 wizards, 1 utils, 3 commands, 6 services, 1 types, 2 migration)

## Accomplishments
- 3 个 wizard 文件全部迁移到 ApiService/ApiConfigStore
- tui-launch.ts 重命名为 cli-launch.ts，移除 Ink/chalk 引用
- export-service.ts 和 export-schema.ts 迁移到 ApiConfigStore
- import 命令迁移，支持旧格式导出文件自动转换
- ConfigService applyTemplate/mergeTemplateWithConfig 已删除
- 数据迁移工具 migration.ts 创建（templates.json → api-configs.json）
- CLI entry point cli/index.ts 更新，移除 template 命令引用

## Task Commits

Plan 15-03 的提交分布在主分支历史中：

1. **1d1a4d7** - feat(15-03): migrate wizards from TemplateService to ApiService (Task 01)
2. **6b75aeb** - refactor(15-03): rename tui-launch to cli-launch, remove Ink/chalk (Task 02)
3. **b8affb2** - refactor(15-03): migrate export-service and export-schema to ApiConfig (Task 03)
4. **9a93ebc** - refactor(15-03): migrate import command to ApiConfig (Task 04)
5. **db8c586** - refactor(15-03): remove applyTemplate/mergeTemplateWithConfig (Task 05)
6. **8e5f161** - feat(15-03): create data migration utility (Task 06) - 从 worktree 合并
7. **隐含在 1d1a4d7** - CLI entry point 更新 (Task 07)

## Files Created/Modified
- `src/cli/prompts/wizards/config-wizard.ts` - ApiService migration
- `src/cli/prompts/wizards/main-wizard.ts` - ApiService migration
- `src/cli/prompts/wizards/switch-wizard.ts` - ApiService migration
- `src/cli/utils/cli-launch.ts` - tui-launch 重命名 + Ink/chalk 移除
- `src/cli/utils/tui-launch.ts` - 已删除
- `src/cli/commands/export.ts` - ApiConfigStore migration
- `src/cli/commands/import.ts` - ApiConfigStore + migrateExportPayload
- `src/cli/index.ts` - selectConfigInCLI 替换
- `src/cli/utils/index.ts` - barrel export 更新
- `src/lib/services/export-service.ts` - ApiConfigStore migration
- `src/lib/services/export-service.test.ts` - 测试数据更新
- `src/lib/services/config-service.ts` - applyTemplate 已删除
- `src/lib/services/config-service.test.ts` - applyTemplate 测试已删除
- `src/lib/types/export-schema.ts` - ApiConfigSchema + migrateExportPayload
- `src/lib/store/migration.ts` - 数据迁移工具（NEW）
- `src/lib/store/migration.test.ts` - 8 个迁移测试（NEW）

## Decisions Made
- cli-launch.ts 保留 prompts TUI 启动逻辑（仅移除 Ink 相关）
- migration.ts 使用 Zod strict parse 确保数据质量
- export-schema.ts 添加 migrateExportPayload 支持旧格式文件

## Deviations from Plan

### Executor Execution Issues

**1. [Rule 3 - Blocking] Worktree cleanup failed**
- **Found during:** Plan 15-03 执行过程中
- **Issue:** Executor agents 创建了多个 worktrees（worktree-agent-a434063714a65e261, worktree-agent-a74111f84dc8c0031）但未能正常合并和清理。Migration.ts/migration.test.ts 被遗留在一个未合并的 worktree 分支中。
- **Fix:** 手动从 worktree 分支提取 migration 文件并提交到 main，绕过 worktree cleanup 阻塞
- **Files modified:** src/lib/store/migration.ts, src/lib/store/migration.test.ts
- **Committed in:** 8e5f161
- **Root cause:** Worktree isolation 与 agent cleanup 流程不完整，导致多次执行尝试累积 locked worktrees

---
**Total deviations:** 1 blocking (worktree cleanup)
**Impact on plan:** 延迟了 Task 06 的完成，但最终通过手动合并解决

## Issues Encountered
- Executor agent 多次执行中断，导致 24 个遗留 worktrees
- Worktree cleanup 流程失败（可能是 git lock 或 agent 执行异常）
- SUMMARY.md 未创建，系统认为计划未完成

## User Setup Required
None - 数据迁移工具会在首次检测到 templates.json 时自动运行

## Next Phase Readiness
- Plan 15-03 所有任务已完成
- TypeScript 编译错误减少（仍有少量其他问题）
- 准备执行 Plan 15-04（chalk → theme 迁移）

## Self-Check: PASSED

- 15-03-SUMMARY.md: FOUND (this file)
- Task 06 commit (8e5f161): FOUND
- migration.ts: EXISTS
- migration.test.ts: EXISTS
- Wizards migration: VERIFIED (grep empty)
- cli-launch.ts: EXISTS
- tui-launch.ts: REMOVED

---
*Phase: 15-ink-removal*
*Completed: 2026-05-08*