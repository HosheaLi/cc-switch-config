# Stack Research

**Domain:** CLI/TUI Configuration Management Tool
**Researched:** 2026-04-13
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **ink** | 7.0.0 | React-based TUI framework | Industry standard for modern CLI apps. Component model familiar to React developers. Uses Yoga flexbox for layout. Powers tools like Parcel, webpack CLI, and many others. Active maintenance, TypeScript-first. |
| **react** | 19.2.5 | UI component library | Required peer dependency of ink. React 19 brings concurrent features and improved performance. Component-based architecture ideal for complex TUI with multiple views. |
| **commander** | 14.0.3 | CLI argument parser | Most popular CLI framework (40M+ weekly downloads). Simple API, auto-generated help, subcommand support. Perfect for initial command routing before handing off to TUI. Well-documented, battle-tested. |
| **typescript** | 6.0.2 | Type safety | Standard for modern Node.js projects. Provides compile-time error catching, excellent IDE support, self-documenting code. Essential for configuration-heavy tools where type mismatches cause runtime errors. |
| **tsup** | 8.5.1 | Build/bundle tool | Zero-config TypeScript bundler powered by esbuild. Builds ESM + CJS dual output automatically. Handles shebang, executable permissions, and type declarations. Much faster than tsc for CLI bundling. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@inkjs/ui** | 2.0.0 | Pre-built Ink components | For all Ink projects. Provides Select, TextInput, Spinner, Table, Box components. Reduces boilerplate significantly. |
| **ink-text-input** | 6.0.0 | Text input component | Use for configuration value entry (API keys, model names). Supports placeholders, masking for secrets, validation. |
| **ink-select** | 1.2.0 | Selection component | Use for project selection, API provider selection, model selection. Keyboard navigation, single/multi-select. |
| **ink-spinner** | 5.0.0 | Loading indicator | Use during async operations (API validation, config loading). Multiple spinner styles. |
| **ink-table** | 3.1.0 | Table display | Use for displaying project list with config status. Clean columnar output. |
| **chalk** | 5.6.2 | Terminal styling | Use for colorful output in non-interactive mode. ESM-native, no runtime dependencies. |
| **zod** | 4.3.6 | Schema validation | Use for validating configuration files, API responses, user input. TypeScript inference eliminates duplicate types. |
| **conf** | 15.1.0 | Config persistence | Use for storing tool preferences (not project configs). XDG-compliant paths, atomic writes, migrations support. |
| **fs-extra** | 11.3.4 | Enhanced file operations | Use for JSON file reading/writing with atomic operations. Promise-based, includes recursive mkdir/copy. |
| **execa** | 9.6.1 | Process execution | Use for running Claude Code commands, testing API connectivity. Improved child_process API, graceful termination. |
| **env-paths** | 4.0.0 | XDG paths | Use for storing global tool config. Returns standard paths for data, config, cache directories per OS. |
| **update-notifier** | 7.3.1 | Update notifications | Use to notify users of new versions. Non-blocking, caches check results. Improves user experience. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **vitest** | Unit testing | Fast, Vite-powered. Native ESM, TypeScript support. Use with ink-testing-library for component tests. |
| **@types/node** | Node.js type definitions | Essential for TypeScript. Version matches Node.js LTS. |
| **tsx** | Development runner | Replaces ts-node. Faster, ESM-native. Use with `tsx watch` for hot reload during development. |

## Installation

```bash
# Core
npm install ink react commander

# Ink UI Components
npm install @inkjs/ui ink-text-input ink-select ink-spinner ink-table

# Utilities
npm install chalk zod conf fs-extra execa env-paths update-notifier

# Dev dependencies
npm install -D typescript tsup vitest @types/node tsx
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **ink** | **blessed** | When building complex dashboard-style TUI with multiple panels, charts, and mouse interactions. Blessed is lower-level but more powerful for dashboards. |
| **ink** | **@clack/prompts** | When building simple linear prompts without complex UI. @clack is lighter weight and has beautiful defaults, but less flexible for interactive apps. |
| **ink** | **terminal-kit** | When needing comprehensive terminal API (colors, input, screen buffers, animations). More low-level, larger bundle. |
| **commander** | **yargs** | When needing advanced features like command completion, extensive validation. Commander is simpler; yargs is more feature-rich but heavier. |
| **commander** | **oclif** | When building enterprise CLI with plugins, hooks, auto-documentation. Oclif is framework-level; commander is library-level. |
| **tsup** | **esbuild** | When needing fine-grained build control. tsup provides zero-config defaults for libraries; esbuild requires more setup. |
| **zod** | **ajv** | When validating against existing JSON Schema specs. Zod is TypeScript-first with inference; ajv is JSON Schema compliant. |
| **vitest** | **jest** | When team is already using Jest. Vitest is faster and ESM-native; Jest has larger ecosystem. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **ts-node** | Slow, ESM support issues, being superseded by tsx | **tsx** — Faster, native ESM, better DX |
| **inquirer (v8)** | Legacy callbacks API, larger bundle. v9+ is ESM-only which causes compatibility issues | **@inquirer/prompts** or **@inkjs/ui** |
| **blessed-contrib** | Abandoned, complex dashboard widget system | **ink + ink-table** for simpler approach |
| **CommonJS (`require`)** | Node.js ESM is now standard. Most CLI tools require ESM | **ESM (`import`)** with `"type": "module"` in package.json |
| **JSON.parse/JSON.stringify directly** | No validation, silent failures, no type safety | **zod + fs-extra** for validated, typed config handling |
| **process.env direct access** | No validation, undefined values cause silent errors | **zod schema + validation** for environment variables |

## Stack Patterns by Variant

**Simple Linear CLI (prompts only):**
- Use: commander + @clack/prompts
- Because: Minimal dependencies, beautiful output, linear flow

**Interactive TUI (like this project):**
- Use: commander + ink + @inkjs/ui
- Because: Full React component model, complex state management, multiple views

**Dashboard-style TUI:**
- Use: blessed + blessed-contrib
- Because: Multiple panels, charts, mouse interactions, lower-level control

**Enterprise CLI with plugins:**
- Use: oclif
- Because: Plugin architecture, hooks, auto-generated docs, SaaS CLI standard

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| ink 7.x | react 18.x, 19.x | React 19 recommended for concurrent features |
| ink 7.x | Node.js 18.17+ | Requires Node.js 18.17 or higher for ESM |
| @inkjs/ui 2.x | ink 7.x | Built for Ink 7, may have issues with Ink 5-6 |
| tsup 8.x | typescript 5.x, 6.x | Type declaration generation works with both |
| zod 4.x | typescript 5.x, 6.x | Type inference works seamlessly |
| vitest 4.x | Node.js 18.x+ | ESM-native, no tsconfig path mapping needed |

## Architecture Recommendations

### Entry Point Structure
```
src/
├── index.ts          # CLI entry point (shebang, commander setup)
├── commands/         # Commander subcommand handlers
│   ├── list.ts       # List projects
│   ├── add.ts        # Add project
│   └── config.ts     # Configure project
├── components/       # Ink React components
│   ├── App.tsx       # Main TUI container
│   ├── ProjectList.tsx
│   └── ConfigEditor.tsx
├── services/         # Business logic
│   ├── config.ts     # Config file operations
│   ├── validation.ts # API validation
│   └── templates.ts  # Template management
├── types/            # TypeScript types
│   └── config.ts     # Zod schemas + inferred types
└── utils/            # Helper functions
```

### Package.json Configuration
```json
{
  "type": "module",
  "bin": {
    "cc-config": "./dist/index.js"
  },
  "exports": {
    ".": "./dist/index.js"
  },
  "engines": {
    "node": ">=18.17"
  }
}
```

### tsup.config.ts
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node18',
  clean: true,
  dts: true,
  minify: false,
  banner: { js: '#!/usr/bin/env node' },
});
```

## Sources

- **npm registry** — Version verification for all packages (2026-04-13)
- **Ink GitHub** — https://github.com/vadimdemedes/ink — React for CLI framework documentation
- **Commander.js docs** — https://github.com/tj/commander.js — CLI framework patterns
- **tsup documentation** — https://tsup.egoist.dev — Build configuration patterns
- **Zod documentation** — https://zod.dev — Schema validation patterns
- **Node.js CLI best practices** — Project structure, ESM, TypeScript recommendations (2025)

---
*Stack research for: CLI/TUI Configuration Management Tool*
*Researched: 2026-04-13*