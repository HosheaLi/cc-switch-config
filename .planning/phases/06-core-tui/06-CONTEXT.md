# Phase 6: Core TUI - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

实现交互式 TUI，核心用户界面。包括项目列表屏幕、配置编辑表单、选择组件、导航钩子。

此 phase 在 CLI Interface (Phase 05) 基础上构建 TUI 界面：
- **TUI App Container**: ink/React 应用入口、状态管理
- **Project List Screen**: 项目列表展示、选择、导航
- **Config Editor Screen**: 配置编辑表单、模板应用
- **Selection Components**: Select, Input, Table, Spinner
- **Navigation Hooks**: useNavigation, useKeyInput, 路由管理
- **Preview Panel**: 底部弹出配置预览

**Scope anchor:** TUI 提供交互式管理，CLI 提供快速操作入口。TUI 调用 Services 获取数据，不直接操作 Repositories。

</domain>

<decisions>
## Implementation Decisions

### UI 布局设计
- **D-01:** 单屏列表为主
  - **Why:** 最常用操作在一屏完成，简单高效，信息密度适中
  - **How:** 项目列表为主体，选择后弹出配置编辑/预览面板

### 导航模式
- **D-02:** 层级导航模式
  - **Why:** 层级清晰，Enter 进入下一级，Esc 返回上一级，符合用户直觉
  - **How:** 每屏独立，栈式导航管理，支持 push/pop/screen

### 组件策略
- **D-03:** 混合策略 — @inkjs/ui 现成组件 + 自定义特殊组件
  - **Why:** 核心选择器用现成组件快速实现，diff 预览等特殊需求自定义
  - **How:** Select/Input 用 @inkjs/ui，PreviewPanel/ConfirmDialog 自定义

### 预览展示
- **D-04:** 底部弹出预览
  - **Why:** 不离开列表界面，即时反馈，信息密度适中
  - **How:** 选择后底部弹出 PreviewPanel，展示将要修改的字段

### 键盘导航
- **D-05:** 双模式导航 — 上下箭头 + j/k
  - **Why:** 满足 vim 和非 vim 用户 (U3)，覆盖最大用户群
  - **How:** useKeyInput hook 处理两种按键映射

### 搜索功能
- **D-06:** 即时模糊搜索
  - **Why:** 用户输入即时过滤，快速定位，满足 F14 需求
  - **How:** 内置 fuzzy filter，用户输入时实时更新列表

### 视觉风格
- **D-07:** 丰富视觉反馈
  - **Why:** 高亮当前项、成功/错误状态，用户操作有明确反馈
  - **How:** 使用 chalk 颜色方案，状态图标，高亮边框

### 加载指示
- **D-08:** 阈值触发显示
  - **Why:** 快速操作不显示，避免视觉干扰，慢操作提供反馈
  - **How:** 操作开始计时，>500ms 显示 spinner

### Escape 行为
- **D-09:** 标准 Escape 行为 — 任何界面 Esc 返回上一级
  - **Why:** 符合用户直觉 (U4)，底层界面 Esc 退出 TUI
  - **How:** 导航栈处理 Esc，非底层 pop，底层 exit

### 确认对话框
- **D-10:** 全屏确认界面
  - **Why:** 危险操作明确提示，用户注意力集中，防止误操作 (U5)
  - **How:** 独立 ConfirmScreen，显示操作详情，y/n 确认

### 错误展示
- **D-11:** 状态栏错误显示
  - **Why:** 持续显示直到解决，用户可查看错误详情，不中断操作
  - **How:** 底部固定 StatusBar，错误时显示红色消息，可点击查看详情

### 目录结构
- **D-12:** screens/components 分离
  - **Why:** 屏幕组件和复用组件职责清晰，易于维护
  - **How:** `src/tui/screens/` 存放各屏幕，`src/tui/components/` 存放复用组件

### 测试策略
- **D-13:** ink-testing-library — 每个 screen 有对应 test
  - **Why:** 测试组件行为而非实现，符合 TDD 原则，覆盖率要求
  - **How:** 使用 ink-testing-library 的 render + fireInput

### 性能实现
- **D-14:** 虚拟滚动实现 — <50ms 渲染 100 项列表
  - **Why:** 满足 N4 性能要求，大列表流畅滚动
  - **How:** 仅渲染可视区域项目，动态加载/卸载

### Claude's Discretion
- 具体组件命名风格
- 状态管理具体方案 (React state vs Context vs Zustand)
- 导航栈实现细节
- fuzzy search 算法选择 (fuse.js vs 自定义)
- 颜色方案具体配色

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior Phase Decisions
- `.planning/phases/05-cli-interface/05-CONTEXT.md` — CLI 入口、D-02 智能模式、D-06 TUI fallback
- `.planning/phases/04-services-layer/04-CONTEXT.md` — Services 层架构、依赖注入
- `.planning/phases/02-types-validation/02-CONTEXT.md` — 类型系统、验证框架

### Requirements
- `.planning/REQUIREMENTS.md` §F2 — Interactive TUI Selector
- `.planning/REQUIREMENTS.md` §F3 — Configuration Preview
- `.planning/REQUIREMENTS.md` §N4 — Responsive TUI (<50ms)
- `.planning/REQUIREMENTS.md` §U3 — Keyboard Navigation (arrows + j/k)
- `.planning/REQUIREMENTS.md` §U4 — Escape to Cancel
- `.planning/REQUIREMENTS.md` §U5 — Confirmation Prompts
- `.planning/REQUIREMENTS.md` §F14 — Fuzzy Search (Phase 6 实现)

### Existing Code (TUI Stubs)
- `src/cli/utils/tui-launch.ts` — launchTUI 和 selectTemplateInTUI stubs 等待替换

### Existing Code (Services)
- `src/lib/services/index.ts` — Services barrel export
- `src/lib/services/project-service.ts` — listProjects, getProjectById
- `src/lib/services/template-service.ts` — listTemplates, applyTemplate, getAll
- `src/lib/services/config-service.ts` — readProjectConfig, writeConfig

### Dependencies
- `ink` (7.0.0) — TUI framework
- `react` (19.2.5) — Ink 依赖
- `@inkjs/ui` — 现成 UI 组件 (待安装)
- `ink-testing-library` — 测试工具 (待安装)
- `fuse.js` — Fuzzy search (待安装，D-06)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/services/*.ts`: Services 完整实现 — TUI 直接调用获取数据
- `src/cli/utils/tui-launch.ts`: TUI stubs — 替换为真实 Ink 实现
- `chalk` (5.6.2): 颜色方案 — CLI/TUI 统一配色

### Established Patterns
- ink 7.0.0 + React 19.2.5 已安装
- Services 构造函数注入 (Phase 04 D-01)
- Services 抛出 Error (Phase 04 D-02)
- Barrel export pattern
- TDD workflow — ink-testing-library

### Integration Points
- `src/tui/`: 新目录存放所有 TUI 实现
- `src/tui/screens/`: 各屏幕组件
- `src/tui/components/`: 复用 UI 组件
- `src/tui/hooks/`: 导航和输入 hooks
- `src/tui/index.ts`: TUI barrel export
- `src/cli/utils/tui-launch.ts`: 替换 stub 为真实 TUI 调用

</code_context>

<specifics>
## Specific Ideas

- 项目列表单屏布局：顶部标题 + 中间列表 + 底部状态栏
- 选择后底部弹出 PreviewPanel：显示项目路径、当前配置、将应用的模板
- Enter 进入 ConfigEditorScreen：编辑模板参数或确认应用
- Esc 返回上一级：确认界面 Esc 返回列表，列表界面 Esc 退出 TUI
- j/k 和上下箭头同时支持：useKeyInput hook 统一处理
- 输入即时模糊过滤：底部输入框，输入时实时过滤列表
- 全屏确认界面：删除操作显示 ConfirmScreen，显示 "Delete template X? y/n"
- 状态栏错误显示：操作失败时底部 StatusBar 显示红色错误，点击可查看详情

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 06-core-tui*
*Context gathered: 2026-04-14*