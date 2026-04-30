# Feature Research: Prompts-Based Terminal UI

**Domain:** Terminal list selection and wizard flows
**Researched:** 2026-04-30
**Confidence:** HIGH (prompts library docs verified via Context7, OpenCode design reference available)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **j/k navigation** | Vim-style navigation is standard in npm tools (npm init, create-react-app). Terminal users expect j/k as alternative to arrows. | LOW | Built into prompts select/autocomplete via arrow keys. j/k mapping requires custom key handling or user retraining. |
| **Arrow key navigation** | Universal accessibility. Users unfamiliar with vim expect up/down arrows. | LOW | Native in prompts select, multiselect, autocomplete. |
| **Enter to select** | Standard confirmation action. Universal expectation across all terminal UIs. | LOW | Native in prompts - Enter confirms selection. |
| **Escape to cancel** | Standard cancel action. Users expect Esc to abort current operation or go back. | MEDIUM | Prompts supports onCancel callback. Need to implement graceful exit flow (return to previous step or abort wizard). |
| **Visual selection feedback** | User needs to see which item is selected. Invisible selection = unusable UI. | LOW | Native in prompts - selected item highlighted. |
| **Help text** | User needs to know available actions. Missing help text = user confusion. | LOW | Prompts shows hint text. Can customize via `hint` property. |
| **Preview before action** | Especially for destructive operations. Users expect to see what will change before confirming. | MEDIUM | Not native in prompts. Requires separate preview step or custom implementation. |
| **Autocomplete for large lists** | When lists exceed 10-15 items, users expect search/filter capability. Without it, navigation is tedious. | LOW | Native via prompts `autocomplete` type - type to filter, arrows to navigate. |
| **Confirmation for destructive actions** | Delete, overwrite, apply config - users expect explicit y/n confirmation. Missing this = accidental data loss. | LOW | Native via prompts `confirm` type. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Warm terminal aesthetic** | OpenCode's #201d1d/#fdfcfc palette feels sophisticated vs generic black/white. Creates cohesive "terminal-native" identity. | LOW | Apply color palette via chalk or terminal color codes. Berkeley Mono font if available. |
| **Unified monospace typography** | Single typeface throughout (headings, body, buttons) creates "everything is code" philosophy. Distinctive visual identity. | LOW | Terminal naturally uses monospace. Ensure no mixed fonts in output. |
| **Multi-step wizard flow** | First-run experience: fill API config → scan directories → select projects → apply config. Guided setup vs manual CLI commands. | MEDIUM | Use prompts array with conditional prompts. State management via prompts `values` object. |
| **Diff preview before config apply** | Show exactly what will change in settings.json before user confirms. Prevents accidental modifications. | MEDIUM | Requires diff generation (project has existing implementation). Show as separate screen or formatted output. |
| **Graceful cancel with state preservation** | User cancels mid-wizard → resume from last step (not start over). Reduces frustration. | HIGH | Requires AppState persistence. Prompts onCancel needs custom handling. |
| **Progress indicators for scans** | Long-running project scans need visual feedback. Without it, user thinks tool is frozen. | MEDIUM | Prompts doesn't have built-in progress. Use console.log with spinner or separate progress prompt. |
| **Contextual help** | Show help specific to current prompt state. More useful than generic help text. | LOW | Customize `hint` property per prompt. Dynamic via `message: (prev, values) => string`. |
| **Fuzzy search built-in** | Autocomplete with fuzzy matching (like v1.0 fuzzy search). More forgiving than exact prefix match. | MEDIUM | Prompts autocomplete uses prefix match. Fuzzy requires custom implementation or wrapper. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Complex multi-screen navigation** | "I want to jump between screens freely like a GUI app" | Terminal UIs are linear flows. Multi-screen navigation (like v1.0 Ink implementation) creates complexity: state management, back button, screen stack. Users get lost in navigation hierarchy. | **Linear wizard flow**: Step 1 → Step 2 → Step 3 → Done. No arbitrary jumps. Back only returns to previous step. |
| **Real-time preview updates** | "Show preview as I type/navigate" | Continuous preview updates cause visual noise and performance overhead in terminal. Ink's real-time preview was criticized as "chaotic style hard to see". | **Preview on demand**: Show preview when user pauses on item for 500ms+ or presses dedicated preview key. Or show preview as separate confirmation step. |
| **Mouse support in terminal** | "I want to click items like a GUI" | Mouse support in terminal is fragile, inconsistent across terminals, adds dependency complexity. Most terminal users prefer keyboard navigation. | **Full keyboard support**: j/k + arrows + Enter + Escape + search. No mouse needed. |
| **Animated transitions** | "Add animations for screen transitions" | Terminal animations are slow, cause flicker, break rendering on some terminals. Ink animations were criticized as "logic messy style hard to see". | **Instant transitions**: Immediate screen changes. Clean, fast, reliable across all terminals. |
| **Complex component architecture** | "Build reusable component library like React" | Ink's React-style components (10+ components, 7 screens, 4 hooks) created maintenance overhead. Prompts is simpler - focus on prompt sequences, not components. | **Prompt sequences**: Array of prompt objects. Conditional logic via `type: prev => ...`. No complex component tree. |

## Feature Dependencies

```
[Wizard Flow]
    └──requires──> [AppState persistence]
                       └──requires──> [Config file storage]

[Diff Preview]
    └──requires──> [Diff generation utility]
                       └──requires──> [Config read utility]

[Autocomplete Search]
    └──enhances──> [List selection prompt]

[Progress Indicator]
    └──conflicts──> [Simple prompt flow]
    └──requires──> [Async operation tracking]

[Graceful Cancel]
    └──requires──> [AppState persistence]
    └──requires──> [OnCancel callback handling]
```

### Dependency Notes

- **Wizard Flow requires AppState persistence**: Multi-step wizard needs to save progress. If user cancels at step 3, must resume from step 3 (not start over). AppState provides `firstRunCompleted` flag and intermediate state storage.

- **Diff Preview requires Diff generation utility**: To show what will change before user confirms, need diff utility. Project has existing implementation (`src/cli/utils/diff.ts`).

- **Autocomplete Search enhances List selection prompt**: For large project lists, autocomplete (type to filter) improves navigation. Prompts `autocomplete` type provides this.

- **Progress Indicator conflicts with Simple prompt flow**: Progress indicators interrupt the linear prompt flow. Consider showing progress as separate step or console output outside prompt sequence.

- **Graceful Cancel requires AppState + OnCancel handling**: Prompts `onCancel` callback can prevent abort (return true), but need AppState to track current step. If user cancels, save state to resume later.

## Prompts Library Capabilities

### Prompt Types Available

| Type | Purpose | Built-in Features | Use Case in This Project |
|------|---------|-------------------|-------------------------|
| `select` | Single item selection | Arrow navigation, Enter confirm, visual highlight | Project selection, API config selection |
| `multiselect` | Multiple items selection | Space toggle, Enter submit, max limit, visual feedback | Scan result selection (multiple projects) |
| `autocomplete` | Filterable list | Type to filter, arrows to navigate, Enter select | Project selection with search |
| `confirm` | Yes/No confirmation | y/n keys, default value | Destructive action confirmation |
| `text` | Free text input | Validation, formatting | API key input, config name input |
| `number` | Numeric input | Min/max validation | Numeric configuration values |
| `password`/`invisible` | Masked input | Characters hidden | API token input (sensitive) |

### Wizard Flow Features

| Feature | How to Implement | Example |
|---------|------------------|---------|
| **Conditional prompts** | `type: prev => prev ? 'text' : null` (null skips prompt) | Skip API config if user chooses "use existing" |
| **Dynamic messages** | `message: (prev, values) => 'string'` | Show previous answers in current prompt message |
| **State accumulation** | `values` object contains all previous answers | Access `values.projectName` in later prompts |
| **Cancellation handling** | `onCancel: prompt => { return true }` | Prevent abort, show message, let user retry |
| **Submission callback** | `onSubmit: (prompt, answer) => ...` | Log progress, validate intermediate state |
| **Testing support** | `prompts.inject(['answer1', 'answer2'])` | Pre-fill answers for automated testing |

### Key Patterns from Research

**Pattern 1: Linear Wizard Flow (npm init style)**
```javascript
const questions = [
  { type: 'text', name: 'apiKey', message: 'API Key:' },
  { type: 'text', name: 'baseUrl', message: 'API Base URL:' },
  { type: 'text', name: 'modelName', message: 'Model Name:' },
  { type: 'select', name: 'project', message: 'Select project:', choices: [...] },
  { type: 'confirm', name: 'apply', message: 'Apply config?' }
];
const answers = await prompts(questions, { onCancel });
```

**Pattern 2: Conditional Prompt Sequence**
```javascript
const questions = [
  {
    type: 'select',
    name: 'configSource',
    message: 'Config source:',
    choices: [
      { title: 'Create new', value: 'new' },
      { title: 'Use existing', value: 'existing' }
    ]
  },
  {
    // Only show if user chose 'new'
    type: prev => prev === 'new' ? 'text' : null,
    name: 'apiKey',
    message: 'API Key:'
  },
  {
    // Only show if user chose 'existing'
    type: prev => prev === 'existing' ? 'select' : null,
    name: 'config',
    message: 'Select config:',
    choices: [...]
  }
];
```

**Pattern 3: Preview Before Confirm**
```javascript
// Show preview as formatted output, then confirm
console.log('\nPreview of changes:');
console.log(chalk.dim('  API Key: [HIDDEN]'));
console.log(chalk.dim('  Base URL: https://api.example.com'));
console.log(chalk.dim('  Model: claude-3-5-sonnet'));

const confirm = await prompts({
  type: 'confirm',
  name: 'apply',
  message: 'Apply this configuration?',
  initial: false
});
```

**Pattern 4: Graceful Cancel**
```javascript
const onCancel = (prompt) => {
  console.log(chalk.yellow('Cancelled. You can resume later.'));
  // Save state for resumption
  saveWizardState(currentStep);
  // Return true to prevent process abort
  return true;
};

const answers = await prompts(questions, { onCancel });
```

## MVP Definition

### Launch With (v2.0)

Minimum viable product - what's needed to validate the prompts-based approach.

- [x] **j/k + arrow navigation** — Essential for list selection. Users expect both vim-style and standard navigation.
- [x] **Enter to select, Escape to cancel** — Core interaction model. Universal expectation.
- [x] **Autocomplete search** — For project selection from potentially large lists. Built into prompts.
- [x] **Confirmation for destructive actions** — Config apply, delete. Prevent accidental changes.
- [x] **Help text per prompt** — Show available actions. Customize via `hint` property.
- [x] **Text/password input for API config** — API key, base URL, model name inputs.
- [x] **Linear wizard flow** — First-run: API config → scan → select → apply. Simple sequence.
- [x] **Diff preview before apply** — Show what will change. Use existing diff utility.

### Add After Validation (v2.1+)

Features to add once core is working.

- [ ] **Progress indicators for scans** — Long-running scans need visual feedback. Add spinner or progress bar.
- [ ] **Graceful cancel with state preservation** — Resume wizard from last step. Requires AppState enhancement.
- [ ] **Contextual hints based on previous answers** — Show personalized help. Dynamic `message` function.
- [ ] **Warm OpenCode aesthetic** — Apply color palette (#201d1d/#fdfcfc). Better visual identity.

### Future Consideration (v3+)

Features to defer until product-market fit is established.

- [ ] **Fuzzy search** — More forgiving than prefix match. Requires custom wrapper over autocomplete.
- [ ] **Multi-config CRUD via prompts** — Add/list/remove API configs. Extends wizard to management.
- [ ] **Undo within wizard** — Allow "back to previous step" without aborting entire wizard.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| j/k + arrow navigation | HIGH | LOW | P1 |
| Enter/Esc interaction | HIGH | LOW | P1 |
| Autocomplete search | HIGH | LOW | P1 |
| Confirmation prompts | HIGH | LOW | P1 |
| Text/password input | HIGH | LOW | P1 |
| Linear wizard flow | HIGH | MEDIUM | P1 |
| Diff preview | HIGH | MEDIUM | P1 |
| Help text per prompt | MEDIUM | LOW | P2 |
| Progress indicators | MEDIUM | MEDIUM | P2 |
| Graceful cancel | MEDIUM | HIGH | P2 |
| OpenCode aesthetic | MEDIUM | LOW | P2 |
| Contextual hints | LOW | LOW | P3 |
| Fuzzy search | LOW | MEDIUM | P3 |
| Multi-config CRUD | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch (v2.0)
- P2: Should have, add when possible (v2.1+)
- P3: Nice to have, future consideration (v3+)

## Competitor Feature Analysis

| Feature | npm init | create-react-app | cc-switch (Desktop) | Our Approach (v2.0) |
|---------|----------|------------------|---------------------|---------------------|
| **Navigation** | Arrows + Enter | Arrows + Enter | Mouse + buttons | Arrows + j/k + Enter |
| **Cancel** | Ctrl+C abort | Ctrl+C abort | Back button | Esc to cancel, graceful abort |
| **Preview** | None (blind install) | Options list | Full preview panel | Diff preview before apply |
| **Search** | None | None | Search box | Autocomplete (type to filter) |
| **Wizard flow** | Linear prompts | Linear prompts | Multi-screen GUI | Linear prompts (npm style) |
| **Aesthetic** | Standard terminal | Standard terminal | Desktop GUI | OpenCode warm terminal aesthetic |
| **First-run** | Package name prompt | App name prompt | Setup wizard | API config → scan → select → apply |

**Our differentiation:**
1. **j/k navigation** — Vim users get familiar navigation (npm/init use only arrows)
2. **Diff preview** — Users see what will change before confirming (npm/init have no preview)
3. **Autocomplete search** — Filter large project lists quickly (npm/init have no search)
4. **Warm terminal aesthetic** — OpenCode's sophisticated palette vs generic terminal colors

## Comparison with v1.0 Ink Implementation

| Aspect | v1.0 (Ink React) | v2.0 (Prompts) | Improvement |
|--------|------------------|----------------|-------------|
| **Architecture** | 10+ components, 7 screens, 4 hooks | Array of prompt objects | Simpler, less code |
| **Navigation** | Screen stack with push/pop | Linear prompt sequence | Less state management |
| **Preview** | Real-time preview panel | Diff preview as separate step | Less visual noise |
| **Search** | Fuzzy search hook | Autocomplete (prefix match) | Built-in, simpler |
| **Lines of code** | ~22,700 LOC | Target: ~10,000 LOC reduction | Less maintenance |
| **Dependencies** | ink, react, ink-* packages | Single prompts package | Fewer dependencies |
| **Rendering** | React virtual DOM | Direct terminal output | Faster, more reliable |

**Why prompts is better for this use case:**
1. **Simpler architecture** - Array of prompts vs component tree
2. **Built-in features** - Navigation, search, confirmation are native
3. **Less code** - No need for custom components
4. **NPM-style UX** - Familiar pattern from npm init, create-react-app
5. **Reliability** - Ink had rendering issues ("logic messy style hard to see")

## Sources

- **Prompts library documentation** — Context7 lookup verified. Library ID: `/terkelg/prompts`. Version 2.4.2. https://github.com/terkelg/prompts
- **OpenCode design reference** — `.planning/PROJECT.md` and `opencode.ai-DESIGN.md`. Warm palette #201d1d/#fdfcfc, Berkeley Mono font, no shadows.
- **Terminal UI best practices** — https://clig.dev (CLI design principles). Confirmed preview before destructive actions, clear confirmation prompts.
- **Competitor analysis** — npm init, create-react-app, create-next-app patterns. Linear wizard flows.
- **Inquirer/Enquirer/Clack comparison** — Web search results. Prompts chosen for simplicity (v1.0 used Ink React).
- **Project context** — `/Users/lihaoxuan/code/P07_CCAPISwitch/.planning/PROJECT.md` - v2.0 milestone requirements (TUI-01, CFG-01, ONB-01, UI-01)

---
*Feature research for: Prompts-based terminal list selection*
*Researched: 2026-04-30*