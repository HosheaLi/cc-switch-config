# CC Config Switch

[![npm version](https://img.shields.io/npm/v/cc-config-switch)](https://www.npmjs.com/package/cc-config-switch)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A CLI/TUI tool for managing Claude Code project-level API provider configurations.

[中文文档](./README_CN.md)

---

## Features

- **Profile CRUD** — Create, list, update, and delete API provider templates
- **Quick Switch** — Apply a profile to any project in one command
- **Interactive TUI** — Dashboard, fuzzy search, diff preview, onboarding wizard
- **Import / Export** — Backup and share configurations as JSON
- **Undo** — Automatic backup before every change, one-command rollback
- **Shell Hook** — Auto-switch configuration on directory change
- **Validation** — Schema validation with helpful error messages
- **Security** — Password-type input, masked display, API keys never logged

## Installation

```bash
npm install -g cc-config-switch
```

Requires Node.js >= 18.17.

## Quick Start

### Launch the TUI

```bash
cc-config
```

The interactive dashboard guides you through project scanning, profile management, and configuration switching.

### CLI Examples

```bash
# Quick-switch current project
cc-config my-config-name

# List registered projects
cc-config list

# Apply a configuration
cc-config switch <project> <config>

# Add a new configuration (interactive)
cc-config config add

# Undo last change
cc-config undo
```

## Documentation

| Resource | Description |
|----------|-------------|
| [Usage Guide](./USAGE.md) | Full CLI command reference and TUI navigation |
| [Development Guide](./DEVELOPMENT.md) | Architecture, setup, testing, and contributing |
| [Changelog](./CHANGELOG.md) | Version history |
| [API Docs](./docs/api/) | Generated TypeDoc documentation |

## Configuration Files

| File | Location | Purpose |
|------|----------|---------|
| `settings.json` | `<project>/.claude/` | Project-level Claude Code config |
| `settings.local.json` | `<project>/.claude/` | Local overrides (not git tracked) |
| `templates.json` | `~/.config/cc-config-switch/` | Provider templates |
| `projects.json` | `~/.local/share/cc-config-switch/` | Registered projects |
| `backups/` | `~/.local/share/cc-config-switch/` | Automatic backups |

## License

[MIT](./LICENSE)

## Contributing

Contributions welcome! See [DEVELOPMENT.md](./DEVELOPMENT.md) for setup instructions.
