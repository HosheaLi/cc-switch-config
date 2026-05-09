# CC Config Switch

A CLI/TUI tool for managing Claude Code project-level API provider configurations.

English | [中文](./README_CN.md)

## Overview

CC Config Switch helps you manage different API providers and model configurations for different projects. Instead of manually editing `.claude/settings.json` files for each project, you can:

- Create reusable provider templates
- Quickly switch between configurations
- Preview changes before applying
- Import/export configurations for backup and sharing

## Installation

```bash
npm install cc-config-switch
```

Or install globally:

```bash
npm install -g cc-config-switch
```

## Quick Start

### Launch the TUI

The simplest way to use CC Config Switch is through its interactive TUI:

```bash
cc-config
```

This opens an interactive interface where you can:
- Browse all registered projects
- Select a project and apply a template
- Preview configuration changes before applying
- View validation errors if configuration is invalid

### CLI Commands

If you prefer command-line operations:

```bash
# List all registered projects
cc-config list

# Show current project's configuration
cc-config current

# Switch project configuration
cc-config switch my-project my-config

# Undo last configuration change
cc-config undo
```

## CLI Commands Reference

### `cc-config list`

List all registered projects with their configuration status.

```bash
cc-config list [--json]
```

Options:
- `--json`: Output in JSON format

### `cc-config current`

Display the current project's active configuration.

```bash
cc-config current
```

Shows:
- Project path
- Active template name
- Last modified time

### `cc-config switch`

Apply a configuration template to a project.

```bash
cc-config switch <project-name-or-path> <config-name>
```

### `cc-config config`

Manage API provider configurations.

```bash
# List all configurations
cc-config config list

# Add a new configuration (interactive CLI)
cc-config config add

# Remove a configuration
cc-config config remove <name> [--force]
```

Options:
- `--force`: Skip confirmation prompt for remove

### `cc-config undo`

Restore the most recent backup of the current project's configuration.

```bash
cc-config undo
```

Restores from the latest backup file and shows the backup timestamp.

### `cc-config scan`

Scan directories for Claude Code projects.

```bash
cc-config scan [directory] [--register] [--tui] [--json]
```

Options:
- `--register`: Automatically register found projects
- `--tui`: Launch TUI multi-select interface
- `--json`: Output as JSON format

### `cc-config auto-check`

Check if current directory should trigger auto-switch.

```bash
cc-config auto-check
```

Used by shell hooks to detect project directories.

### `cc-config import`

Import configurations from a JSON file.

```bash
cc-config import <file> [--merge] [--strategy <merge|overwrite|skip>]
```

Options:
- `--merge`: Alias for `--strategy merge`
- `--strategy`: Import strategy (non-interactive mode)

### `cc-config export`

Export configurations to a JSON file.

```bash
cc-config export [project-id] [file] [--stdout]
```

Options:
- `--stdout`: Output to stdout instead of file

## TUI Navigation

When you launch `cc-config` without arguments, the TUI opens.

### Project List Screen

- **Arrow keys**: Navigate project list
- **j/k**: Vim-style navigation
- **Enter**: Select project to edit
- **U**: Undo last change for selected project
- **S**: Scan for new projects
- **/ or f**: Start fuzzy search
- **Escape**: Exit

### Configuration Editor Screen

- **Arrow keys**: Navigate template list
- **Enter**: Preview and apply template
- **Escape**: Cancel and return to project list

### Diff Screen (Before Apply)

Shows configuration changes before applying:
- Red lines: Values being removed
- Green lines: Values being added

- **y**: Confirm and apply
- **n or Escape**: Cancel

### Validation Error Screen

If configuration has errors, this screen blocks further action:
- Shows all validation errors
- **Escape**: Return to fix errors

### Scan Screen

Select new projects to register:
- **Arrow keys**: Navigate
- **Space**: Toggle selection
- **Enter**: Register selected projects
- **Escape**: Cancel

## Features

### Profile CRUD Operations

Full lifecycle management for configurations:
- Create new provider templates
- Read/list all templates
- Update existing templates
- Delete templates with confirmation

### Interactive TUI Selector

Visual interface with:
- Keyboard navigation (arrow keys + vim j/k)
- Fuzzy search for quick filtering
- Real-time preview panel

### Configuration Preview

Before applying any template:
- View unified diff of changes
- Red shows removed values, green shows added
- Only changed fields displayed (compact view)

### Template System

Create reusable templates for:
- Different API providers (Anthropic, OpenRouter, etc.)
- Different model configurations
- Custom environment settings

### Import/Export

Backup and share configurations:
- Export all templates to JSON
- Import from JSON file
- Merge or replace on import

### Validation

Schema validation for configurations:
- Type checking for all fields
- Helpful error messages with paths
- Blocks invalid configurations

### Undo Support

Recover from mistakes:
- Automatic backup before every change
- Single undo command restores latest backup
- Shows backup timestamp

### Shell Hook Integration

Auto-switch when entering project directories:
- Shell hook detects project changes
- Automatic configuration application
- Silent mode for minimal output

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run performance benchmarks
npm run bench

# Generate API documentation
npm run docs
```

## Configuration Files

CC Config Switch manages these files:

| File | Location | Purpose |
|------|----------|---------|
| `settings.json` | `<project>/.claude/` | Project-level Claude Code config |
| `settings.local.json` | `<project>/.claude/` | Local overrides (not git tracked) |
| `templates.json` | `~/.config/cc-config-switch/` | Provider templates |
| `projects.json` | `~/.local/share/cc-config-switch/` | Registered projects |

## License

MIT

## Contributing

Contributions welcome! Please read the documentation and ensure tests pass before submitting PRs.