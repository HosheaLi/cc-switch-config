# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-05-08

### Added

- Initial release of CC Config Switch
- CLI commands: `list`, `current`, `switch`, `undo`, `template`, `scan`, `auto-check`, `import`, `export`
- Interactive TUI for visual configuration management
- Profile CRUD operations for provider templates
- Configuration preview with unified diff display
- Automatic backup before every configuration change with undo support
- Schema validation for configurations with helpful error messages
- Shell hook integration for auto-switching on directory change
- Import/export functionality for backup and sharing
- Project scanning with registration support
- Connectivity testing for provider endpoints
- Watch mode for monitoring configuration changes

### Features

- Keyboard navigation (arrow keys + vim j/k)
- Fuzzy search for quick project filtering
- Real-time preview panel in TUI
- Color-coded diff display (red/green for removed/added)
- Merge or replace strategies for import
- Non-interactive mode for CLI automation