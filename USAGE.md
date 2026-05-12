# Usage Guide

## Quick Reference

```bash
cc-config                           # Launch TUI
cc-config <config-name>             # Quick-switch current project
cc-config list [--json]             # List registered projects
cc-config current [--json]          # Show current project config
cc-config switch <project> <config>  # Apply config to project
cc-config undo                      # Restore last backup
```

## Configuration Management

```bash
cc-config config add                # Create config (unified or granular mode)
cc-config config list [-j]          # List configs
cc-config config remove <name> [--force]
cc-config cfg add                   # Alias
cc-config cfg list
cc-config cfg rm <name>
```

### Config Modes

- **Unified**: One model name → all 6 model env vars (`ANTHROPIC_MODEL`, `ANTHROPIC_DEFAULT_SONNET_MODEL`, `ANTHROPIC_DEFAULT_HAIKU_MODEL`, `ANTHROPIC_DEFAULT_OPUS_MODEL`, `ANTHROPIC_REASONING_MODEL`)
- **Granular**: Each model env var specified individually

## Project Management

```bash
cc-config register <path> [-t template]
cc-config unregister <name> [--force]
cc-config scan [directory] [--register] [--tui] [--json]
cc-config auto-check                 # For shell hooks
```

## Import/Export

```bash
cc-config export [project-id] [file] [--stdout]
cc-config import <file> [--merge] [--strategy merge|overwrite|skip]
```

## TUI Navigation

| Screen | Key | Action |
|--------|-----|--------|
| Project List | `↑/↓` or `j/k` | Navigate |
| Project List | `Enter` | Edit config |
| Project List | `/` or `f` | Fuzzy search |
| Project List | `s` | Scan projects |
| Project List | `u` | Undo for selected |
| Project List | `Esc` | Exit |
| Config Edit | `↑/↓` | Select config |
| Config Edit | `Enter` | Preview diff |
| Config Edit | `Esc` | Back to list |
| Diff Preview | `y` | Apply |
| Diff Preview | `n` / `Esc` | Cancel |
| Scan | `Space` | Toggle selection |
| Scan | `Enter` | Register selected |

## Shell Hook Integration

Add to `.zshrc`:

```zsh
auto_cc_config() {
  [[ -f .claude/settings.json ]] && cc-config auto-check 2>/dev/null
}
chpwd_functions+=(auto_cc_config)
```

## Scenarios

### Multi-project with different APIs

```bash
cd ~/project-a && cc-config switch anthropic
cd ~/project-b && cc-config switch openrouter
```

### Bulk registration

```bash
cc-config scan ~/code --register
```

### Team config sharing

```bash
cc-config export --stdout > team-config.json
cc-config import team-config.json --strategy merge
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Config not applied | Restart Claude Code |
| Project not found | `cc-config scan --register` first |
| Config not found | `cc-config config list` to see available configs |
| Undo not working | Requires backup; only restores the most recent one |
