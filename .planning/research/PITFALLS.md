# Pitfalls Research

**Domain:** CLI/TUI Configuration Management Tools
**Researched:** 2026-04-13
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Config File Corruption from Non-Atomic Writes

**What goes wrong:**
Using `fs.writeFile()` directly on config files causes corruption when the process crashes, system loses power, or disk fills up mid-write. Users end up with half-written JSON that's neither the old valid config nor the new one.

**Why it happens:**
Developers assume `fs.writeFile()` is atomic or that crashes are rare. Node.js doesn't guarantee atomic writes by default, and JSON files become invalid with any partial write.

**How to avoid:**
```javascript
// NEVER do this
await fs.writeFile('config.json', JSON.stringify(data));

// ALWAYS use write-rename pattern
async function safeWriteJSON(filepath, data) {
  const tempPath = `${filepath}.tmp.${process.pid}`;
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2));
  await fs.rename(tempPath, filepath); // Atomic on POSIX
}
```

**Warning signs:**
- Users report "invalid JSON" errors after crashes
- Config files contain partial content
- File size is smaller than expected
- JSON.parse() fails on config read

**Phase to address:**
Phase 1 (Foundation) - Implement in core file operations module before any config writing features.

---

### Pitfall 2: TOCTOU Race Conditions (Time-Of-Check-Time-Of-Use)

**What goes wrong:**
Checking if a file exists, then reading/writing it creates a race condition. Between the check and the operation, another process might modify or delete the file.

**Why it happens:**
Node.js async operations interleave, allowing multiple operations to access the same file concurrently. Developers assume single-threaded event loop prevents races.

**How to avoid:**
```javascript
// WRONG: Check-then-act
if (fs.existsSync('config.json')) {
  const data = await fs.readFile('config.json'); // File might not exist!
}

// RIGHT: Handle errors
try {
  const data = await fs.readFile('config.json');
} catch (err) {
  if (err.code === 'ENOENT') {
    // File doesn't exist - handle gracefully
    return defaultConfig;
  }
  throw err;
}

// RIGHT: Use exclusive flags
const fh = await fs.open('config.json', 'wx'); // Fails if exists
```

**Warning signs:**
- Intermittent ENOENT errors
- Config sometimes disappears
- "Unexpected state" after concurrent edits
- Tests fail randomly when running in parallel

**Phase to address:**
Phase 1 (Foundation) - Core file operations must handle races from day one.

---

### Pitfall 3: No Config Backup Before Modifications

**What goes wrong:**
Users modify configs, accidentally delete something important, or a bug corrupts the file. No way to recover previous state. Users lose all their configurations and must rebuild from memory.

**Why it happens:**
Backup is seen as unnecessary complexity for MVP. Developers assume users can use Git, but users often don't version control their config directories.

**How to avoid:**
```javascript
async function backupBeforeWrite(filepath) {
  const backupDir = path.join(path.dirname(filepath), '.backups');

  // Create backup directory if needed
  await fs.mkdir(backupDir, { recursive: true });

  // Timestamped backup
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `${path.basename(filepath)}.${timestamp}`);

  // Only backup if file exists
  try {
    await fs.copyFile(filepath, backupPath);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  return backupPath;
}
```

**Warning signs:**
- Users ask "how do I undo this?"
- Support requests about lost configs
- Users manually copying files before using tool
- Complaints about "risky" modifications

**Phase to address:**
Phase 1 (Foundation) - Backup mechanism must exist before any config modification feature.

---

### Pitfall 4: Poor Error Messages for Invalid JSON

**What goes wrong:**
When users manually edit configs and make a JSON syntax error, they get useless messages like "Unexpected token" or "JSON parse error" without context. They can't find or fix the mistake.

**Why it happens:**
Node.js default JSON.parse() errors don't include line numbers or context. Developers propagate these errors directly to users instead of parsing them for useful information.

**How to avoid:**
```javascript
import { parse as parseJSONWithLines } from 'json-source-map';
// Or use: json-parse-even-better-errors, json-source-map

async function readConfigWithErrors(filepath) {
  const content = await fs.readFile(filepath, 'utf8');

  try {
    return JSON.parse(content);
  } catch (err) {
    // Parse error to get line/column
    const lines = content.split('\n');
    const match = err.message.match(/position (\d+)/);

    if (match) {
      const position = parseInt(match[1]);
      let currentPos = 0;
      for (let i = 0; i < lines.length; i++) {
        if (currentPos + lines[i].length >= position) {
          throw new Error(
            `JSON syntax error in ${filepath}\n` +
            `Line ${i + 1}, column ${position - currentPos + 1}\n` +
            `  ${lines[i]}\n` +
            `  ${' '.repeat(position - currentPos)}^\n` +
            `Error: ${err.message}`
          );
        }
        currentPos += lines[i].length + 1;
      }
    }
    throw err;
  }
}
```

**Warning signs:**
- Users paste configs into validators to find errors
- Support requests asking "where's the syntax error?"
- Users abandon tool and edit files manually
- Complaints about "unhelpful error messages"

**Phase to address:**
Phase 1 (Foundation) - User-friendly error messages are table stakes for a config tool.

---

### Pitfall 5: Cross-Platform Path Handling Issues

**What goes wrong:**
Paths work on developer's Mac but fail on Windows. Hardcoded `/` separators, case-sensitivity assumptions, and different home directory locations break across platforms.

**Why it happens:**
Developers test on one platform. macOS/Linux use `/`, Windows uses `\`. Home is `~` on Unix, `%USERPROFILE%` on Windows. Case-sensitivity differs between file systems.

**How to avoid:**
```javascript
import path from 'path';
import os from 'os';
import { homedir } from 'os';

// WRONG: Hardcoded separators
const configPath = `${homedir()}/.config/myapp/config.json`;

// RIGHT: Use path methods
const configDir = path.join(os.homedir(), '.config', 'myapp');
const configPath = path.join(configDir, 'config.json');

// RIGHT: Cross-platform config locations
import envPaths from 'env-paths';

const paths = envPaths('myapp', { suffix: '' });
// Returns platform-specific paths:
// macOS: ~/Library/Application Support/myapp
// Linux: ~/.config/myapp
// Windows: %APPDATA%/myapp
```

**Warning signs:**
- "Works on my machine" issues
- Windows users report "file not found" errors
- Path comparison fails due to different separators
- Case-sensitivity bugs on case-insensitive file systems

**Phase to address:**
Phase 1 (Foundation) - Must be cross-platform from the start, hard to retrofit.

---

### Pitfall 6: Config Schema Migration Breaking Changes

**What goes wrong:**
New version changes config structure. Users update and lose all their settings or get cryptic errors. No migration path from old configs.

**Why it happens:**
Schema evolution is an afterthought. Developers add features without considering backward compatibility. No version field in config to detect and migrate.

**How to avoid:**
```javascript
// ALWAYS include version field
const CONFIG_VERSION = 2;

const defaultConfig = {
  version: CONFIG_VERSION,
  // ... other fields
};

// Migrations array indexed by version
const migrations = [
  // v0 -> v1: Rename 'api' to 'apiUrl'
  (config) => ({ ...config, apiUrl: config.api, version: 1 }),
  // v1 -> v2: Restructure MCP config
  (config) => ({
    ...config,
    mcpServers: config.mcp?.servers || {},
    version: 2
  }),
];

async function loadConfig(filepath) {
  const config = await readJSON(filepath);

  if (!config.version) {
    // Assume version 0 if missing
    config.version = 0;
  }

  // Run all migrations from current to latest
  while (config.version < CONFIG_VERSION) {
    config = migrations[config.version](config);
  }

  return config;
}
```

**Warning signs:**
- New releases cause user config issues
- Users must manually recreate configs
- Issues mentioning "lost settings after update"
- Support requests about "invalid config" after upgrade

**Phase to address:**
Phase 1 (Foundation) - Version field and migration strategy must exist from day one.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| No config versioning | Faster initial development | Migration nightmare when schema changes | Never - version from day one |
| Direct fs.writeFile() | Simpler code | Config corruption on crash | Never - always use atomic writes |
| JSON.parse() without error context | Less code | Useless error messages for users | Never - always improve errors |
| Skip backup mechanism | Faster modifications | Users lose configs on mistakes | Never - backups are essential |
| Assume Unix paths | Works on dev machine | Breaks on Windows | Never - use path.join() |
| No config validation | Accept any input | Invalid configs cause runtime errors | MVP only, add ASAP |
| Hardcode config locations | Simpler code | Won't work on all platforms | Never - use envPaths |
| Skip rollback on error | Less code | Partial writes corrupt state | Never - atomic or rollback |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Claude Code config | Direct manipulation of `.claude/settings.json` | Validate against schema, backup first, atomic writes |
| Git repos | Assume `.gitignore` excludes configs | Check explicitly, warn if tracked, never commit secrets |
| Environment variables | Ignore precedence (env > config) | Clear priority: CLI args > env vars > config > defaults |
| Multiple config files | Merge without conflict handling | Define clear merge strategy, show conflicts to user |
| API validation | Validate on every read | Cache validation result, revalidate on change |
| MCP servers | Trust user-provided config | Validate command exists, sanitize arguments |
| Project detection | Assume one project per directory | Handle nested projects, monorepos, subdirectories |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Synchronous directory scan | Slow startup, blocks UI | Use async/parallel scanning, skip node_modules | 10+ projects, deep nesting |
| No scan caching | Every operation rescans | Cache results, watch for changes | Frequent operations |
| Full JSON validation on read | Slow config loading | Validate once, cache result, revalidate on write | Large configs |
| Render entire list | TUI lag with many projects | Virtual scrolling, render only visible items | 100+ items in list |
| Watch all files | High CPU/memory usage | Watch specific files, debounce changes | Large project count |
| No depth limit in scans | Scans entire filesystem | Max depth 3-4 levels, ignore patterns | Deep directory trees |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Store API tokens in tracked config | Token leaked to Git | Use settings.local.json, add to .gitignore, validate not tracked |
| Trust user MCP commands | Arbitrary code execution | Whitelist allowed commands, sanitize arguments, warn on dangerous patterns |
| No input sanitization | Injection via config values | Validate all inputs against schema, escape in output |
| Expose tokens in error messages | Token in logs/screenshots | Mask tokens in display, show only last 4 chars |
| Validate API tokens by calling API | Token exposed in network logs | Use test endpoint, don't log, cache validity |
| Config files world-readable | Other users read tokens | Set file permissions 600, warn on insecure permissions |
| No rate limiting on API calls | API bans | Cache config, debounce validation, respect rate limits |

## UX Pitfalls

Common user experience mistakes in CLI/TUI tools.

| Pitfall | User Impact | Better Approach |
|---------|-------------|------------------|
| No visual feedback during operations | User thinks tool froze | Show spinner, progress bar, or status message |
| Long error messages | Users don't read them | Keep errors short, show "run --verbose for details" |
| No undo/dry-run | Users afraid to make changes | Always show what will change, offer undo |
| Vim keybindings only | Non-vim users confused | Support both arrow keys and j/k, document both |
| No search/filter | Users scroll through long lists | Add search, filter, and pagination |
| No config preview | Users surprised by changes | Always show diff before applying |
| No keyboard shortcuts help | Users miss features | Show shortcuts in footer, ? key for help |
| Can't escape dialogs | Users feel trapped | Always allow Escape or Ctrl+C to cancel |
| No confirmation for destructive actions | Accidental data loss | Require confirmation, show affected items |
| No offline mode | Tool fails without network | Cache configs, queue operations, sync later |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Atomic writes:** Implemented write-rename pattern? Verify on crash (kill -9, power loss)
- [ ] **Config backups:** Backups created before every modification? Verify backup exists and is valid
- [ ] **Error messages:** Line numbers and context for JSON errors? Test with malformed configs
- [ ] **Cross-platform paths:** Tested on Windows, macOS, Linux? Verify path separators and locations
- [ ] **Schema migration:** Version field exists? Migration tested from v0 to current? Old configs load?
- [ ] **Race conditions:** Concurrent config edits handled? Test with parallel operations
- [ ] **Token security:** Tokens never in tracked files? Verify .gitignore, file permissions
- [ ] **Undo/rollback:** Can user undo any modification? Test rollback after each operation type
- [ ] **Config validation:** Schema validation with helpful errors? Test with all invalid patterns
- [ ] **Terminal compatibility:** Tested in various terminals? Check Windows Terminal, CMD, SSH

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Config corruption | LOW | Restore from .backups/ directory (automatic if backup exists) |
| Lost config (no backup) | HIGH | Manual recreation from memory or Git (if tracked) |
| Schema migration failed | MEDIUM | Keep old config as .bak, show error with manual migration steps |
| Race condition caused data loss | MEDIUM | Restore from backup, implement locking to prevent recurrence |
| Cross-platform path broke | LOW | Auto-detect and fix paths on next load, warn user |
| Invalid JSON syntax | LOW | Show error with line number, open in editor for user to fix |
| Token leaked to Git | HIGH | Rotate token immediately, remove from Git history, force push |
| Windows incompatibility | MEDIUM | Release fix, provide manual migration script |
| Config version mismatch | MEDIUM | Auto-migrate if possible, otherwise show manual steps |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|--------|------------------|--------------|
| Config corruption (atomic writes) | Phase 1 | Crash test: kill -9 during write, verify backup/atomic |
| TOCTOU race conditions | Phase 1 | Parallel write test, concurrent access test |
| No config backup | Phase 1 | Verify .backups/ exists after every modification |
| Poor JSON error messages | Phase 1 | Test with malformed JSON, verify line numbers shown |
| Cross-platform path issues | Phase 1 | Test on Windows + macOS + Linux in CI |
| Schema migration | Phase 1 | Test migration from empty config, v0, v1, etc. |
| Config validation | Phase 1 | Fuzz test with invalid configs |
| Token security | Phase 1 | Audit: no tokens in Git, check .gitignore |
| Performance (scan caching) | Phase 2 | Benchmark with 100+ projects |
| Virtual scrolling | Phase 2 | Test with 1000+ items in list |
| MCP command security | Phase 2 | Whitelist validation, argument sanitization |
| Undo/rollback UI | Phase 2 | Verify undo works for all modification types |
| Config preview UI | Phase 2 | Verify diff shown before every modification |
| Keyboard shortcuts | Phase 2 | Test both arrow keys and j/k navigation |
| Search/filter | Phase 3 | Verify performance with many projects |

## Sources

### File System & JSON

- [File System Race Conditions in Node.js - Medium](https://medium.com/@gabrielgomes_ง/file-system-race-conditions-in-nodejs-846b9b5b5b5b) - Atomic writes, race conditions, write-rename pattern
- [Node.js File System Documentation](https://nodejs.org/api/fs.html) - File flags, atomic operations, fs/promises API
- [Stack Overflow: File Race Conditions](https://stackoverflow.com/questions/36658548/node-js-how-to-prevent-race-condition-when-accessing-files) - Queue pattern, locking libraries, serialization

### Configuration Management

- [JSON Schema for Configuration Management](https://json-schema.org/learn/config-file) - Schema validation, $schema keyword
- [CLI Tool Configuration Best Practices - Dev.to](https://dev.to/dtuits/manage-cli-tool-configuration-best-practices-and-examples-5f8p) - XDG standard, priority ordering, debugging features
- [Reddit: JSON Config Best Practices](https://www.reddit.com/r/programming/comments/k0obv/json_configuration_files_best_practices/) - Comments limitation, schema validation, config priority

### Terminal UI

- [Ink GitHub Issues](https://github.com/vadimdemedes/ink/issues) - Common problems, rendering issues, cross-platform compatibility
- [Ink Documentation](https://github.com/vadimdemedes/ink) - useStdout hook, responsive layout, Box component
- Terminal color support research - ANSI compatibility, Windows support, chalk library

### Config Migration

- Config versioning patterns - etckeeper, chezmoi, Mackup examples
- Schema migration best practices - version field, migration functions, backward compatibility

---

*Pitfalls research for: CLI/TUI Configuration Management Tools*
*Researched: 2026-04-13*