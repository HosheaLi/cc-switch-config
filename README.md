# cc-switch-config

<p align="center">
  <b>⚡ Switch in Seconds · 135 KB Ultra-Light · Interactive TUI</b><br>
  <sub>Project-level API configuration management for Claude Code</sub>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/cc-switch-config"><img src="https://img.shields.io/npm/v/cc-switch-config" alt="npm version"></a>
  <a href="https://github.com/HosheaLi/cc-switch-config"><img src="https://img.shields.io/github/stars/HosheaLi/cc-switch-config?style=flat" alt="GitHub stars"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D18.17-brightgreen" alt="Node.js >= 18.17"></a>
  <a href="https://img.shields.io/npm/dm/cc-switch-config"><img src="https://img.shields.io/npm/dm/cc-switch-config" alt="npm downloads"></a>
</p>

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#cli-commands">CLI Commands</a> ·
  <a href="#how-it-works">How It Works</a> ·
  <a href="#shell-hooks">Shell Hooks</a> ·
  <a href="#docs">Docs</a>
</p>

<p align="center">
  <a href="./README_CN.md">中文文档</a>
</p>

---

https://github.com/user-attachments/assets/3c0c7e0f-a96d-4807-b8bd-da8099f4ab84

---

## The Problem

You work across multiple projects, each requiring a different Claude Code API setup:

| Scenario | API Provider | Typical Setup |
|----------|-------------|---------------|
| 🏢 **Team project** | Anthropic direct | Official API key + default model |
| 🧑‍💻 **Personal project** | Custom endpoint | Self-hosted proxy, custom base URL |
| 🤝 **Client project** | Relay service | Third-party API, different model config |
| 🔬 **Experiment** | Different model | Switch between Sonnet/Opus/Haiku profiles |

Editing `.claude/settings.local.json` by hand every time is tedious and error-prone. (cc-switch-config writes to `settings.local.json`, the project-level override file that Claude Code reads with higher priority than `settings.json`.)

**cc-switch-config** solves this: one command to switch your entire Claude Code API configuration. No manual edits, no mistakes, no wasted time.

---

## Features

| # | Feature | Description |
|---|---------|-------------|
| ⚡ | **Instant Switch** | `cc-config <profile>` — one command, done. No manual file editing. |
| 🪶 | **Ultra Lightweight** | Only 8 runtime dependencies, **135 KB** install size. No bloat. |
| 🎨 | **Interactive TUI** | Beautiful terminal dashboard with fuzzy search, diff preview, and guided wizard. |
| 🔒 | **Security First** | Password-masked API key input, masked display everywhere, never written to logs or CLI args. |
| 💾 | **Auto Backup** | Every change is backed up automatically. `cc-config undo` restores instantly. |
| 📦 | **Config Reuse** | Create a provider template once (`cc-config config add`), reuse across any number of projects. |
| 🔗 | **Shell Hooks** | Auto-switch API config when you `cd` into a project directory — zero manual steps. |
| 🗂️ | **Two Config Modes** | **Unified mode** — one model name applies to all 6 Claude Code model env vars. **Granular mode** — set each model env var individually. |
| 🔍 | **Bulk Scan** | Scan entire directory trees to discover `.claude/` projects and register them in bulk. |
| 📤 | **Export/Import** | Share configs across your team via `export`/`import` with merge/overwrite/skip strategies. |
| 🛡️ | **Atomic Writes** | Write-rename pattern ensures your config file is never left in a partial state. |

---

## Quick Start

```bash
# Install globally
npm install -g cc-switch-config

# Launch the interactive TUI dashboard
cc-config

# Quick-switch the current project
cc-config my-anthropic-profile

# List all registered projects
cc-config list
```

### First-Time Setup

```bash
# 1. Create an API config template
cc-config config add
# → Follow the prompts: name, API key, base URL, model

# 2. Register your project
cc-config register /path/to/your/project

# 3. Apply the config
cc-config switch your-project your-config

# 4. Done! Restart Claude Code to pick up the new config.
```

---

## CLI Commands

### Main Entry

```bash
cc-config                           # Launch interactive TUI dashboard
cc-config <config-name>             # Quick-switch current project (most common workflow)
cc-config --help                    # Show help
cc-config --version                 # Show version
```

### Config Management

```bash
cc-config config add                # Create a new config template (unified or granular mode)
cc-config config list               # List all config templates
cc-config config list --json        # List as JSON (for scripting)
cc-config config remove <name>      # Delete a config
cc-config config remove <name> --force  # Force delete without confirmation
cc-config cfg add                   # Alias for config add
cc-config cfg list                  # Alias for config list
cc-config cfg rm <name>             # Alias for config remove
```

Switching modes:

```
 Unified                          Granular
 ┌─────────────────────────────┐   ┌──────────────────────────────┐
 │ name: "anthropic-default"   │   │ name: "custom-setup"         │
 │ apiKey: "sk-ant-****"       │   │ mode: "granular"             │
 │ baseUrl: "https://..."      │   │ env:                         │
 │ modelName: "claude-sonnet"  │   │   ANTHROPIC_MODEL: sonnet    │
 │                             │   │   CLAUDE_CODE_SUBAGENT: haiku│
 └─────────────────────────────┘   │   ... (each var individually)│
                                   └──────────────────────────────┘
```

### Project Management

```bash
cc-config list                      # List registered projects
cc-config list --json               # List as JSON
cc-config register <path>           # Register a project (.claude/ dir required)
cc-config register <path> -t <tmpl> # Register and apply a template
cc-config unregister <name>         # Unregister a project
cc-config unregister <name> --force # Force unregister
cc-config switch <project> <config> # Apply a config to a specific project
cc-config current                   # Show current project's active config
cc-config current --json            # Show as JSON
cc-config scan [directory]          # Scan directory for .claude/ projects
cc-config scan [directory] --register # Scan and auto-register
cc-config scan [directory] --tui    # Scan and open TUI for selection
cc-config scan [directory] --json   # Scan and output JSON
```

### Safety & Tools

```bash
cc-config undo                      # Restore the most recent backup
cc-config export                    # Export config as JSON (writes to file)
cc-config export --stdout           # Export to stdout (pipe to file, share)
cc-config export <project-id>       # Export specific project's config
cc-config import <file>             # Import config from JSON file
cc-config import <file> --merge     # Import and merge with existing
cc-config import <file> --strategy overwrite  # Overwrite on conflict
cc-config import <file> --strategy skip       # Skip on conflict
cc-config auto-check                # For shell hook integration (silent check)
```

---

## How It Works

cc-switch-config manages two data stores — **global config templates** and **per-project settings** — and bridges them with a precise editing engine.

```
Global Store (~/.config/cc-config/)
└── templates.json        ← All your saved config templates
    ├─ "anthropic-direct" → { apiKey, baseUrl, modelName }
    ├─ "openrouter-proxy" → { apiKey, baseUrl, modelName }
    └─ "custom-granular"  → { mode: "granular", env: { ... } }

Per-Project Store (~/.config/cc-config/projects.json)
└── projects             ← Registered project index
    ├─ "project-alpha"   → { path, activeConfig }
    └─ "project-beta"    → { path, activeConfig }

Per-Project Config (~/.local/share/cc-config/)
├── backups/             ← Automatic pre-change backups
│   ├── settings.local.json.20260512T1430.backup
│   └── settings.local.json.20260512T1502.backup
└── projects.json        ← Projects metadata

Target File (<project>/.claude/settings.local.json)
└── { ... "env": { ... }, "model": "...", permissions, hooks, ... }
    ↑ cc-config precisely edits ONLY these two fields
```

cc-switch-config writes to `settings.local.json` for all projects, including when targeting `~/.claude` itself. This is the project-level override file — Claude Code reads it with higher priority than `settings.json`, making it the correct target for per-project API configuration. This ensures API config changes don't interfere with hooks, permissions, `mcpServers`, and other settings in `settings.json`.

### What Gets Modified

When you run `cc-config switch`, only two parts of your target `.claude/settings.local.json` are changed:

- **`env` block**: Provider-specific environment variables (API key, base URL, model name mappings)
- **`model` field** (unified mode): The default model for the project

Everything else — `permissions`, `hooks`, `mcpServers`, `allowWriteToLocalDirectory`, `respectGitignore`, and any custom fields — is left **completely untouched**.

### Safety Guarantees

1. **Atomic writes**: New content is written to a temp file, then renamed over the target. If the process crashes mid-write, the original file is intact.
2. **Auto-backup**: Before every modification, the current state is saved to `backups/` with a timestamp.
3. **Undo**: `cc-config undo` restores the most recent backup.
4. **No key exposure**: API keys are never passed as CLI arguments, never echoed in terminal output in full, and never written to log files.

---

## Shell Hooks

Add this to your `.zshrc` or `.bashrc` for fully automatic config switching:

```zsh
# Auto-switch Claude Code API config when entering a project directory
auto_cc_config() {
  [[ -f .claude/settings.local.json ]] && cc-config auto-check 2>/dev/null
}
chpwd_functions+=(auto_cc_config)
```

Now whenever you `cd` into a project directory that has a `.claude/settings.local.json`, cc-switch-config silently checks if the correct config is active. If you've pre-registered the project and assigned a config, you never need to think about it.

---

## TUI Dashboard

Launch with `cc-config` (no arguments) for the full interactive terminal UI.

| Screen | Key | Action |
|--------|-----|--------|
| **Project List** | `↑/↓` or `j/k` | Navigate projects |
| | `Enter` | Edit/switch config for selected project |
| | `/` or `f` | Fuzzy-search projects |
| | `s` | Scan for new projects |
| | `u` | Undo last change for selected project |
| | `Esc` / `q` | Exit |
| **Config Select** | `↑/↓` | Browse available configs |
| | `Enter` | Preview the diff before applying |
| | `Esc` | Back to project list |
| **Diff Preview** | `y` | Confirm and apply |
| | `n` / `Esc` | Cancel |
| **Scan Results** | `Space` | Toggle project selection |
| | `Enter` | Register selected projects |

---

## Common Scenarios

### Scenario 1: Different API for Each Project

```bash
cd ~/work/team-project
cc-config switch anthropic-direct    # Team uses official Anthropic

cd ~/personal/hobby-project
cc-config switch openrouter-proxy    # Personal uses OpenRouter relay

cd ~/clients/acme-corp
cc-config switch acme-custom         # Client requires custom endpoint
```

### Scenario 2: Bulk Onboarding

```bash
# Scan an entire code directory and register all projects at once
cc-config scan ~/code --register

# Then apply the same config to a set of projects
cc-config switch project-a default
cc-config switch project-b default
```

### Scenario 3: Team Config Sharing

```bash
# Export your config (without exposing full API keys)
cc-config export --stdout > team-config.json

# Share the file with your team. They import it:
cc-config import team-config.json --strategy merge
```

### Scenario 4: Experiment with Models

```bash
# Create multiple configs for the same provider, different models
cc-config config add    # "sonnet-testing" → claude-sonnet-4
cc-config config add    # "haiku-testing"  → claude-haiku-3.5
cc-config config add    # "opus-testing"   → claude-opus-4

# Switch between them instantly
cc-config sonnet-testing   # ↔ cc-config haiku-testing
```

---

## Docs

| Document | Description |
|----------|-------------|
| [Usage Guide](./USAGE.md) | Complete CLI reference, TUI navigation, all scenarios |
| [Development Guide](./DEVELOPMENT.md) | Architecture, local dev setup, testing, contributing |
| [Changelog](./CHANGELOG.md) | Version history and release notes |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js >= 18.17 (ESM) |
| Language | TypeScript 6.x (strict mode, ES2022 target, NodeNext module) |
| Build | tsup → single `dist/index.js` |
| CLI framework | commander 14.x |
| TUI | prompts, picocolors, cli-table3 |
| Data validation | zod 4.x |
| Testing | vitest 3.x + v8 coverage |
| Config storage | conf 15.x (filesystem-backed JSON) |

---

## License

[MIT](./LICENSE) © HosheaLi

---

## Contributing

Contributions are welcome! Here's how to get started:

1. **Set up**: `npm install && npm link`
2. **Develop**: `npm run dev` (hot-reload via tsx watch)
3. **Test**: `npm test` (all tests must pass)
4. **Type check**: `npm run typecheck` (no errors)
5. **Build**: `npm run build` (before commit)
6. **PR**: Open a pull request with a clear description

Please read [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed contribution guidelines.
