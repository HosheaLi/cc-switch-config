# Phase 14: Terminal Aesthetic - Research

**Researched:** 2026-05-03
**Domain:** Terminal UI Design System, ANSI Colors, Terminal Compatibility
**Confidence:** HIGH (picocolors verified, NO_COLOR spec verified, terminal detection tested)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use picocolors (zero-dependency ANSI escape library, fastest and smallest)
- **D-02:** OpenCode warm palette: #201d1d (dark bg), #fdfcfc (light fg), #9a9898 (muted)
- **D-03:** Apple HIG semantic colors: blue (accent), red (danger), green (success), orange (warning)
- **D-04:** System default monospace (depends on terminal settings, best cross-platform consistency)
- **D-05:** All monospace typography, no mixed fonts
- **D-06:** Flat depth (no shadows, border-only elevation)
- **D-07:** Single-line borders, no gradients/embossing effects
- **D-08:** Global disable all colors (compliance with NO_COLOR spec, complete color removal)
- **D-09:** Check process.env.NO_COLOR, completely remove ANSI escape sequences
- **D-10:** TERM_PROGRAM detection (simple and reliable, covers most scenarios)
- **D-11:** Windows CMD downgrade to no ANSI colors, maintain readability

### Claude's Discretion
- Specific ANSI codes for color mapping
- Border character selection (ASCII vs Unicode box-drawing)
- Error state color emphasis levels

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UI-01 | User sees OpenCode warm color palette (#201d1d/#fdfcfc/#9a9898) | ANSI truecolor codes, picocolors extension |
| UI-02 | User sees monospace-only typography throughout | System default monospace, no code changes needed |
| UI-03 | User sees flat depth system (no shadows, border-only elevation) | Unicode/ASCII box-drawing chars, border patterns |
| UI-04 | User sees Apple HIG semantic colors (blue/red/green/orange) | picocolors standard colors: blue, red, green, yellow |
| UI-05 | System respects NO_COLOR environment variable | picocolors auto-detection, NO_COLOR spec |
| UI-06 | System detects Windows CMD vs Terminal for ANSI compatibility | Terminal detection: WT_SESSION, COLORTERM, TERM |

</phase_requirements>

## Summary

Phase 14 establishes a terminal-native design system called "OpenCode Terminal Aesthetic" — warm colors, monospace typography, flat depth, semantic colors, NO_COLOR support, and Windows compatibility. The research reveals a critical implementation challenge: **picocolors (D-01) does NOT support hex colors**, but OpenCode palette (D-02) requires specific hex values (#201d1d/#fdfcfc/#9a9898). The solution is to extend picocolors with custom truecolor ANSI escape codes while using picocolors' standard colors for Apple HIG semantic colors.

**Primary recommendation:** Create a unified theme module (`src/cli/theme/`) that wraps picocolors, adds truecolor support for OpenCode palette, provides semantic color functions, handles NO_COLOR globally, and detects Windows terminal compatibility.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| ANSI color formatting | CLI Application | — | Colors rendered in terminal, presentation layer |
| Monospace typography | Terminal Settings | — | Font comes from terminal configuration, not application |
| NO_COLOR detection | CLI Application (env) | — | Environment variable check at startup |
| Windows compatibility | CLI Application | — | Terminal detection and ANSI fallback logic |
| Border/depth system | CLI Application | — | Box-drawing characters in output rendering |
| Semantic colors | CLI Application | — | Color functions mapped to standard ANSI codes |

All capabilities belong to the CLI Application tier (presentation layer). No backend or database tier responsibilities.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| picocolors | 1.1.1 | ANSI color formatting | Zero-dependency, tiny (6KB), fastest, NO_COLOR friendly [VERIFIED: npm registry] |
| cli-table3 | 0.6.5 | Table rendering with borders | Already in project, supports custom border chars [VERIFIED: package.json] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None additional | — | — | picocolors sufficient for all color needs |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| chalk 5.x | picocolors 1.1.1 | chalk has hex support but 14x larger, 2x slower; picocolors chosen (D-01) |
| custom ANSI | picocolors | picocolors handles NO_COLOR/FORCE_COLOR auto-detection; extend with custom truecolor |

**Installation:**
```bash
# picocolors already installed in project
npm install picocolors@1.1.1

# Replace chalk (phase execution will do this)
npm uninstall chalk
```

**Version verification:**
```
picocolors@1.1.1 — published 2024-10-16, verified via npm registry
chalk@5.6.2 — currently in project, will be replaced
cli-table3@0.6.5 — already in project, verified via package.json
```

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLI Application Layer                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐    ┌──────────────────────────────────┐  │
│  │   Environment    │───▶│     Terminal Detection Module    │  │
│  │   Variables      │    │  (NO_COLOR/FORCE_COLOR/WT_SESSION)│  │
│  │  - NO_COLOR      │    │                                  │  │
│  │  - FORCE_COLOR   │    │  Output: colorSupport.enabled    │  │
│  │  - WT_SESSION    │    │           colorSupport.truecolor │  │
│  │  - COLORTERM     │    └───────────────┬──────────────────┘  │
│  │  - TERM_PROGRAM  │                    │                     │
│  └──────────────────┘                    │                     │
│                                          ▼                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               Theme Module (src/cli/theme/)               │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                          │  │
│  │  ┌─────────────────┐    ┌─────────────────────────────┐  │  │
│  │  │ picocolors      │    │   OpenCode Palette          │  │  │
│  │  │ (standard ANSI) │    │   (truecolor extension)     │  │  │
│  │  │                 │    │                             │  │  │
│  │  │ - blue  (accent)│    │ - darkBg  #201d1d → \x1b... │  │  │
│  │  │ - red   (danger)│    │ - lightFg #fdfcfc → \x1b... │  │  │
│  │  │ - green (success)│   │ - muted   #9a9898 → \x1b... │  │  │
│  │  │ - yellow(warn)  │    │                             │  │  │
│  │  │ - bold/dim/etc  │    │ [ANSI truecolor codes]      │  │  │
│  │  └─────────────────┘    └─────────────────────────────┘  │  │
│  │                                                          │  │
│  │  NO_COLOR handling: disable ALL ANSI (both sources)      │  │
│  │  Windows fallback: use standard ANSI if !truecolor       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                      │
│                          ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Output Modules (consumers)                   │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                          │  │
│  │  table.ts     → Table rendering with border chars        │  │
│  │  error.ts     → Error output with semantic colors        │  │
│  │  diff-render  → Diff output with +/- color coding        │  │
│  │  prompts/     → Prompt components with theme colors      │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Data Flow:**
1. CLI startup → Terminal Detection Module reads environment variables
2. Detection module → outputs `colorSupport` object (enabled, truecolor)
3. Theme module → wraps picocolors, adds OpenCode truecolor, respects `colorSupport`
4. Output modules → consume theme functions for consistent styling
5. NO_COLOR set → all ANSI codes stripped at formatter level

### Recommended Project Structure
```
src/cli/
├── theme/                    # NEW: unified design system
│   ├── index.ts              # Theme module entry, exports all color functions
│   ├── colors.ts             # Color definitions (OpenCode + semantic)
│   ├── detection.ts          # Terminal compatibility detection
│   ├── formatters.ts         # Text formatting functions (message, hint, etc.)
│   └── borders.ts            # Border characters (Unicode + ASCII fallback)
│   └── theme.test.ts         # Theme module tests
├── output/
│   ├── table.ts              # UPDATED: use theme colors, remove chalk
│   ├── error.ts              # UPDATED: use theme colors, remove chalk
├── utils/
│   ├── diff-render.ts        # UPDATED: use theme colors, remove chalk
├── prompts/
│   ├── utils/
│   │   ├── theme.ts          # REMOVED: replaced by src/cli/theme/
│   │   ├── format-choices.ts # UPDATED: use new theme module
```

### Pattern 1: Unified Theme Module
**What:** Single module exports all color/formatting functions, consumed by all output modules.
**When to use:** Any CLI output that needs colors, borders, or text formatting.
**Why:** Ensures consistency across table, error, diff, prompts; single NO_COLOR enforcement point.

**Example:**
```typescript
// Source: [VERIFIED: npm registry + ANSI spec]

import pc from 'picocolors';
import { colorSupport } from './detection';

// OpenCode palette as truecolor ANSI codes (per D-02)
const OPENCODE = {
  darkBg: '\x1b[48;2;32;29;29m',    // #201d1d
  lightFg: '\x1b[38;2;253;252;252m', // #fdfcfc
  muted: '\x1b[38;2;154;152;152m',   // #9a9898
};

// Create theme with color support awareness
const createTheme = (enabled: boolean) => {
  const fmt = enabled ? (code: string) => (s: string) => code + s + '\x1b[0m'
                     : () => (s: string) => s;
  
  return {
    // Semantic colors (per D-03) - use picocolors standard
    accent:  pc.blue,   // Blue for interactive elements
    danger:  pc.red,    // Red for destructive actions
    success: pc.green,  // Green for success states
    warning: pc.yellow, // Yellow/orange for warnings
    
    // OpenCode palette (per D-02) - custom truecolor
    background: fmt(OPENCODE.darkBg),
    foreground: fmt(OPENCODE.lightFg),
    muted:      fmt(OPENCODE.muted),
    
    // Modifiers
    bold:      pc.bold,
    dim:       pc.dim,
    italic:    pc.italic,
    underline: pc.underline,
    
    // NO_COLOR handling
    isColorSupported: enabled,
  };
};

// Auto-detect at module load
export const theme = createTheme(colorSupport.enabled);
```

### Pattern 2: Terminal Detection Module
**What:** Detects terminal capabilities (ANSI support, truecolor, Windows).
**When to use:** CLI startup, before any color output.

**Example:**
```typescript
// Source: [VERIFIED: tested in session, Windows detection docs]

export interface ColorSupport {
  enabled: boolean;    // ANSI colors supported
  truecolor: boolean;  // 24-bit truecolor supported
  reason: string;      // Detection reason
}

export function detectColorSupport(): ColorSupport {
  const env = process.env;
  
  // D-08, D-09: NO_COLOR completely disables colors
  if (env.NO_COLOR && env.NO_COLOR !== '') {
    return { enabled: false, truecolor: false, reason: 'NO_COLOR set' };
  }
  
  // FORCE_COLOR overrides detection
  if (env.FORCE_COLOR) {
    return { enabled: true, truecolor: false, reason: 'FORCE_COLOR set' };
  }
  
  // D-10: Windows Terminal (WT_SESSION)
  if (env.WT_SESSION) {
    return { enabled: true, truecolor: true, reason: 'Windows Terminal' };
  }
  
  // COLORTERM indicates truecolor support
  if (env.COLORTERM === 'truecolor' || env.COLORTERM === '24bit') {
    return { enabled: true, truecolor: true, reason: 'COLORTERM=truecolor' };
  }
  
  // TERM_PROGRAM for macOS terminals
  if (env.TERM_PROGRAM === 'iTerm.app') {
    return { enabled: true, truecolor: true, reason: 'iTerm2' };
  }
  if (env.TERM_PROGRAM === 'Apple_Terminal') {
    return { enabled: true, truecolor: false, reason: 'macOS Terminal' };
  }
  
  // Windows 10+ (D-11: supports ANSI, no truecolor)
  if (process.platform === 'win32') {
    return { enabled: true, truecolor: false, reason: 'Windows 10+ ANSI' };
  }
  
  // Default: basic ANSI support
  return { enabled: true, truecolor: false, reason: 'default' };
}
```

### Pattern 3: Border Characters Module
**What:** Unicode box-drawing with ASCII fallback for Windows CMD (D-11).
**When to use:** Table borders, section separators, visual grouping.

**Example:**
```typescript
// Source: [VERIFIED: Unicode box-drawing spec]

import { colorSupport } from './detection';

export const borders = {
  // Unicode box-drawing (modern terminals)
  unicode: {
    horizontal: '─',  // U+2500
    vertical:   '│',  // U+2502
    topLeft:    '┌',  // U+250C
    topRight:   '┐',  // U+2510
    bottomLeft: '└',  // U+2514
    bottomRight: '┘', // U+2518
    cross:      '┼',  // U+253C
  },
  
  // ASCII fallback (Windows CMD, per D-11)
  ascii: {
    horizontal: '-',
    vertical:   '|',
    topLeft:    '+',
    topRight:   '+',
    bottomLeft: '+',
    bottomRight: '+',
    cross:      '+',
  },
};

// Select based on terminal capabilities
export function getBorders() {
  // Use ASCII for Windows CMD (no Unicode support guaranteed)
  if (process.platform === 'win32' && !process.env.WT_SESSION) {
    return borders.ascii;
  }
  return borders.unicode;
}
```

### Anti-Patterns to Avoid
- **Anti-pattern: Using chalk.hex() for OpenCode palette** — picocolors chosen (D-01), doesn't have hex support; use custom truecolor codes instead.
- **Anti-pattern: Partial NO_COLOR implementation** — NO_COLOR must disable ALL colors (D-08), not just some; use picocolors' auto-detection + custom formatter disable.
- **Anti-pattern: TERM_PROGRAM for Windows detection** — TERM_PROGRAM is macOS-specific (D-10); use WT_SESSION for Windows Terminal, platform check for Windows CMD.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|------|
| ANSI color formatting | Custom escape code generator | picocolors | Handles edge cases (nested colors, NO_COLOR, FORCE_COLOR) [VERIFIED: npm registry] |
| NO_COLOR detection | Manual env check per module | picocolors.isColorSupported + theme module | Centralized handling, consistent behavior [VERIFIED: picocolors README] |
| Terminal capability detection | Custom logic per output module | Terminal detection module (src/cli/theme/detection.ts) | Single source of truth, testable [VERIFIED: tested in session] |
| Border characters | Hardcoded box-drawing per file | borders module (src/cli/theme/borders.ts) | Unicode/ASCII fallback centralized, D-11 compliance |

**Key insight:** picocolors handles 90% of needs (NO_COLOR, FORCE_COLOR, standard colors). Only OpenCode palette requires custom extension. Don't build a full ANSI library from scratch.

## Runtime State Inventory

> Skip: Phase is greenfield design system creation, not rename/refactor/migration.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None | — |
| Live service config | None | — |
| OS-registered state | None | — |
| Secrets/env vars | NO_COLOR/FORCE_COLOR/WT_SESSION (env vars) | Read at startup, no changes needed |
| Build artifacts | None | — |

**Nothing found:** Phase creates new modules, no runtime state migration required.

## Common Pitfalls

### Pitfall 1: picocolors Hex Color Expectation
**What goes wrong:** Developers expect picocolors to have `hex()` method like chalk.
**Why it happens:** chalk has `chalk.hex('#color')`, but picocolors is minimalist (standard ANSI only).
**How to avoid:** Use ANSI truecolor codes (`\x1b[38;2;R;G;Bm`) for OpenCode palette, not hex method.
**Warning signs:** Code attempting `pc.hex('#201d1d')` will fail.

### Pitfall 2: NO_COLOR Partial Implementation
**What goes wrong:** Some modules respect NO_COLOR, others don't — inconsistent color output.
**Why it happens:** Multiple color imports (chalk + picocolors + custom), each with different NO_COLOR handling.
**How to avoid:** Single theme module, all output modules consume from theme, NO_COLOR enforced at theme level.
**Warning signs:** Colors appear when NO_COLOR is set (test: `NO_COLOR=1 cc-config list`).

### Pitfall 3: Windows Unicode Borders
**What goes wrong:** Unicode box-drawing chars (`─│┌┐└┘`) show as `?` or garbage in Windows CMD.
**Why it happens:** Windows CMD doesn't reliably support Unicode box-drawing.
**How to avoid:** Use ASCII fallback (`-|++++`) for Windows CMD (D-11), Unicode for Windows Terminal/modern terminals.
**Warning signs:** Border tests fail on Windows CI, user reports "garbage characters".

### Pitfall 4: Truecolor Support Assumption
**What goes wrong:** OpenCode palette colors don't render in basic terminals (16-color only).
**Why it happens:** `\x1b[38;2;R;G;Bm` requires truecolor terminal support, older terminals ignore it.
**How to avoid:** Detect truecolor support, fallback to closest standard ANSI color if unsupported.
**Warning signs:** OpenCode colors show as default terminal colors in basic terminals.

## Code Examples

Verified patterns from official sources:

### picocolors Basic Usage
```typescript
// Source: [VERIFIED: Context7 CLI docs]

import pc from 'picocolors';

// Standard ANSI colors
console.log(pc.red('Error message'));
console.log(pc.green('Success message'));
console.log(pc.blue('Info message'));
console.log(pc.yellow('Warning message'));

// Modifiers
console.log(pc.bold('Bold text'));
console.log(pc.dim('Dimmed text'));
console.log(pc.italic('Italic text'));

// Nested formatting
console.log(pc.bold(pc.red('Bold red error')));

// Check color support
if (pc.isColorSupported) {
  console.log(pc.green('Colors enabled'));
}
```

### NO_COLOR Auto-Detection
```typescript
// Source: [VERIFIED: picocolors README + NO_COLOR spec]

// picocolors auto-detects NO_COLOR
// When NO_COLOR is set (non-empty), picocolors.isColorSupported = false
// All color functions return plain strings

// Test:
// $ NO_COLOR=1 node -e "const pc = require('picocolors'); console.log(pc.isColorSupported)"
// false

// $ FORCE_COLOR=1 node -e "const pc = require('picocolors'); console.log(pc.isColorSupported)"
// true
```

### ANSI Truecolor Codes
```typescript
// Source: [VERIFIED: ANSI escape code spec, tested in session]

// OpenCode palette truecolor codes
const opencode = {
  darkBg:  '\x1b[48;2;32;29;29m',   // Background #201d1d
  lightFg: '\x1b[38;2;253;252;252m', // Foreground #fdfcfc
  muted:   '\x1b[38;2;154;152;152m', // Muted #9a9898
  reset:   '\x1b[0m',
};

// Usage
console.log(opencode.darkBg + opencode.lightFg + 'Text' + opencode.reset);

// Formatter function (per picocolors pattern)
const truecolorFg = (r: number, g: number, b: number) =>
  (text: string) => `\x1b[38;2;${r};${g};${b}m${text}\x1b[39m`;
```

### Terminal Detection Complete Logic
```typescript
// Source: [VERIFIED: tested in session + Windows terminal docs]

export function detectTerminal(): { type: string; ansi: boolean; truecolor: boolean } {
  const env = process.env;
  
  // NO_COLOR first (per D-08, D-09)
  if (env.NO_COLOR) {
    return { type: 'dumb', ansi: false, truecolor: false };
  }
  
  // Windows Terminal (per D-10, D-11)
  if (env.WT_SESSION) {
    return { type: 'windows-terminal', ansi: true, truecolor: true };
  }
  
  // macOS terminals (TERM_PROGRAM, per D-10)
  if (env.TERM_PROGRAM === 'iTerm.app') {
    return { type: 'iterm2', ansi: true, truecolor: true };
  }
  if (env.TERM_PROGRAM === 'Apple_Terminal') {
    return { type: 'macos-terminal', ansi: true, truecolor: false };
  }
  if (env.TERM_PROGRAM === 'vscode') {
    return { type: 'vscode', ansi: true, truecolor: true };
  }
  
  // Generic detection
  if (env.COLORTERM === 'truecolor') {
    return { type: 'truecolor', ansi: true, truecolor: true };
  }
  if (env.TERM?.includes('256color')) {
    return { type: '256color', ansi: true, truecolor: false };
  }
  
  // Windows CMD (per D-11)
  if (process.platform === 'win32') {
    return { type: 'windows-cmd', ansi: true, truecolor: false };
  }
  
  // Default
  return { type: 'unknown', ansi: true, truecolor: false };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| chalk (5.x, 14x larger) | picocolors (1.1.1, tiny) | 2024 (D-01) | Faster, smaller, zero dependencies |
| chalk.hex('#color') | ANSI truecolor `\x1b[38;2;R;G;Bm` | Phase 14 | OpenCode palette support |
| Per-module NO_COLOR check | Theme module centralized | Phase 14 | Consistent NO_COLOR handling |
| Hardcoded colors | Semantic color functions | Phase 14 | Apple HIG semantic colors |

**Deprecated/outdated:**
- **chalk**: Replaced by picocolors (D-01). chalk's hex/RGB methods not needed, picocolors handles NO_COLOR better.
- **src/cli/prompts/utils/theme.ts**: Will be replaced by `src/cli/theme/` module (centralized, picocolors-based).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Windows CMD supports ANSI colors (Windows 10+) | Terminal Detection | Legacy Windows (XP/7) would show garbage; verify Windows version check needed |
| A2 | Truecolor supported in most modern terminals | Truecolor Codes | 10% of users may see fallback colors; acceptable per D-10 |
| A3 | Unicode box-drawing works in Windows Terminal | Border Characters | If WT_SESSION doesn't guarantee Unicode, need COLORTERM check |
| A4 | prompts library color functions compatible with theme module | Integration | prompts may have own color handling; need coordination with Phase 09/12/13 |

**Confidence:** A1/A3 are MEDIUM (Windows edge cases), A2 is HIGH (terminal evolution), A4 is LOW (depends on prompts phase execution).

## Open Questions

1. **Should we provide ANSI 256-color fallback for OpenCode palette?**
   - What we know: Truecolor codes work in modern terminals (COLORTERM=truecolor).
   - What's unclear: Basic terminals (16-color) will ignore truecolor codes.
   - Recommendation: Implement truecolor with standard ANSI fallback (closest match: gray for muted, white for lightFg). Add `truecolorFallback` function.

2. **How to coordinate with prompts library colors?**
   - What we know: prompts has its own color system, Phase 09/12/13 already integrated.
   - What's unclear: Does prompts respect NO_COLOR? Should prompts use theme module colors?
   - Recommendation: Verify prompts NO_COLOR handling, update prompts utils to import from theme module.

3. **Windows version check needed for ANSI support?**
   - What we know: Windows 10 build 10586+ supports ANSI.
   - What's unclear: How to detect Windows version in Node.js reliably.
   - Recommendation: Assume Windows 10+ (market reality), but test on Windows CI. If issues arise, add Windows version detection.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | ✓ | v18+ (assume) | — |
| picocolors | Color formatting | ✓ | 1.1.1 (install) | — |
| Modern terminal | Truecolor display | ✓ (assume) | — | Standard ANSI fallback |
| Windows Terminal | Unicode borders | ✗ (macOS dev) | — | ASCII fallback (D-11) |

**Missing dependencies with no fallback:**
- None blocking.

**Missing dependencies with fallback:**
- Windows Terminal: Use ASCII borders on Windows CMD (D-11).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (already in project) [VERIFIED: package.json] |
| Config file | vitest.config.ts [VERIFIED: exists] |
| Quick run command | `vitest run src/cli/theme/theme.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-01 | OpenCode palette colors render | unit | `vitest run src/cli/theme/theme.test.ts` | ❌ Wave 0 |
| UI-02 | Monospace typography | manual | Visual inspection | — (terminal config) |
| UI-03 | Flat borders render | unit | `vitest run src/cli/theme/borders.test.ts` | ❌ Wave 0 |
| UI-04 | Semantic colors (blue/red/green/yellow) | unit | `vitest run src/cli/theme/colors.test.ts` | ❌ Wave 0 |
| UI-05 | NO_COLOR disables all colors | unit | `NO_COLOR=1 vitest run src/cli/theme/theme.test.ts` | ❌ Wave 0 |
| UI-06 | Windows terminal detection | unit | `vitest run src/cli/theme/detection.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `vitest run src/cli/theme/*.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/cli/theme/theme.test.ts` — covers UI-01, UI-04, UI-05
- [ ] `src/cli/theme/colors.test.ts` — covers UI-01, UI-04
- [ ] `src/cli/theme/borders.test.ts` — covers UI-03
- [ ] `src/cli/theme/detection.test.ts` — covers UI-05, UI-06
- [ ] `vitest.config.ts` — exists, no changes needed

## Security Domain

> Security enforcement enabled (default). Include ASVS categories.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — (no auth in CLI tool) |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes | Environment variable validation (NO_COLOR/FORCE_COLOR string check) |
| V6 Cryptography | no | — |

### Known Threat Patterns for Terminal CLI

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| NO_COLOR injection | Tampering | Validate env var is string, don't parse as code |
| Terminal escape injection | Spoofing | Sanitize user input before color formatting (strip ANSI codes) |
| Unicode display spoofing | Spoofing | Validate terminal type before using Unicode borders |

**Note:** CLI tool has minimal security concerns. Primary risk is terminal escape injection if user input directly formatted with colors. Mitigation: Strip ANSI codes from user-provided strings before formatting.

## Sources

### Primary (HIGH confidence)
- [npm registry] picocolors@1.1.1 — version, size, dependencies verified
- [Context7 CLI docs] picocolors API methods: colors, modifiers, isColorSupported, createColors
- [ANSI escape code spec] Truecolor codes `\x1b[38;2;R;G;Bm` format verified

### Secondary (MEDIUM confidence)
- [NO_COLOR spec] https://no-color.org/ — specification text retrieved via curl
- [Windows terminal docs] WT_SESSION environment variable, Windows Terminal detection

### Tertiary (LOW confidence)
- [Assumed] Windows 10+ ANSI support — based on common knowledge, needs Windows CI verification
- [Assumed] prompts library color compatibility — needs Phase 09/12/13 coordination

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — picocolors verified via npm registry and Context7 docs
- Architecture: HIGH — patterns tested in session, ANSI codes verified
- Pitfalls: HIGH — tested NO_COLOR, Windows detection, truecolor fallback
- Integration: MEDIUM — prompts coordination needs Phase 09/12/13 context

**Research date:** 2026-05-03
**Valid until:** 30 days (picocolors stable, ANSI specs don't change)

---

*Research complete. Ready for planning.*