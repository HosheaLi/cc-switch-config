# Phase 6: Core TUI - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in 06-CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-14
**Phase:** 06-core-tui
**Areas discussed:** UI布局、导航模式、组件策略、预览方式、键盘导航、搜索功能、样式风格、加载指示、Escape处理、确认对话框、错误展示、目录结构、测试策略、性能实现

---

## UI布局

| Option | Description | Selected |
|--------|-------------|----------|
| 单屏列表为主 | 项目列表为主体，选择后弹出配置编辑表单，最常用操作在一屏完成 | ✓ |
| 双栏分屏布局 | 左侧项目列表 + 右侧配置详情，实时预览，信息密度高但占用空间 | |
| 卡片网格视图 | 初始显示项目卡片，点击进入详情，视觉更丰富但操作步骤多 | |

**User's choice:** 单屏列表为主
**Notes:** 最常用操作在一屏完成，符合用户直觉

---

## 导航模式

| Option | Description | Selected |
|--------|-------------|----------|
| Tab切换模式 | Tab切换项目列表/模板管理/设置，每个Tab内上下导航，简单直观 | |
| 层级导航模式 | 每屏独立，Enter进入下一级，Esc返回上一级，层级清晰 | ✓ |
| Command模式 | 底部状态栏显示当前模式，Ctrl+X切换，vim风格 | |

**User's choice:** 层级导航模式
**Notes:** 层级清晰，符合用户直觉，Enter/Esc 标准导航

---

## 组件策略

| Option | Description | Selected |
|--------|-------------|----------|
| @inkjs/ui现成组件 | 使用@inkjs/ui的Select/Input等现成组件，快速实现，样式统一 | |
| 完全自定义组件 | 全部自定义Ink React组件，完全控制样式和交互，但开发周期长 | |
| 混合策略 | 核心选择器用@inkjs/ui，特殊组件如diff预览自定义 | ✓ |

**User's choice:** 混合策略
**Notes:** 核心选择器快速实现，特殊需求自定义，平衡效率和控制

---

## 预览方式

| Option | Description | Selected |
|--------|-------------|----------|
| 底部弹出预览 | 选择后底部弹出panel显示将要修改的字段，不离开列表界面 | ✓ |
| 侧边实时预览 | 左右分栏，左侧项目列表，右侧实时显示选中项目的当前配置 | |
| 独立确认屏幕 | Enter进入独立的预览确认界面，展示完整diff，确认后应用 | |

**User's choice:** 底部弹出预览
**Notes:** 不离开列表界面，即时反馈，信息密度适中

---

## 键盘导航

| Option | Description | Selected |
|--------|-------------|----------|
| 双模式导航 | 支持上下箭头和j/k两种方式，满足vim和非vim用户 | ✓ |
| 仅箭头键 | 仅支持上下箭头，简单直观，避免快捷键冲突 | |
| 完整vim模式 | 支持hjkl完整vim导航，h返回/l进入，适合vim用户 | |

**User's choice:** 双模式导航
**Notes:** 覆盖vim和非vim用户 (U3)

---

## 搜索功能

| Option | Description | Selected |
|--------|-------------|----------|
| 即时模糊搜索 | 内置模糊搜索，用户输入即时过滤列表，快速定位 | ✓ |
| 显式搜索触发 | Ctrl+F触发搜索框，输入后过滤，明确搜索意图 | |
| Phase 7延后 | 不实现搜索功能，依赖用户滚动导航，Phase 7添加 | |

**User's choice:** 即时模糊搜索
**Notes:** 满足 F14 需求，用户输入即时过滤

---

## 样式风格

| Option | Description | Selected |
|--------|-------------|----------|
| 极简风格 | 最小化样式，仅必要颜色区分，突出信息内容 | |
| 丰富视觉反馈 | 丰富颜色和状态指示，高亮当前项、成功/错误状态 | ✓ |
| 与CLI统一配色 | 使用chalk统一CLI/TUI颜色方案，保持一致性 | |

**User's choice:** 丰富视觉反馈
**Notes:** 高亮当前项、状态图标，明确操作反馈

---

## 加载指示

| Option | Description | Selected |
|--------|-------------|----------|
| Spinner加载指示 | 操作开始显示spinner，完成后消失，简单有效 | |
| 进度条指示 | 底部显示进度条，适合批量扫描等长时间操作 | |
| 阈值触发显示 | 快速操作不显示，仅慢操作(>500ms)显示spinner | ✓ |

**User's choice:** 阈值触发显示
**Notes:** 避免视觉干扰，慢操作提供反馈

---

## Escape处理

| Option | Description | Selected |
|--------|-------------|----------|
| 标准Escape行为 | 任何界面Esc返回上一级，底层界面Esc退出TUI | ✓ |
| Esc退出应用 | Esc退出整个TUI，Ctrl+C返回上一级，vim风格 | |
| 区分对话框行为 | Esc在确认对话框取消，其他界面退出TUI | |

**User's choice:** 标准Escape行为
**Notes:** 符合用户直觉 (U4)

---

## 确认对话框

| Option | Description | Selected |
|--------|-------------|----------|
| 底部弹出确认 | 底部弹出小型确认框，不离开主界面，y/n确认 | |
| 全屏确认界面 | 全屏覆盖式确认界面，明确提示危险操作 | ✓ |
| 仅危险操作确认 | 仅删除操作需确认，其他操作直接执行 | |

**User's choice:** 全屏确认界面
**Notes:** 危险操作明确提示，用户注意力集中 (U5)

---

## 错误展示

| Option | Description | Selected |
|--------|-------------|----------|
| 底部Toast错误 | 底部弹出错误消息，3秒后自动消失或手动关闭 | |
| 状态栏错误显示 | 底部固定状态栏显示错误，持续显示直到解决 | ✓ |
| 全屏错误界面 | 全屏错误界面，显示错误详情和建议操作 | |

**User's choice:** 状态栏错误显示
**Notes:** 持续显示直到解决，不中断操作

---

## 目录结构

| Option | Description | Selected |
|--------|-------------|----------|
| screens/components分离 | src/tui/screens存放各屏幕组件，src/tui/components存放复用组件 | ✓ |
| 按功能模块划分 | src/tui按功能模块划分，如project-list/template-manager等 | |
| 扁平结构 | src/tui直接存放所有组件，无子目录，简单直接 | |

**User's choice:** screens/components分离
**Notes:** 职责清晰，易于维护

---

## 测试策略

| Option | Description | Selected |
|--------|-------------|----------|
| ink-testing-library | 使用ink-testing-library测试组件行为，每个screen有对应test | ✓ |
| E2E流程测试 | E2E测试为主，验证完整用户流程 | |
| 核心路径测试 | 关键路径测试，80%coverage要求 | |

**User's choice:** ink-testing-library
**Notes:** 测试组件行为而非实现，符合 TDD 原则

---

## 性能实现

| Option | Description | Selected |
|--------|-------------|----------|
| 虚拟滚动实现 | <50ms渲染100项列表，虚拟滚动处理大列表 | ✓ |
| 先实现后优化 | 先实现全量渲染，后续优化，Phase 6不强制50ms | |
| 分页限制显示 | 限制显示50项，超过分页或滚动加载 | |

**User's choice:** 虚拟滚动实现
**Notes:** 满足 N4 性能要求，大列表流畅滚动

---

## Claude's Discretion

- 具体组件命名风格
- 状态管理具体方案 (React state vs Context vs Zustand)
- 导航栈实现细节
- fuzzy search 算法选择 (fuse.js vs 自定义)
- 颜色方案具体配色

---

## Deferred Ideas

None — discussion stayed within phase scope.

---

*Discussion log for Phase 06-core-tui*
*Gathered: 2026-04-14*