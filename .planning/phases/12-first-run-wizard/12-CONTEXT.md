# Phase 12: First-Run Wizard - Context

**Gathered:** 2026-04-30
**Status:** Ready for planning

<domain>
## Phase Boundary

实现首次引导流程：新用户安装后自动触发 wizard（API 配置 → 扫描目录 → 扫描 → 主界面）。检测 firstRunCompleted flag，并行化扫描，扩展跳过目录列表，显示进度指示器。

**Scope anchor:** ONB-01~05 (首次引导、检测、并行化、跳过目录、进度)
**Out of scope:** Switch 流程(Phase 13)、Terminal Aesthetic(Phase 14)、Ink移除(Phase 15)

</domain>

<decisions>
## Implementation Decisions

### 首次检测触发
- **D-01:** 触发时机为 CLI entry point（`cc-config` 无参数调用时）
- **D-02:** 触发条件：ApiConfigStore 为空 + ProjectIndex 为空（双条件）
- **D-03:** AppState 添加 `firstRunCompleted: boolean` 字段
- **D-04:** wizard 完成后设置 `firstRunCompleted = true`

### 扫描并行化
- **D-05:** walkDirectory L128 for-of 改为 Promise.all 并行扫描子目录
- **D-06:** 每个 subdirectory 独立 catch，失败不影响其他（部分失败继续）
- **D-07:** 保持 console.error 日志记录失败目录

### 跳过目录扩展
- **D-08:** 硬编码 DEFAULT_SKIP_DIRS 常量：
  ```
  node_modules, .git, dist, build, target, .venv, __pycache__
  ```
- **D-09:** AppState 添加 `skipDirectories: string[]` 字段（可覆盖默认）
- **D-10:** 合并策略：DEFAULT_SKIP_DIRS + user skipDirectories

### 进度指示器样式
- **D-11:** 保持现有 spinner 实现（main-wizard.ts L22-45 自定义实现）
- **D-12:** 后期根据用户反馈决定是否安装 ora 或增加实时计数
- **D-13:** 完成时显示发现项目数（现有行为）

### Wizard 流程顺序
- **D-14:** 按 ROADMAP ONB-01 顺序：
  1. 检测是否首次运行
  2. API 配置输入（复用 inputFullApiConfig）
  3. 扫描目录选择（复用 selectDirectory）
  4. 执行扫描（并行化）
  5. 选择项目注册（复用 selectFromScanResults）
  6. 选择配置应用（复用 selectTemplate）
  7. 确认应用
  8. 设置 firstRunCompleted = true

### Claude's Discretion
- walkDirectory Promise.all 具体实现细节
- DEFAULT_SKIP_DIRS 常量命名和位置
- spinner 帧率和样式
- firstRunCompleted 检测在 CLI index.ts 中的位置

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/ROADMAP.md` §Phase 12 — Goal, Success Criteria (5 criteria)
- `.planning/REQUIREMENTS.md` §ONB-01~05 — 首次引导具体需求定义

### Prior Phase 成果 (依赖)
- `src/cli/prompts/components/input-api-key.ts` — inputFullApiConfig (Phase 11 SEC-04)
- `src/cli/prompts/components/select-directory.ts` — selectDirectory (Phase 9)
- `src/cli/prompts/components/select-project.ts` — selectProject, selectFromScanResults
- `src/cli/prompts/components/select-template.ts` — selectTemplate
- `src/cli/prompts/components/confirm-action.ts` — confirmAction
- `src/lib/store/state.ts` — AppState 类（需添加字段）
- `src/lib/services/project-service.ts` — walkDirectory（需改为并行）
- `src/lib/store/api-config.ts` — ApiConfigStore（用于检测配置）
- `src/lib/store/project.ts` — ProjectIndex（用于检测项目）

### 参考代码结构
- `src/cli/prompts/wizards/main-wizard.ts` — 现有 wizard 流程（需重构）
- `src/cli/index.ts` — CLI 入口（需添加 firstRun 检测）

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- inputFullApiConfig(): 完整 API 配置输入流程（password input 已实现）
- selectDirectory(): 扫描目录选择组件
- selectProject()/selectFromScanResults(): 项目选择组件
- confirmAction(): 确认组件
- createSpinner(): 自定义进度指示器
- AppState: 状态持久化（需添加字段）
- ProjectService.scanProjects(): 扫描逻辑（需并行化）

### Established Patterns
- Prompts wizard flow: 线性流程，每步 prompts 选择
- Services/Store 分层：Clean Architecture (M4)
- 原子写入 + 备份机制 (R1/R2)
- Console.error 记录错误，不中断流程

### Integration Points
- src/cli/index.ts: CLI entry，需添加 firstRun 检测
- src/lib/store/state.ts: AppStateData 接口，需添加 firstRunCompleted + skipDirectories
- src/lib/services/project-service.ts: walkDirectory，需改为 Promise.all

</code_context>

<specifics>
## Specific Ideas

- 首次运行体验：`cc-config` 无参数自动进入 wizard
- 并行扫描：Promise.all 替代 for-of await
- 跳过目录：默认值覆盖常见开发目录
- 进度样式：先简单 spinner，后优化

</specifics>

<deferred>
## Deferred Ideas

- ora 库安装 + 实时计数 — 后期根据用户反馈
- fuzzy 搜索集成 — v3 FUZZ-01
- wizard 状态持久化（中断恢复） — v2 STATE-01

</deferred>

---
*Phase: 12-first-run-wizard*
*Context gathered: 2026-04-30*