---
phase: 14
slug: terminal-aesthetic
status: draft
shadcn_initialized: false
preset: none
created: 2026-05-03
---

# Phase 14 — UI Design Contract

> Visual and interaction contract for terminal aesthetic design system. CLI-native, not web-based.

---

## Design System

| Property | Value | Source |
|----------|-------|--------|
| Tool | none | CLI tool, no web UI |
| Preset | not applicable | CLI terminal output |
| Component library | none | Terminal-native, picocolors-based |
| Icon library | none | Terminal symbols (✓/✗/⚠) |
| Font | terminal monospace | System default (D-04) |

**shadcn gate skipped:** CLI tool, not React/Next.js/Vite application.

---

## Design Direction

> Aesthetic direction and design intelligence from frontend-design skills.

| Property | Value |
|----------|-------|
| Design tone | terminal-native-minimal |
| Target audience | Developers using CLI configuration tool |
| Primary use case | Terminal-based configuration management |
| Brand personality | Warm, trustworthy, minimal, terminal-native |
| Anti-AI-slop measures | OpenCode warm palette (not cold grayscale), flat depth (no shadows/gradients), monospace consistency, NO_COLOR respect |

### Design Philosophy

**Terminal-Native Minimalism:** Embrace terminal constraints as design features, not limitations. Warm colors (OpenCode palette) provide visual comfort in terminal environment. Flat depth system respects terminal output nature. NO_COLOR support ensures accessibility for color-blind users and terminal preference.

### Active Design Skills

Skills loaded from Frontend-Design Vault for this phase:

| Skill | Purpose | Source |
|-------|---------|--------|
| frontend-design | Base design intelligence + anti-slop patterns | Vault |
| colorize | Color strategy, semantic meaning, 60/30/10 split | Vault |
| quieter | Minimalism, reduce intensity, flat depth | Vault |

### Design Principles Applied

From **colorize.md**:
- Semantic colors have purpose: success (green), error (red), warning (yellow), info (blue)
- Color palette: 2-4 colors max beyond neutrals
- Dominant/Accent split: 60% dominant, 30% secondary, 10% accent
- Color should enhance hierarchy and meaning, not create chaos

From **quieter.md**:
- Reduce saturation: muted, sophisticated tones (OpenCode #9a9898)
- Neutral dominance: Let neutrals do more work (60/30/10)
- Gentler contrasts: High contrast only where it matters (accent for interactive elements)
- Reduce decorative elements: No gradients/shadows/patterns (flat depth D-06)
- Flatten hierarchy: Flat depth system, border-only elevation

### References Consulted

- [x] color reference (color-and-contrast.md principles applied to terminal ANSI colors)
- [ ] typography reference (not loaded — terminal monospace is system-controlled)
- [ ] spatial reference (not applicable — CLI has no spacing scale)
- [ ] motion reference (not applicable — no animations in CLI)
- [ ] interaction reference (not applicable — prompts handles interaction)
- [ ] responsive reference (not applicable — single terminal output)
- [ ] ux-writing reference (not loaded — copywriting in separate section)

---

## Spacing Scale

**Not applicable for CLI terminal output.** Terminal width is controlled by user's terminal settings. No pixel-based spacing scale.

**Terminal width handling:**
- Assume standard 80-column terminal as minimum
- Wrap text for readability if exceeding terminal width
- Use newline separation for visual grouping
- Separator lines: 40 characters width (from existing theme.ts)

---

## Typography

**All monospace (D-05), system default (D-04).** No font variations in terminal.

| Role | Font | Weight | Line Height | Note |
|------|------|--------|-------------|------|
| Body | terminal monospace | default | terminal default | All CLI output |
| Heading | terminal monospace | default | terminal default | Section headers |
| Code | terminal monospace | default | terminal default | API keys, paths |
| Labels | terminal monospace | default | terminal default | Prompts, hints |

**No font size declarations:** Terminal font size controlled by user's terminal configuration. Application respects terminal settings, does not override.

**Typography consistency:**
- No mixed fonts (D-05)
- All output uses monospace
- Bold/dim/italic modifiers via ANSI codes (picocolors)
- Never assume specific font family or size

---

## Color

**OpenCode warm palette + Apple HIG semantic colors.**

### Color Palette Definition

| Role | Hex Value | ANSI Code | Usage |
|------|-----------|-----------|-------|
| Dominant (60%) | #201d1d | `\x1b[48;2;32;29;29m` | Background (dark bg) |
| Dominant (60%) | #fdfcfc | `\x1b[38;2;253;252;252m` | Foreground (light fg) |
| Secondary (30%) | #9a9898 | `\x1b[38;2;154;152;152m` | Muted text, separators |
| Accent (10%) | Apple HIG | picocolors | Semantic colors below |

**Dominant split:** Background and foreground together form 60% of visual space. Muted text forms 30%. Semantic accent colors form 10%.

### Semantic Colors (Apple HIG)

| Semantic Name | ANSI Color | Picocolors Method | Reserved For |
|---------------|------------|-------------------|--------------|
| Accent (blue) | `\x1b[34m` | `pc.blue` | Interactive prompts, selections, primary actions |
| Danger (red) | `\x1b[31m` | `pc.red` | Errors, destructive actions, validation failures |
| Success (green) | `\x1b[32m` | `pc.green` | Confirmations, active states, completed operations |
| Warning (yellow) | `\x1b[33m` | `pc.yellow` | Warnings, alerts, pending states |

**Accent reserved for:** Interactive prompts, selection highlights, primary CTAs, navigation indicators.

**NOT reserved for:** Body text, headings, borders, backgrounds (use OpenCode palette or terminal default).

### NO_COLOR Compliance

**Per D-08, D-09:** NO_COLOR completely disables all ANSI colors.

- Detect `process.env.NO_COLOR` at theme module initialization
- Disable all ANSI codes: OpenCode palette + semantic colors + modifiers
- All color functions return plain strings when NO_COLOR set
- picocolors auto-detection handles NO_COLOR/FORCE_COLOR
- Custom truecolor formatters respect NO_COLOR flag

**Test verification:** `NO_COLOR=1 cc-config list` should produce plain text output.

### Windows Compatibility

**Per D-10, D-11:** Terminal detection for ANSI support.

| Terminal Type | Detection Method | ANSI Support | Truecolor Support |
|---------------|------------------|--------------|-------------------|
| Windows Terminal | `WT_SESSION` env var | Yes | Yes |
| Windows CMD | `platform === 'win32' && !WT_SESSION` | Yes (Win 10+) | No |
| macOS Terminal | `TERM_PROGRAM === 'Apple_Terminal'` | Yes | No |
| iTerm2 | `TERM_PROGRAM === 'iTerm.app'` | Yes | Yes |
| VSCode | `TERM_PROGRAM === 'vscode'` | Yes | Yes |
| Generic truecolor | `COLORTERM === 'truecolor'` | Yes | Yes |

**Fallback strategy:**
- Windows CMD: Use standard ANSI colors, no truecolor (grayscale fallback for OpenCode palette)
- Basic terminals: Standard ANSI colors, closest match for OpenCode palette (gray for muted, white for foreground)

---

## Border & Depth System

**Flat depth (D-06), border-only elevation (D-07).**

### Border Characters

| Context | Unicode Border | ASCII Fallback | When to Use |
|---------|----------------|-----------------|-------------|
| Horizontal line | `─` (U+2500) | `-` | Separators, table borders |
| Vertical line | `│` (U+2502) | `|` | Table columns, box sides |
| Top-left corner | `┌` (U+250C) | `+` | Box top |
| Top-right corner | `┐` (U+2510) | `+` | Box top |
| Bottom-left corner | `└` (U+2514) | `+` | Box bottom |
| Bottom-right corner | `┘` (U+2518) | `+` | Box bottom |
| Cross intersection | `┼` (U+253C) | `+` | Table intersections |

**Selection logic:**
- Unicode borders: Windows Terminal, iTerm2, VSCode, COLORTERM=truecolor
- ASCII fallback: Windows CMD, basic terminals

**Implementation:** `src/cli/theme/borders.ts` module with `getBorders()` function detecting terminal capabilities.

### Depth Rules

| Rule | Implementation |
|------|----------------|
| No shadows | No ANSI shadow codes, no simulated shadows |
| No gradients | No color transitions, solid colors only |
| Border-only elevation | Use border characters for visual separation |
| Single-line borders | No double-line (`║`), no thick lines |
| No 3D effects | No embossing, no relief, no depth simulation |

---

## Copywriting Contract

**CLI output messaging style guide.**

| Element | Copy | Context |
|---------|------|---------|
| Primary CTA | `Apply configuration` | Switch command confirmation |
| Primary CTA | `Select config` | Config selection prompt |
| Primary CTA | `Add configuration` | Add config wizard |
| Empty state heading | `No API configurations found` | Config list command |
| Empty state body | `Add one with: cc-config config add` | Empty state guidance |
| Error state | `[Validation error message] + Check input format and try again` | Validation failure |
| Error state | `Configuration not found: [name] + Run 'cc-config config list' to see available configs` | Missing config error |
| Success state | `✓ Configuration applied successfully` | Switch confirmation |
| Warning state | `⚠ API key will be replaced + Continue?` | Config apply warning |
| Destructive confirmation | `Remove config '[name]'? + This will permanently delete the configuration.` | Config remove command |
| Cancel action | `Operation cancelled` | Esc/Ctrl+C exit |

### Tone Guidelines

- **Direct and clear:** No fluff, no marketing speak
- **Actionable:** Always provide next step in empty/error states
- **Contextual:** Include relevant information (config name, error reason)
- **Respectful:** User cancelled → "Operation cancelled", not "You cancelled"
- **Technical audience:** Assume developer context, use technical terms (API key, configuration, env)

### Symbol Usage

| Symbol | Color | Usage |
|--------|-------|-------|
| ✓ | green (success) | Completed operations, active states |
| ✗ | red (danger) | Errors, failures, cancelled |
| ⚠ | yellow (warning) | Warnings, alerts, pending |
| ○ | gray/white | Inactive, pending, placeholder |

---

## Registry Safety

**Not applicable:** CLI tool with no shadcn/web component registry.

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| none | — | CLI tool, no web components |

**Third-party npm packages safety:**

| Package | Version | Safety Assessment |
|---------|---------|-------------------|
| picocolors | 1.1.1 | Verified via npm registry, zero dependencies, tiny (6KB), NO_COLOR friendly |
| cli-table3 | 0.6.5 | Already in project, supports custom border chars |

---

## Implementation Architecture

**Theme module structure (from RESEARCH.md):**

```
src/cli/theme/
├── index.ts              # Theme entry, exports all functions
├── colors.ts             # OpenCode palette + semantic colors
├── detection.ts          # Terminal compatibility detection
├── formatters.ts         # Message/hint/error/success formatting
├── borders.ts            # Unicode/ASCII border characters
└── theme.test.ts         # Theme module tests
```

**Integration points:**

| Existing File | Changes Required |
|---------------|------------------|
| `src/cli/index.ts` | Replace chalk import with theme module, remove NO_COLOR manual handling (theme handles it) |
| `src/cli/output/table.ts` | Replace chalk with theme.colors, use theme.borders |
| `src/cli/output/error.ts` | Replace chalk with theme.colors.danger, theme.formatters.error |
| `src/cli/utils/diff-render.ts` | Replace chalk with theme.colors for +/- indicators |
| `src/cli/prompts/utils/theme.ts` | Remove file, replace with `src/cli/theme/` imports |

**Replacement strategy:**
- Uninstall chalk: `npm uninstall chalk`
- Install picocolors: `npm install picocolors@1.1.1` (already installed per RESEARCH.md verification)
- Create theme module (Wave 0)
- Update all CLI output files (Wave 1)
- Remove old theme.ts (Wave 1)

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS (not applicable for CLI)
- [ ] Dimension 6 Registry Safety: PASS (not applicable for CLI)

**Approval:** pending

---

## Traceability

### Pre-Populated From

| Source | Decisions Used |
|--------|----------------|
| CONTEXT.md (D-01 to D-11) | 11 locked decisions (picocolors, OpenCode palette, semantic colors, NO_COLOR, Windows detection, flat depth) |
| RESEARCH.md | ANSI codes, theme module architecture, terminal detection logic, border characters |
| REQUIREMENTS.md (UI-01 to UI-06) | 6 phase requirements (warm palette, monospace, flat depth, semantic colors, NO_COLOR, Windows compatibility) |
| Existing codebase | Current chalk usage, NO_COLOR handling in index.ts, existing theme.ts patterns |
| User input | 0 (all decisions pre-populated from upstream) |

### Requirement Coverage

| Req ID | Covered in Section |
|--------|-------------------|
| UI-01 (OpenCode warm palette) | Color → Color Palette Definition |
| UI-02 (Monospace typography) | Typography |
| UI-03 (Flat depth system) | Border & Depth System |
| UI-04 (Apple HIG semantic colors) | Color → Semantic Colors |
| UI-05 (NO_COLOR support) | Color → NO_COLOR Compliance |
| UI-06 (Windows compatibility) | Color → Windows Compatibility |

---

*UI-SPEC created: 2026-05-03*
*Ready for verification by gsd-ui-checker*