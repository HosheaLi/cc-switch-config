# CC Config Switch - User Guide

Complete documentation for all CLI commands and TUI workflows.

## Table of Contents

- [Overview](#overview)
- [CLI Commands](#cli-commands)
- [TUI Navigation](#tui-navigation)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

---

## Overview

CC Config Switch is a tool for managing Claude Code API provider configurations across multiple projects. It provides both a command-line interface (CLI) for quick operations and an interactive terminal UI (TUI) for visual management.

### Why Use CC Config Switch?

- **Multiple Projects**: Manage different API configurations for different projects
- **Templates**: Create reusable provider templates instead of manual JSON editing
- **Safety**: Preview changes before applying, automatic backups, undo support
- **Speed**: Quick commands for common operations, fuzzy search for fast navigation

### Core Concepts

**Project**: A directory containing Claude Code configuration (`<project>/.claude/settings.json`)

**Template**: A reusable configuration for an API provider (model, base URL, environment variables)

**Active Config**: The template currently applied to a project

---

## CLI Commands

### `cc-config list`

List all registered projects with their configuration status.

```bash
cc-config list [--json]
```

**Output Example**:
```
Project                      Active Config     Last Modified
────────────────────────────────────────────────────────────
~/code/my-project            anthropic-prod    2026-04-15
~/code/another-project       openrouter-dev    2026-04-14
~/code/test-project          (none)            2026-04-13
```

**Options**:
- `--json`: Output as JSON array

**JSON Output Example**:
```json
[
  {
    "id": "uuid-...",
    "path": "/Users/you/code/my-project",
    "activeConfig": "anthropic-prod",
    "lastModified": "2026-04-15T10:30:00Z"
  }
]
```

---

### `cc-config current`

Display the current project's configuration status.

```bash
cc-config current
```

**Output Example**:
```
Current Project: ~/code/my-project
Active Config: anthropic-prod
Last Modified: 2 minutes ago
```

**Exit Codes**:
- 0: Success, project found with active config
- 3: Project not found in index
- 4: Configuration error

---

### `cc-config switch <template>`

Apply a template to the current project directory.

```bash
cc-config switch <template-name> [--silent]
```

**Behavior**:
1. Finds the template in your template store
2. Reads current project config (if exists)
3. Deep merges template settings with existing config
4. Creates backup before modification
5. Writes new configuration

**Options**:
- `--silent`: Suppress success messages (default: true)

**Example**:
```bash
cc-config switch openrouter-dev
# Output: Applied 'openrouter-dev' to ~/code/my-project
```

**Exit Codes**:
- 0: Success
- 3: Template not found
- 4: Configuration error

---

### `cc-config template`

Manage provider templates with subcommands.

#### `cc-config template list`

List all saved templates.

```bash
cc-config template list
```

**Output Example**:
```
Template                    Created          Updated
───────────────────────────────────────────────────
anthropic-prod              2026-04-10       2026-04-15
openrouter-dev              2026-04-12       2026-04-14
local-test                  2026-04-13       (never)
```

**Aliases**: `tpl list`, `tpl ls`, `template ls`

#### `cc-config template create <name>`

Create a new template (opens TUI editor).

```bash
cc-config template create my-new-template
```

**Aliases**: `tpl create`, `tpl c`, `template c`

#### `cc-config template delete <name>`

Delete a template.

```bash
cc-config template delete old-template [--force]
```

**Options**:
- `--force`: Skip confirmation prompt

**Aliases**: `tpl delete`, `tpl d`, `template d`

---

### `cc-config undo`

Restore the most recent backup.

```bash
cc-config undo
```

**Output Example**:
```
Restored settings.json from backup:
  Backup: settings.json.2026-04-15T10-30-00-123Z
  Time: 2 minutes ago

Previous configuration has been restored.
```

**Behavior**:
1. Finds latest backup file for current project
2. Copies backup to settings.json (atomic write)
3. Reports backup timestamp

**Error Cases**:
- `NO_BACKUP`: No backup files found
- `RESTORE_FAILED`: File I/O error

---

### `cc-config scan`

Scan directories for Claude Code projects.

```bash
cc-config scan [directory] [--register]
```

**Behavior**:
1. Scans specified directory (or configured roots)
2. Finds directories with `.claude/settings.json`
3. Lists projects (new and existing)
4. Optionally registers new projects

**Options**:
- `--register`: Automatically register all found projects

**Output Example**:
```
Scanning ~/code for Claude projects...

Found 3 new projects:
  ~/code/project-a (NEW)
  ~/code/project-b (NEW)
  ~/code/old-project (registered)
```

---

### `cc-config auto-check`

Check if current directory should trigger auto-switch.

```bash
cc-config auto-check
```

**Purpose**: Used by shell hooks (see Shell Hook Integration below).

**Output**:
- Silent if not a registered project
- Outputs message if auto-switch triggered

---

### `cc-config import`

Import configurations from a JSON file.

```bash
cc-config import <file.json> [--merge]
```

**Import Format**:
```json
{
  "version": "1.0",
  "templates": {
    "imported-template": {
      "provider": {
        "name": "Imported Provider",
        "env": {
          "ANTHROPIC_MODEL": "claude-4-sonnet",
          "ANTHROPIC_BASE_URL": "https://api.example.com"
        }
      }
    }
  }
}
```

**Options**:
- `--merge`: Merge with existing templates (default: replace)

**Conflict Handling**:
- If template name exists, prompts for strategy:
  - Skip: Keep existing
  - Replace: Overwrite with imported
  - Rename: Import with new name

---

### `cc-config export`

Export all templates to a JSON file.

```bash
cc-config export <file.json>
```

**Output File**:
```json
{
  "version": "1.0",
  "templates": {
    "anthropic-prod": {
      "provider": { ... },
      "createdAt": "2026-04-10T...",
      "updatedAt": "2026-04-15T..."
    }
  }
}
```

---

## TUI Navigation

### Launching the TUI

```bash
cc-config
```

Or with no arguments to any command:

```bash
cc-config list
# (if no output format specified, launches TUI)
```

---

### Project List Screen

The main screen showing all registered projects.

**Navigation**:
| Key | Action |
|-----|--------|
| Up/Down Arrow | Move selection |
| j/k | Vim-style navigation |
| Enter | Select project (open ConfigEditor) |
| U | Undo last change for selected project |
| S | Scan for new projects |
| / or f | Start fuzzy search |
| Escape | Exit TUI |

**Fuzzy Search**:
- Type to filter projects
- Threshold 0.4 for balanced precision/recall
- Enter to select filtered result

**Status Bar**:
- Shows current project count
- Displays error messages (red)
- Shows undo feedback (success messages)

---

### Configuration Editor Screen

Edit configuration for a selected project.

**Navigation**:
| Key | Action |
|-----|--------|
| Up/Down Arrow | Move through template list |
| Enter | Preview and apply selected template |
| Escape | Return to Project List |

**Preview Panel**:
- Shows template configuration preview
- Environment variables (tokens masked)

**Applying a Template**:
1. Press Enter on template
2. DiffScreen shows changes
3. Confirm or cancel

---

### Diff Screen

Preview configuration changes before applying.

**Display**:
```
--- settings.json (before)
+++ settings.json (after)

- env.MODEL: "claude-3-opus"
+ env.MODEL: "claude-4-sonnet"

- env.BASE_URL: "https://api.anthropic.com"
+ env.BASE_URL: "https://api.openrouter.ai"
```

**Colors**:
- Red: Values being removed
- Green: Values being added

**Navigation**:
| Key | Action |
|-----|--------|
| y | Confirm and apply |
| n | Cancel |
| Escape | Cancel |

---

### Validation Error Screen

Shows validation errors when configuration is invalid.

**Display**:
```
Validation Errors

The following issues must be fixed before applying:

env.MODEL: Expected string, received undefined
env.MAX_OUTPUT_TOKENS: Unrecognized key
apiProvider[0].baseUrl: Invalid URL format

Press Escape to return and fix errors.
```

**Behavior**:
- **No confirm option**: User must fix errors before proceeding
- Only Escape to return to editor

**Navigation**:
| Key | Action |
|-----|--------|
| Escape | Return to fix errors |

---

### Scan Screen

Select new projects to register.

**Navigation**:
| Key | Action |
|-----|--------|
| Up/Down Arrow | Move selection |
| Space | Toggle checkbox |
| Enter | Register selected projects |
| Escape | Cancel scan |

**Display**:
```
Found 5 new projects:

[ ] ~/code/project-a
[x] ~/code/project-b
[ ] ~/code/project-c
[x] ~/code/project-d
[ ] ~/code/project-e

Press Enter to register selected, Escape to cancel.
```

---

### Import Conflict Screen

Resolve template name conflicts during import.

**Navigation**:
| Key | Action |
|-----|--------|
| s | Skip (keep existing) |
| r | Replace (overwrite) |
| n | Rename (specify new name) |
| Escape | Cancel import |

---

## Configuration

### Template Format

Templates are stored in `~/.config/cc-config-switch/templates.json`:

```json
{
  "version": 1,
  "templates": {
    "my-template": {
      "provider": {
        "name": "My Provider",
        "env": {
          "ANTHROPIC_MODEL": "claude-4-sonnet",
          "ANTHROPIC_BASE_URL": "https://api.anthropic.com",
          "ANTHROPIC_AUTH_TOKEN": "sk-ant-..."
        }
      },
      "createdAt": "2026-04-15T...",
      "updatedAt": "2026-04-15T..."
    }
  }
}
```

### Environment Variables

Templates can include any Claude Code environment variables:

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_MODEL` | Default model |
| `ANTHROPIC_BASE_URL` | API endpoint URL |
| `ANTHROPIC_AUTH_TOKEN` | API key (store in local!) |
| `ANTHROPIC_SMALL_FAST_MODEL` | Fast model for simple tasks |
| `MAX_OUTPUT_TOKENS` | Output token limit |

### Security Best Practices

1. **Store tokens in settings.local.json**:
   - Never commit API tokens to git
   - Use `.claude/settings.local.json` for secrets

2. **Token masking in TUI**:
   - Tokens displayed as `(masked)` in preview
   - Keys containing `TOKEN` or `KEY` are hidden

3. **File permissions**:
   - Config files should have 600 permissions
   - Only owner can read/write

### Project Registration

Projects are registered in `~/.local/share/cc-config-switch/projects.json`:

```json
{
  "version": 1,
  "projects": {
    "uuid-...": {
      "id": "uuid-...",
      "path": "/Users/you/code/my-project",
      "activeConfig": "anthropic-prod",
      "lastModified": "2026-04-15T..."
    }
  },
  "pathIndex": {
    "/Users/you/code/my-project": "uuid-..."
  }
}
```

### Scan Directories

Configure which directories to scan:

```bash
# Via TUI: Settings screen
# Via config file: ~/.config/cc-config-switch/config.json
```

```json
{
  "scanDirectories": [
    "~/code",
    "~/projects"
  ]
}
```

---

## Shell Hook Integration

### Auto-Switch Setup

Add to your shell configuration for automatic project detection.

**Bash (~/.bashrc)**:
```bash
# CC Config Switch auto-switch hook
cc_config_auto_switch() {
  local result=$(cc-config auto-check 2>/dev/null)
  if [[ -n "$result" ]]; then
    echo "$result"
  fi
}

# Trigger on cd
cd() {
  builtin cd "$@" && cc_config_auto_switch
}
```

**Zsh (~/.zshrc)**:
```zsh
# CC Config Switch auto-switch hook
cc_config_auto_switch() {
  local result=$(cc-config auto-check 2>/dev/null)
  if [[ -n "$result" ]]; then
    echo "$result"
  fi
}

# chpwd hook (triggered on directory change)
chpwd_functions+=(cc_config_auto_switch)
```

### Shell Hook Behavior

When you `cd` into a registered project directory:
1. Shell hook runs `cc-config auto-check`
2. If project is registered, auto-switch triggers
3. Active configuration applied silently

---

## Troubleshooting

### Common Issues

#### "Project not found"

**Cause**: Current directory not registered in project index.

**Solution**:
```bash
cc-config scan --register
```

#### "Template not found"

**Cause**: Template name doesn't exist in templates.json.

**Solution**:
```bash
cc-config template list  # Check available templates
cc-config template create <name>  # Create missing template
```

#### "No backup available"

**Cause**: No previous modifications made to this project.

**Solution**: Cannot undo without backup. Make a change first.

#### "Validation failed"

**Cause**: Configuration doesn't match schema.

**Solution**: Check validation error messages for specific issues.

### Error Messages

| Error Code | Meaning | Action |
|------------|---------|--------|
| `PROJECT_NOT_FOUND` | Directory not registered | Run `scan --register` |
| `TEMPLATE_NOT_FOUND` | Template missing | Create template |
| `NO_BACKUP` | No backup files | Cannot undo |
| `TEMPLATE_APPLY_FAILED` | Write failed | Check file permissions |
| `VALIDATION_ERROR` | Config invalid | Fix reported errors |

### Debug Mode

Enable verbose output:

```bash
DEBUG=1 cc-config <command>
```

### File Locations

| File | Path |
|------|------|
| Templates | `~/.config/cc-config-switch/templates.json` |
| Projects | `~/.local/share/cc-config-switch/projects.json` |
| App State | `~/.config/cc-config-switch/cc-config-switch.json` |

### Reset Configuration

Clear all stored data:

```bash
rm -rf ~/.config/cc-config-switch
rm -rf ~/.local/share/cc-config-switch
```

---

## Performance

### Benchmarks

CC Config Switch targets these performance metrics:

| Metric | Target | Typical |
|--------|--------|---------|
| Cold startup | < 1s | ~30ms |
| Switch operation | < 100ms | ~5ms |
| 100 project scan | < 5s | ~1s |
| TUI render | < 50ms | ~2ms |

### Run Benchmarks

```bash
npm run bench
```

---

## Version History

### v0.1.0

Initial release with:
- CLI commands (list, switch, current, template, undo, scan, import, export)
- Interactive TUI with fuzzy search
- Template management
- Diff preview before apply
- Validation with error blocking
- Undo support
- Import/Export configurations
- Shell hook integration

---

*Documentation for CC Config Switch v0.1.0*