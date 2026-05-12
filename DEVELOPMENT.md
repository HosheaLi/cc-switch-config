# Development Guide

## Tech Stack

- **Language**: TypeScript 5.x (ESM, NodeNext)
- **Build**: tsup → ESM, `dist/index.js`
- **Test**: vitest + v8 coverage
- **Runtime**: Node.js >= 18.17

## Project Structure

```
src/
  index.ts           # Entry point → CLI bootstrap
  cli/               # CLI layer (commands, prompts, dashboard, theme, output)
  lib/
    services/        # Business logic (ConfigService, ProjectService, ExportService, etc.)
    store/           # Data persistence (api-config, watcher, project-index)
    types/           # Zod schemas + validation
    security/        # API key encryption, masking, token checking
    file-system/     # File I/O (JSON read/write, backup, error enhancement)
    config/          # Config version management + migration
    constants/       # Constants
    paths/           # Path resolution
tests/
  e2e/               # End-to-end tests
```

## Setup

```bash
# Install dependencies
npm install

# Global link (first time only)
npm link
```

## Development Commands

```bash
npm run dev              # Hot-reload via tsx watch
npm run build            # Production build via tsup
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run typecheck        # tsc --noEmit
npm run bench            # Performance benchmarks
npm run docs             # Generate TypeDoc API docs
```

## Testing

### Unit Tests

```bash
# All tests
npm test

# Single file
npm test -- --run src/lib/services/export-service.test.ts

# Coverage
npm run test:coverage
```

### E2E Tests

```bash
npm test -- --run tests/e2e/
```

### Manual Testing

```bash
# After build + link
npm run build

# Test CLI commands
cc-config --version
cc-config --help
cc-config list
cc-config list --json
cc-config config list
cc-config current

# Scan directories
cc-config scan ~/code
cc-config scan ~/code --json

# Register project (requires .claude/ directory)
cc-config register <path> [-t template]

# Switch configuration
cc-config switch <project> <config>

# Undo
cc-config undo

# Unregister
cc-config unregister <project>

# Import/Export
cc-config export --stdout > /tmp/cc-export.json
cc-config import /tmp/cc-export.json

# Error handling
cc-config import /nonexistent/file.json
cc-config register /tmp           # Will reject — no .claude/
cc-config config remove nonexistent

# Environment variables
NO_COLOR=1 cc-config list         # Disable colors
```

### Debian/Ubuntu Testing

```bash
# Install from local package
npm pack
mkdir -p /tmp/cc-test && cd /tmp/cc-test
npm init -y
npm install <path-to-tgz>
npx cc-config --version
```

### Cleanup

```bash
npm unlink -g cc-switch-config
rm cc-switch-config-*.tgz
```

## Architecture Principles

- **D-01**: Services as classes with constructor injection
- **D-02**: Services throw Error for error handling
- **D-04**: Project detection: auto-scan + manual confirmation
- **M4**: Module separation (Services don't depend on UI)
- **R1**: Atomic writes (write-rename pattern)
- **R2**: Backup system (backup → operation → rollback)

### Configuration Storage

A configuration can be either:
- **Unified mode**: `(name, apiKey, baseUrl, modelName)` — single model name applies to all model env vars
- **Granular mode**: `(name, mode, env[])` — each model env var specified individually

### Key Design Decisions

- Precise field replacement: only modify `env`/`model`, preserve `permissions`/`hooks`/`mcpServers`
- API keys: password-type input + masked display, never exposed in CLI args or logs
- Theme: OpenCode Terminal Aesthetic (picocolors, NO_COLOR support)

## Coding Style

- ES2022 target, NodeNext module resolution
- Strict mode `strict: true`
- vitest globals, Arrange-Act-Assert pattern
- Chinese comments, commits, and documentation
- Functions < 50 lines, files < 800 lines, nesting ≤ 4 levels

## Release

See [RELEASE.md](./RELEASE.md) for the release checklist.

## Contributing

1. Ensure tests pass: `npm test`
2. Ensure typecheck passes: `npm run typecheck`
3. Run build before commit: `npm run build`
4. Update CHANGELOG.md for significant changes
5. Open a PR with a clear description of changes
