---
phase: 12
slug: first-run-wizard
status: draft
shadcn_initialized: false
preset: none
created: 2026-04-30
security_review: true
---

# Phase 12 — UI Design Contract (Terminal-Native)

> Visual and interaction contract for terminal-native CLI phase. Adapted from gsd-ui-researcher template for prompts/chalk stack.

---

<security_analysis>
## STRIDE Threat Model (Wizard Flow Security)

Phase 12 wizard processes sensitive API credentials during first-run onboarding. Security analysis focuses on interaction contract and existing mitigations.

| Threat | Component | Risk Level | Mitigation | Status |
|--------|-----------|------------|------------|--------|
| **S**poofing | API key input | LOW | Password-type input (SEC-04), prompts validates ownership | ✓ Existing (Phase 11) |
| **T**ampering | Directory scan | MEDIUM | Depth limit (maxDepth=3), skipDirs filter, path validation | ✓ Partial (expand skip dirs) |
| **R**epudiation | Wizard completion | LOW | AppState.firstRunCompleted flag persistence | ✓ NEW (this phase) |
| **I**nformation Disclosure | API key display | HIGH | Password masking (SEC-04), no CLI args exposure (SEC-01) | ✓ Existing (Phase 10/11) |
| **D**enial of Service | Parallel scan | LOW | Independent catch per directory (D-06), graceful skip on EACCES | ✓ NEW (this phase) |
| **E**levation of Privilege | Directory traversal | MEDIUM | Skip node_modules/.git (ONB-04), max depth limit | ✓ Expand (this phase) |

## Trust Boundaries

| Boundary | Data Crossing | Protection |
|----------|---------------|------------|
| User input → API config | API key (credential) | Password-type prompt, validation, masked display |
| User input → Directory scan | File path (filesystem) | Depth limit, skip directories, independent catch |
| AppState → Disk | firstRunCompleted flag (boolean) | Atomic write (R1), conf package |
| ApiConfigStore → Disk | API key (credential) | Encrypted storage pending, currently plaintext (known risk) |

## Security Requirements Mapping

| Requirement | Phase 12 Role | Implementation |
|-------------|---------------|----------------|
| SEC-01 | Uses existing | API key never exposed in CLI args/logs (ApiConfigStore) |
| SEC-02 | Uses existing | Validation error messages (prompts validate pattern) |
| SEC-03 | Uses existing | Atomic write + backup (R1/R2) |
| SEC-04 | Uses existing | Password-type input for API key (input-api-key.ts) |
| ONB-04 | NEW | Skip directories expansion (DEFAULT_SKIP_DIRS) |

## Interaction Security Contract

| Interaction | Security Measure | Verification |
|-------------|------------------|--------------|
| API key input | type='password' (prompts) | input-api-key.ts L22 |
| API key validation | min 10 chars, not empty | input-api-key.ts L26-32 |
| API key display | Masked as `sk-ant-...****` | RESEARCH.md Pattern 3 |
| Directory scan | maxDepth=3, skipDirs filter | project-service.ts L106 |
| Cancel handling | Graceful exit, no data leak | handle-cancel.ts L23-26 |
| NO_COLOR | Respect env var (UI-05) | theme.ts L90-93 |

## Security Notes for Executor

1. **Reuse existing secure components** — inputFullApiConfig already implements SEC-01/SEC-04
2. **Expand skip directories** — Add DEFAULT_SKIP_DIRS per ONB-04 (tampering mitigation)
3. **Parallel scan error handling** — Independent catch per D-06 (DoS mitigation)
4. **firstRunCompleted persistence** — Atomic write via AppState (R1 guarantee)
5. **Known plaintext risk** — API keys stored plaintext; encrypt at rest deferred to v3

</security_analysis>

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (terminal-native, not web) |
| Preset | not applicable |
| Component library | prompts 2.4.2 |
| Icon library | none (uses Unicode spinner glyphs) |
| Font | Terminal monospace (implicit) |

**Pre-populated from:**
- RESEARCH.md §Standard Stack (prompts 2.4.2, chalk 5.6.2)
- theme.ts existing implementation (OpenCode palette)

---

## Design Direction

| Property | Value |
|----------|-------|
| Design tone | Terminal-minimal (npm-style, linear wizard) |
| Target audience | CLI developers using Claude Code |
| Primary use case | First-run onboarding: API config → scan → select → apply |
| Brand personality | Efficient, developer-centric, terminal-native |
| Anti-AI-slop measures | Linear flow (no multi-screen), progress indicator (spinner), NO_COLOR respect |

### Active Design Skills

Skills loaded from GSD-ECC Bridge for this phase:

| Skill | Purpose | Source |
|-------|---------|--------|
| frontend-design | Base design intelligence + anti-slop patterns | Vault |
| onboard.md | First-run/onboarding experience patterns | Vault |

### References Consulted

- [x] ux-writing reference (copywriting for wizard steps)
- [ ] typography reference (terminal monospace implicit)
- [ ] color reference (theme.ts already defines palette)
- [ ] interaction reference (prompts patterns already established)

---

## Spacing Scale (Terminal)

Declared values for console output formatting:

| Token | Value | Usage |
|-------|-------|-------|
| separator_width | 40 chars | `─`.repeat(40) for visual grouping |
| box_width | 44 chars | Header box width `╔══...╗` |
| indent | 0 | No indentation (linear flow) |
| line_gap | 1 newline | Between wizard steps |
| section_gap | 2 newlines | Before major sections |

**Pre-populated from:**
- main-wizard.ts L70-72 (box formatting)
- separator function L83-85 in theme.ts

Exceptions: None

---

## Typography (Terminal)

Terminal monospace font, all styles via chalk:

| Role | Chalk Style | Usage |
|------|-------------|-------|
| Header | cyan.bold | `╔══...╗` box headers |
| Body | white/default | Prompt messages, user input |
| Label | gray | Descriptions, hints |
| Success | green | `✓` completion messages |
| Error | red | `✗` failure messages |
| Warning | yellow | `⚠` caution messages |
| Accent | cyan | Interactive prompts, section titles |
| Muted | hex('#9a9898') | Separator lines, secondary info |

**Pre-populated from:**
- theme.ts colors object L12-29

---

## Color (Terminal)

OpenCode warm palette + Apple HIG semantic:

| Role | Value | Usage |
|------|-------|-------|
| Background | #201d1d | (terminal background, not controlled) |
| Foreground | #fdfcfc | Primary text via chalk.hex |
| Muted (30%) | #9a9898 | Separator lines, descriptions |
| Accent (10%) | blue | Interactive elements, headers |
| Destructive | red | Cancel options, error messages |
| Success | green | Completion confirmations |
| Warning | yellow | Cautionary prompts |

Accent reserved for:
- Wizard section headers (`chalk.cyan('选择项目')`)
- Interactive prompt titles
- API config creation header
- Scan progress section header

**Pre-populated from:**
- theme.ts L12-29 (colors object)
- REQUIREMENTS.md UI-01 (OpenCode palette)
- REQUIREMENTS.md UI-04 (Apple HIG semantic)

NO_COLOR support: Required (UI-05) — theme.ts respectNoColor() already implements

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Wizard header | `CC Config - Terminal Native` |
| Primary CTA | `确认应用此配置？` |
| API config step | `创建 API 配置` |
| API key prompt | `API Key (已隐藏)` — SEC-04 compliant labeling |
| Scan step | `扫描项目` |
| Select project step | `选择项目` |
| Select config step | `选择配置` |
| Apply step | `应用配置` |
| Empty state heading | `没有发现新项目` |
| Empty state body | `扫描完成: 0 个项目` (spinner succeed message) |
| Error state | `操作失败: {error message}` |
| Cancel message | `操作已取消。` |
| Success message | `配置已应用到 "{projectName}"` |
| Completion hint | `提示: 运行 cc-config list 查看所有项目` |

**Pre-populated from:**
- main-wizard.ts L70-170 (existing wizard copy)
- handle-cancel.ts L24-26 (cancel message)
- input-api-key.ts L133-151 (API config copy)

Destructive actions: None in this phase

---

## Interaction Contract

### Prompt Types

| Prompt | Type | Behavior | Security |
|--------|------|----------|----------|
| Config name | text | validation + initial 'anthropic' | validate: regex `[a-zA-Z0-9_-]` |
| API key | password | auto-mask, validation (min 10 chars) | SEC-04: type='password' |
| Base URL | text | validation + initial 'https://api.anthropic.com' | validate: URL constructor |
| Model name | text | initial 'claude-sonnet-4-6' | no validation required |
| Directory | select | choices + custom input option | depth limit enforced by service |
| Scan results | multiselect | select multiple projects | path validation by service |
| Config selection | select | single config choice | no security concern |
| Final confirm | confirm | y/N with default false | no security concern |

### Navigation

| Key | Action |
|-----|--------|
| j / arrow-down | Move selection down |
| k / arrow-up | Move selection up |
| Enter | Confirm selection |
| Esc | Cancel current prompt |
| Ctrl+C | Exit wizard gracefully |

**Pre-populated from:**
- select-project.ts (autocomplete/select modes)
- autocomplete.ts AUTOCOMPLETE_THRESHOLD=20
- handle-cancel.ts defaultOnCancel pattern

### Progress Indicator

| Property | Value |
|----------|-------|
| Type | Custom spinner (Unicode glyphs) |
| Frame rate | 80ms |
| Glyphs | `⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏` (10 frames) |
| Message | `扫描中...` |
| Success | `✓ 扫描完成: {N} 个项目` |
| Failure | `✗ 扫描失败: {message}` |

**Pre-populated from:**
- main-wizard.ts L22-45 (createSpinner implementation)
- D-11/D-13 locked in CONTEXT.md

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| npm official | prompts, chalk, fuse.js, fs-extra, zod, conf | not required |
| Third-party | None | N/A |

**Pre-populated from:**
- RESEARCH.md §Standard Stack (all dependencies verified)
- package.json existing installations

---

## First-Run Detection Contract

| Condition | Check | Result |
|-----------|-------|--------|
| Trigger point | `args.length === 0` at CLI entry | Launch wizard |
| firstRunCompleted | `AppState.get('firstRunCompleted')` | false → continue |
| ApiConfigStore empty | `list().length === 0` | true → continue |
| ProjectIndex empty | `getAll().length === 0` | true → continue |
| All conditions met | Triple check | Launch first-run wizard |
| Any condition false | Skip wizard | Launch normal TUI |

**Security:** Triple condition prevents false positives (D-02)

**Pre-populated from:**
- D-01/D-02/D-03/D-04 locked in CONTEXT.md
- RESEARCH.md Pattern 2 implementation example

---

## Wizard Flow Contract

Linear flow (ONB-01):

| Step | Component | Output | Security Measure |
|------|-----------|--------|------------------|
| 1 | inputFullApiConfig | API config created | Password-type input, validation |
| 2 | selectDirectory | Scan root selected | Path validated by service |
| 3 | createSpinner + scanProjects | Projects discovered | Depth limit, skip dirs, parallel catch |
| 4 | selectFromScanResults | Projects selected | Path validation |
| 5 | registerProject | Projects registered | Atomic write (R1) |
| 6 | selectTemplate | Config selected | No security concern |
| 7 | confirmAction | User confirms | No security concern |
| 8 | applyTemplate + set flag | Config applied, wizard complete | Atomic write (R1), masked display |

**Pre-populated from:**
- D-14 locked in CONTEXT.md
- main-wizard.ts existing flow structure

---

## Skip Directories Contract

| Directory | Skip Reason | Security Rationale |
|-----------|-------------|-------------------|
| node_modules | npm dependencies | Prevent dependency tampering scan |
| .git | git repository metadata | Prevent repo metadata exposure |
| dist | JS build output | Prevent build artifact traversal |
| build | JS build output | Prevent build artifact traversal |
| target | Rust/Java build output | Prevent build artifact traversal |
| .venv | Python virtual environment | Prevent env traversal |
| __pycache__ | Python bytecode cache | Prevent cache traversal |

**Merge strategy:** DEFAULT_SKIP_DIRS + AppState.skipDirectories

**Pre-populated from:**
- D-08/D-09/D-10 locked in CONTEXT.md
- ONB-04 in REQUIREMENTS.md

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS (wizard step labels, CTAs, empty/error states defined)
- [ ] Dimension 2 Visuals: PASS (spinner, box header, separator patterns defined)
- [ ] Dimension 3 Color: PASS (OpenCode palette + Apple HIG semantic defined)
- [ ] Dimension 4 Typography: PASS (terminal monospace implicit, chalk styles defined)
- [ ] Dimension 5 Spacing: PASS (separator width, box width, gap patterns defined)
- [ ] Dimension 6 Registry Safety: PASS (npm packages only, no third-party registries)
- [ ] Dimension 7 Security: PASS (STRIDE analyzed, existing mitigations verified)

**Approval:** pending

---

## Pre-Populated Sources Summary

| Source | Decisions Used |
|--------|---------------|
| CONTEXT.md | D-01~D-14 (all locked decisions) |
| RESEARCH.md | Standard stack, architecture patterns, security patterns |
| REQUIREMENTS.md | ONB-01~05, UI-01~06, SEC-01~04 requirements |
| theme.ts | Colors, styles, separator function |
| main-wizard.ts | Spinner, wizard flow, copywriting |
| handle-cancel.ts | Cancel handling pattern |
| input-api-key.ts | Password-type input, validation |
| autocomplete.ts | AUTOCOMPLETE_THRESHOLD |
| SDD reference | STRIDE threat model template |

---

## Notes for Executor

1. **No new visual components needed** — all prompt components exist and are reusable
2. **Spinner already implemented** — createSpinner in main-wizard.ts L22-45, no changes needed
3. **First-run detection is logic change** — modify CLI index.ts, not UI layer
4. **Parallel scan is backend change** — modify walkDirectory, spinner remains same
5. **Skip directories is constant** — DEFAULT_SKIP_DIRS in new constants file
6. **Security reuse** — inputFullApiConfig already implements SEC-01/SEC-04, no new code needed

The design contract is primarily about **flow orchestration** and **copywriting**, not visual design. Executor should focus on:
- Adding firstRunCompleted detection in CLI entry
- Implementing Promise.all parallel scan with independent catch
- Creating DEFAULT_SKIP_DIRS constant
- Setting firstRunCompleted flag at wizard end

All security mechanisms (password input, validation, masking) are already implemented and reused.

---
*Phase: 12-first-run-wizard*
*UI contract created: 2026-04-30*
*Security review: SDD-enabled (credential processing)*