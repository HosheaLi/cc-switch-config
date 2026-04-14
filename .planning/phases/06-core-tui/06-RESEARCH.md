# Phase 06: Core TUI - Research

**Researched:** 2026-04-14
**Domain:** Ink TUI Framework (React for CLI), Component Architecture, Navigation Patterns
**Confidence:** HIGH

## Summary

Phase 06 implements the interactive TUI layer using Ink 7.0.0 (React for CLI). Ink provides a React-like component model with Flexbox layout (via Yoga), enabling familiar web development patterns in terminal applications. The TUI will consume existing Services (ProjectService, TemplateService, ConfigService) and replace the stubs in `tui-launch.ts`.

**Primary recommendation:** Use ink core components (Box, Text, useInput, useApp) + ecosystem packages (ink-select-input, ink-text-input, ink-spinner, fuse.js) with ink-testing-library for TDD. Implement navigation via React state management and custom useNavigation hook. Use ink-virtual-list or custom viewport logic for performance on large lists (N4: <50ms render).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** 单屏列表为主 — 项目列表为主体，选择后弹出配置编辑/预览面板
- **D-02:** 层级导航模式 — 每屏独立，栈式导航管理，Enter 进入下一级，Esc 返回上一级
- **D-03:** 混合组件策略 — @inkjs/ui 现成组件 + 自定义特殊组件（Select/Input 用现成，PreviewPanel/ConfirmDialog 自定义）
- **D-04:** 底部弹出预览 — 选择后底部弹出 PreviewPanel，展示将要修改的字段
- **D-05:** 双模式导航 — 上下箭头 + j/k 同时支持（满足 U3）
- **D-06:** 即时模糊搜索 — 内置 fuzzy filter，用户输入时实时更新列表
- **D-07:** 丰富视觉反馈 — chalk 颜色方案，状态图标，高亮边框
- **D-08:** 阈值触发加载指示 — 操作开始计时，>500ms 显示 spinner
- **D-09:** 标准 Escape 行为 — 任何界面 Esc 返回上一级，底层界面 Esc 退出 TUI
- **D-10:** 全屏确认界面 — 危险操作独立 ConfirmScreen，y/n 认认
- **D-11:** 状态栏错误显示 — 底部固定 StatusBar，错误显示红色消息
- **D-12:** screens/components 分离 — `src/tui/screens/` + `src/tui/components/`
- **D-13:** ink-testing-library — 每个 screen 有对应 test
- **D-14:** 虚拟滚动实现 — <50ms 渲染 100 项列表（N4）

### Claude's Discretion
- 具体组件命名风格
- 状态管理具体方案 (React state vs Context vs Zustand)
- 导航栈实现细节
- fuzzy search 算法选择 (fuse.js vs 自定义)
- 颜色方案具体配色

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| F2 | Interactive TUI Selector (arrow-key navigation, fuzzy search) | ink-select-input 6.2.0 + useInput hook + fuse.js 7.3.0 |
| F3 | Configuration Preview (show what will change) | Custom PreviewPanel component with Box/Text |
| F14 | Fuzzy Search (quick navigation) | fuse.js 7.3.0 with threshold 0.3-0.4 |
| N4 | Responsive TUI (<50ms render time) | ink-virtual-list 0.2.3 or viewport windowing |
| U3 | Keyboard Navigation (arrows + j/k) | useInput hook with Key object (upArrow/downArrow + 'j'/'k' mapping) |
| U4 | Escape to Cancel (always allow cancel) | useInput key.escape + useApp().exit() + navigation stack pop |
| U5 | Confirmation Prompts (destructive actions) | ink-confirm-input 2.0.0 or custom ConfirmScreen |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ink | 7.0.0 | TUI framework | React renderer for CLI - Flexbox layout via Yoga |
| react | 19.2.5 | Component model | Ink peer dependency - hooks, state, JSX |
| chalk | 5.6.2 | Color scheme | Already used in CLI - shared TUI/CLI colors |

### Required (To Install)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ink-testing-library | 4.0.0 | TDD testing | Official Ink test utilities - render/lastFrame/stdin.write |
| fuse.js | 7.3.0 | Fuzzy search | Lightweight fuzzy-search with TypeScript support (F14) |
| ink-select-input | 6.2.0 | Select component | Dropdown/selection UI (F2) - by sindresorhus |
| ink-text-input | 6.0.0 | Text input | Search/filter input (D-06) - by vadimdemedes |
| ink-spinner | 5.0.0 | Loading indicator | Threshold-triggered spinner (D-08) |
| ink-confirm-input | 2.0.0 | Confirmation | Yes/No confirmation (U5) |

### Optional (Performance)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ink-virtual-list | 0.2.3 | Virtual scrolling | For >50 items list (N4 optimization) |
| ink-divider | 4.1.1 | Visual dividers | For section separation |
| ink-use-stdout-dimensions | 1.0.5 | Responsive layout | For dynamic terminal sizing |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ink-select-input | Custom Select with useInput | More control but more code, ecosystem package is battle-tested |
| fuse.js | Custom fuzzy filter | Less dependencies but fuse.js is optimized and well-tested |
| ink-testing-library | Manual render + assert | Less abstraction, ink-testing-library handles async rendering |

**Installation:**
```bash
npm install --save-dev ink-testing-library@4.0.0
npm install fuse.js@7.3.0 ink-select-input@6.2.0 ink-text-input@6.0.0 ink-spinner@5.0.0 ink-confirm-input@2.0.0
# Optional for large lists:
npm install ink-virtual-list@0.2.3 ink-divider@4.1.1 ink-use-stdout-dimensions@1.0.5
```

**Version verification (checked 2026-04-14):**
- ink: 7.0.0 (2026-04-08)
- fuse.js: 7.3.0 (2026-04-04)
- ink-testing-library: 4.0.0 (stable)
- ink-select-input: 6.2.0 (latest)
- ink-text-input: 6.0.0 (latest)
- ink-spinner: 5.0.0 (latest)

## Architecture Patterns

### Recommended Project Structure
```
src/
├── tui/                     # TUI layer (Phase 06)
│   ├── screens/             # Full-screen components
│   │   ├── ProjectListScreen.tsx
│   │   ├── ConfigEditorScreen.tsx
│   │   ├── ConfirmScreen.tsx
│   │   └── TemplateSelectScreen.tsx
│   ├── components/          # Reusable UI components
│   │   ├── PreviewPanel.tsx
│   │   ├── StatusBar.tsx
│   │   ├── LoadingIndicator.tsx
│   │   ├── ProjectItem.tsx
│   │   └── FuzzySearchInput.tsx
│   ├── hooks/               # Custom hooks
│   │   ├── useNavigation.ts
│   │   ├── useKeyInput.ts
│   │   ├── useFuzzySearch.ts
│   │   └── useDelayedLoading.ts
│   ├── context/             # App context (optional)
│   │   ├── NavigationContext.tsx
│   │   └── AppContext.tsx
│   ├── app.tsx              # Main TUI app container
│   ├── index.ts             # Barrel export + launchTUI
│   └── types.ts             # TUI-specific types
├── cli/                     # CLI layer (Phase 05) - unchanged
├── lib/                     # Services layer (Phase 04) - unchanged
```

### Pattern 1: Screen Component with useInput
**What:** Each screen handles keyboard input via useInput hook
**When to use:** All interactive screens
**Example:**
```typescript
// Source: Ink README + ink-select-input patterns
import React, { useState } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import SelectInput from 'ink-select-input';

interface ProjectListScreenProps {
  projects: ProjectEntry[];
  onSelect: (project: ProjectEntry) => void;
  onBack: () => void;
}

export const ProjectListScreen: React.FC<ProjectListScreenProps> = ({
  projects,
  onSelect,
  onBack
}) => {
  const { exit } = useApp();
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.escape) {
      onBack(); // or exit() if root screen
    }
    if (key.upArrow || input === 'k') {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    }
    if (key.downArrow || input === 'j') {
      setSelectedIndex(prev => Math.min(projects.length - 1, prev + 1));
    }
    if (key.return) {
      onSelect(projects[selectedIndex]);
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">Projects</Text>
      {projects.map((project, i) => (
        <Text key={project.id}
          color={i === selectedIndex ? 'green' : 'white'}
          bold={i === selectedIndex}>
          {i === selectedIndex ? '> ' : '  '}
          {project.path.split('/').pop()}
        </Text>
      ))}
    </Box>
  );
};
```

### Pattern 2: Navigation Stack
**What:** Stack-based navigation for screens (push/pop)
**When to use:** Multi-screen TUI apps
**Example:**
```typescript
// Custom hook for navigation stack
import { useState } from 'react';

type Screen = 'list' | 'editor' | 'confirm';

interface NavigationState {
  stack: Screen[];
  current: Screen;
}

export const useNavigation = (initialScreen: Screen = 'list') => {
  const [stack, setStack] = useState<Screen[]>([initialScreen]);

  const push = (screen: Screen) => {
    setStack(prev => [...prev, screen]);
  };

  const pop = () => {
    setStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
  };

  const current = stack[stack.length - 1];
  const isRoot = stack.length === 1;

  return { current, push, pop, isRoot, stack };
};
```

### Pattern 3: Fuzzy Search with fuse.js
**What:** Real-time fuzzy filtering of list items
**When to use:** Searchable lists (D-06, F14)
**Example:**
```typescript
// Source: fuse.js TypeScript patterns
import Fuse from 'fuse.js';
import { useMemo } from 'react';

interface SearchableItem {
  name: string;
  path: string;
}

const useFuzzySearch = (items: SearchableItem[], query: string) => {
  const fuse = useMemo(() => new Fuse(items, {
    keys: ['name', 'path'],
    threshold: 0.4,        // Balance precision vs recall
    includeMatches: true, // For highlighting
    ignoreLocation: true, // Better for long strings
  }), [items]);

  return useMemo(() => {
    if (!query.trim()) return items;
    return fuse.search(query).map(result => result.item);
  }, [fuse, query, items]);
};
```

### Pattern 4: Bottom Panel Overlay
**What:** PreviewPanel rendered at bottom of screen
**When to use:** Preview without leaving list (D-04)
**Example:**
```typescript
// Box with absolute position for bottom panel
import { Box, Text } from 'ink';

export const PreviewPanel: React.FC<{ visible: boolean; project: ProjectEntry | null }> = ({
  visible,
  project
}) => {
  if (!visible || !project) return null;

  return (
    <Box
      borderStyle="single"
      borderColor="yellow"
      padding={1}
      marginTop={1}
    >
      <Box flexDirection="column">
        <Text bold>Preview: {project.path.split('/').pop()}</Text>
        <Text dimColor>Path: {project.path}</Text>
        <Text color={project.activeConfig ? 'green' : 'gray'}>
          Config: {project.activeConfig ?? 'none'}
        </Text>
      </Box>
    </Box>
  );
};
```

### Pattern 5: Delayed Loading Indicator
**What:** Only show spinner after threshold (>500ms)
**When to use:** Async operations (D-08)
**Example:**
```typescript
// Source: React useEffect + ink-spinner
import { useState, useEffect } from 'react';
import Spinner from 'ink-spinner';

export const useDelayedLoading = (isLoading: boolean, threshold = 500) => {
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShowSpinner(false);
      return;
    }

    const timer = setTimeout(() => setShowSpinner(true), threshold);
    return () => clearTimeout(timer);
  }, [isLoading, threshold]);

  return showSpinner;
};

// Usage
const LoadingIndicator = ({ isLoading }) => {
  const showSpinner = useDelayedLoading(isLoading);
  return showSpinner ? <Spinner type="dots" /> : null;
};
```

### Anti-Patterns to Avoid
- **Direct fs in TUI:** TUI should call Services, not Repositories directly (Clean Architecture)
- **Blocking useInput:** Don't use async handlers in useInput callback - use state updates
- **Hardcoded dimensions:** Use useWindowSize() for responsive layout
- **Complex state in components:** Extract to hooks or context for maintainability
- **Inline styles:** Use consistent chalk color variables from CLI output

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Select dropdown | Custom Select with useInput | ink-select-input | Battle-tested, handles edge cases, focus management |
| Text input | Custom input with stdin | ink-text-input | Cursor positioning, editing, validation built-in |
| Fuzzy search | Custom filter function | fuse.js | Optimized algorithm, TypeScript, highlighting support |
| Spinner | Custom animation loop | ink-spinner | Multiple spinner types, proper cleanup |
| Virtual scroll | Custom viewport logic | ink-virtual-list or viewport window | Performance edge cases, scroll state |
| Confirmation | Custom y/n handler | ink-confirm-input | Focus, default handling, accessibility |

**Key insight:** Ink ecosystem packages handle terminal edge cases (cursor hiding, focus, async rendering) that are deceptively complex to implement correctly.

## Common Pitfalls

### Pitfall 1: App Exits Immediately
**What goes wrong:** TUI renders once and exits because no async work in event loop
**Why it happens:** Ink apps exit when event loop is empty - useInput keeps app alive
**How to avoid:** Always have useInput active or use waitUntilExit()
**Warning signs:** App renders then immediately terminates without user action

### Pitfall 2: Input Handler Race Conditions
**What goes wrong:** Multiple useInput hooks conflict, keys processed multiple times
**Why it happens:** Multiple screens/components register useInput without isActive control
**How to avoid:** Use `isActive` option to control which handler receives input
```typescript
useInput(handler, { isActive: isCurrentScreen });
```
**Warning signs:** One key press triggers multiple actions

### Pitfall 3: Performance on Large Lists
**What goes wrong:** 100+ items cause slow rendering, exceeds N4 (<50ms)
**Why it happens:** React renders all items even when not visible
**How to avoid:** Use ink-virtual-list or viewport windowing - only render visible items
**Warning signs:** Laggy scrolling, visible delay on navigation

### Pitfall 4: Async Rendering in Tests
**What goes wrong:** Tests fail because render hasn't completed before assertion
**Why it happens:** Ink renders asynchronously, need to wait for frames
**How to avoid:** ink-testing-library handles async - use rerender() and lastFrame() properly
**Warning signs:** Test assertions on empty output

### Pitfall 5: Chalk Colors Inconsistent
**What goes wrong:** TUI colors differ from CLI output, confusing UX
**Why it happens:** Hardcoded colors instead of shared scheme
**How to avoid:** Use same chalk color functions from `src/cli/output/`
**Warning signs:** Green in TUI vs cyan in CLI for same concept

## Code Examples

Verified patterns from official sources:

### Basic Ink App Container
```typescript
// Source: Ink README
import React from 'react';
import { render, Box, Text } from 'ink';

const App = () => (
  <Box flexDirection="column">
    <Text color="green">Hello World</Text>
  </Box>
);

const { waitUntilExit } = render(<App />);
await waitUntilExit();
```

### ink-testing-library Usage
```typescript
// Source: Ink README Testing section
import React from 'react';
import { Text } from 'ink';
import { render } from 'ink-testing-library';

const TestComponent = () => <Text>Hello World</Text>;
const { lastFrame, unmount } = render(<TestComponent />);

console.log(lastFrame()); // "Hello World"
// For assertions:
expect(lastFrame()).toContain('Hello World');
unmount();
```

### useInput with Both Arrows and j/k
```typescript
// Source: Ink build/hooks/use-input.d.ts
import { useInput } from 'ink';

useInput((input, key) => {
  // Arrow keys (U3 requirement)
  if (key.upArrow) moveUp();
  if (key.downArrow) moveDown();

  // Vim-style j/k (U3 requirement)
  if (input === 'k') moveUp();
  if (input === 'j') moveDown();

  // Escape (U4 requirement)
  if (key.escape) cancelOrExit();

  // Enter for selection
  if (key.return) selectCurrent();

  // Ctrl+C handled automatically by exitOnCtrlC (default true)
});
```

### fuse.js TypeScript Setup
```typescript
// Source: fuse.js npm documentation
import Fuse, { IFuseOptions } from 'fuse.js';

interface ProjectItem {
  id: string;
  name: string;
  path: string;
}

const options: IFuseOptions<ProjectItem> = {
  keys: ['name', 'path'],
  threshold: 0.4,       // 0 = exact match, 1 = match anything
  includeMatches: true, // For highlighting matched text
  ignoreLocation: true, // Don't penalize for match position
};

const fuse = new Fuse(projects, options);
const results = fuse.search('anthropic');

// results[0].item is the matched project
// results[0].matches contains match details for highlighting
```

### ink-select-input Usage
```typescript
// Source: npmjs.com/package/ink-select-input
import SelectInput from 'ink-select-input';

const items = [
  { label: 'First', value: 'first' },
  { label: 'Second', value: 'second' },
];

<SelectInput
  items={items}
  onSelect={(item) => console.log(item.value)}
  isFocused={true}
/>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ink 3.x (React 18) | ink 7.0 (React 19) | 2025-2026 | Better hooks, Node 22+ required |
| Manual stdin handling | useInput hook | ink 2+ | Cleaner input handling, Key object |
| Custom select components | ink-select-input 6.x | 2025 | Battle-tested ecosystem |
| Manual test rendering | ink-testing-library 4.x | 2024+ | Async-safe testing |

**Deprecated/outdated:**
- ink 3.x patterns (use ink 7.0 API)
- @inkjs/ui (doesn't exist - use individual packages like ink-select-input)
- Manual stdin.on('data') (use useInput)

## Open Questions

1. **Virtual scrolling implementation**
   - What we know: ink-virtual-list 0.2.3 exists but is newer/less battle-tested
   - What's unclear: Performance for 100 items, integration with search
   - Recommendation: Start with simple viewport windowing (slice visible items), add ink-virtual-list if needed

2. **State management approach**
   - What we know: React useState/useContext sufficient for simple apps
   - What's unclear: Zustand vs pure React for navigation stack + data cache
   - Recommendation: Start with React Context + hooks, add Zustand if complexity grows

3. **Color scheme consistency**
   - What we know: CLI uses cyan/green/yellow/gray in `table.ts`
   - What's unclear: Should TUI use exact same functions or define own palette
   - Recommendation: Extract shared color helpers to `src/ui/colors.ts` used by both CLI and TUI

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| ink | TUI framework | ✓ | 7.0.0 | — |
| react | Ink dependency | ✓ | 19.2.5 | — |
| chalk | Colors | ✓ | 5.6.2 | — |
| Node.js | Runtime | ✓ | 22.x | — |
| ink-testing-library | TDD testing | ✗ | — | npm install (devDep) |
| fuse.js | Fuzzy search | ✗ | — | npm install |
| ink-select-input | Select UI | ✗ | — | npm install |
| ink-text-input | Input UI | ✗ | — | npm install |
| ink-spinner | Loading | ✗ | — | npm install |

**Missing dependencies with no fallback:**
- None blocking — all are npm packages

**Missing dependencies with fallback:**
- ink-testing-library → Use manual render + setTimeout (not recommended)
- fuse.js → Simple substring filter (loses fuzzy quality)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 3.2.4 (existing) |
| TUI testing | ink-testing-library 4.0.0 |
| Config file | vitest.config.ts (existing) |
| Quick run command | `vitest run src/tui/` |
| Full suite command | `vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| F2 | Arrow-key navigation | integration | `vitest run src/tui/screens/ProjectListScreen.test.tsx` | ❌ Wave 0 |
| F14 | Fuzzy search filtering | unit | `vitest run src/tui/hooks/useFuzzySearch.test.ts` | ❌ Wave 0 |
| N4 | <50ms render for 100 items | performance | `vitest run src/tui/performance.test.ts` | ❌ Wave 0 |
| U3 | j/k and arrow keys work | integration | `vitest run src/tui/hooks/useKeyInput.test.ts` | ❌ Wave 0 |
| U4 | Escape cancels/exits | integration | `vitest run src/tui/screens/ProjectListScreen.test.tsx::escape` | ❌ Wave 0 |
| U5 | Confirmation for delete | integration | `vitest run src/tui/screens/ConfirmScreen.test.tsx` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `vitest run src/tui/`
- **Per wave merge:** `vitest run` (full suite including CLI + Services)
- **Phase gate:** Full suite green + M4 verification (Services no UI imports)

### Wave 0 Gaps
- [ ] `src/tui/screens/ProjectListScreen.test.tsx` — covers F2, U3, U4
- [ ] `src/tui/screens/ConfirmScreen.test.tsx` — covers U5
- [ ] `src/tui/screens/ConfigEditorScreen.test.tsx` — covers F3
- [ ] `src/tui/hooks/useFuzzySearch.test.ts` — covers F14
- [ ] `src/tui/hooks/useNavigation.test.ts` — covers D-02 navigation stack
- [ ] `src/tui/hooks/useKeyInput.test.ts` — covers D-05 j/k mapping
- [ ] `src/tui/performance.test.ts` — covers N4 render time
- [ ] Framework install: `npm install --save-dev ink-testing-library@4.0.0`
- [ ] Vitest config update: Add `.tsx` support for Ink tests

*(Note: vitest.config.ts currently uses `environment: 'node'` — Ink tests may need special handling for async rendering)*

### M4 Verification Extension
Per constitution.md M4: Services must NOT import ink/react.
Phase 06 adds TUI layer — need additional verification:
```typescript
// src/tui/m4-tui-verification.test.ts
// Verify: TUI imports Services correctly (Services don't import TUI)
// Verify: CLI doesn't import TUI components (except via tui-launch.ts)
```

## Sources

### Primary (HIGH confidence)
- Ink package (node_modules/ink/readme.md) - Official README with hooks, components, testing
- Ink type definitions (node_modules/ink/build/hooks/use-input.d.ts) - Key interface
- ink-testing-library npm (version 4.0.0) - Test utilities API
- fuse.js npm (version 7.3.0) - Fuzzy search with TypeScript
- Project existing code (src/lib/services/*.ts) - Services layer TUI will consume

### Secondary (MEDIUM confidence)
- ink-select-input npm (version 6.2.0) - Select component patterns
- ink-text-input npm (version 6.0.0) - Input component patterns
- ink-spinner npm (version 5.0.0) - Loading indicator
- ink-virtual-list npm (version 0.2.3) - Virtual scrolling (less battle-tested)

### Tertiary (LOW confidence)
- ink-scroll-list (version 0.4.1) - Alternative scroll solution
- ink-quicksearch-input (version 1.0.0) - Built-in search (older Ink 2 patterns)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Ink 7.0 verified, ecosystem packages current
- Architecture: HIGH - Patterns from official README and existing ecosystem
- Pitfalls: HIGH - Based on Ink README and common issues
- Testing: HIGH - ink-testing-library official, vitest existing
- Performance: MEDIUM - ink-virtual-list newer, viewport approach fallback

**Research date:** 2026-04-14
**Valid until:** 30 days (stable libraries, but Ink ecosystem evolves)

---

*Research for Phase 06: Core TUI*
*Project: CCAPISwitch*