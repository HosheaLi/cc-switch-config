# Pitfalls Research

**Domain:** CLI/TUI Configuration Management - Ink to Prompts Migration
**Researched:** 2026-04-30
**Confidence:** HIGH (Context7 verified for prompts library, LOW for Ink migration patterns - limited sources)

## Executive Summary

This research focuses on pitfalls specific to replacing Ink (React-based TUI) with prompts library for the v2.0 milestone. Key risk areas include: cancellation handling, config field preservation during replacement, terminal color compatibility, wizard flow state management, and API key security. The prompts library has well-documented pitfalls (verified via Context7), but Ink-to-prompts migration patterns lack authoritative sources (LOW confidence).

## Critical Pitfalls

### Pitfall 1: Prompts Cancellation Not Properly Handled

**What goes wrong:**
User presses Ctrl+C during wizard flow, prompts returns `undefined` for all fields, and code proceeds without checking, leading to undefined values being written to config or processed further.

**Why it happens:**
The prompts library returns `undefined` for all answers when user cancels, but developers often forget to handle this case explicitly. The onCancel callback is optional, making it easy to skip.

**How to avoid:**
```typescript
// NEVER do this
const result = await prompts(questions);
console.log(result.value); // Could be undefined!

// ALWAYS handle cancellation explicitly
const result = await prompts(questions, {
  onCancel: () => {
    console.log('Operation cancelled by user');
    process.exit(0); // Or return to previous screen
  }
});

// ALWAYS check for undefined before using results
if (result.apiKey === undefined) {
  // User cancelled - handle gracefully
  return;
}
```

**Warning signs:**
- Users report "undefined" values in configs after canceling
- Tool crashes with "Cannot read property of undefined"
- Config files contain invalid data after aborted operations
- Tests don't cover cancellation scenarios

**Phase to address:**
Phase TUI-01 (Prompts Integration) - Must implement onCancel handling from day one.

**Sources:**
- [prompts GitHub README](https://github.com/terkelg/prompts) (HIGH confidence - official docs)
- [prompts GitHub Issues](https://github.com/terkelg/prompts/issues) (HIGH confidence - community patterns)

---

### Pitfall 2: Config Field Replacement Losing Important Fields

**What goes wrong:**
Replacing config (env/model fields) accidentally removes important existing fields like permissions, hooks, mcpServers, or other custom settings. Users lose critical configuration after switching API providers.

**Why it happens:**
Developers use simple object assignment or shallow merge instead of precise field replacement. The merge.ts shows arrays use replacement strategy (per D-04), but this can cause unintended data loss when replacing entire objects.

**How to avoid:**
```typescript
// WRONG: Entire object replacement
const newConfig = {
  env: newEnv,  // Lost permissions, hooks, mcpServers!
  model: newModel
};

// RIGHT: Precise field replacement preserving other fields
const existingConfig = await readConfig(projectPath) ?? {};
const newConfig = {
  ...existingConfig,  // Preserve all existing fields
  env: {
    ...existingConfig.env,  // Preserve existing env vars
    ANTHROPIC_MODEL: newModel,  // Update specific field
    ANTHROPIC_AUTH_TOKEN: newApiKey,  // Update specific field
    ANTHROPIC_BASE_URL: newBaseUrl  // Update specific field
  }
};

// BETTER: Use deep merge with explicit strategy
import { deepMergeConfig } from './merge.js';

const templateSettings = {
  env: {
    ANTHROPIC_MODEL: template.modelName,
    ANTHROPIC_AUTH_TOKEN: template.apiKey,
    ANTHROPIC_BASE_URL: template.baseUrl
  }
};

// Deep merge preserves existing env vars, permissions, hooks, mcpServers
const mergedConfig = deepMergeConfig(existingConfig, templateSettings);
```

**Warning signs:**
- Users report lost MCP server configs after API switch
- Permissions disappear after changing providers
- Hooks not executing after config modification
- Unexpected behavior after "simple" API switch

**Phase to address:**
Phase CFG-02 (Config Field Replacement) - Must implement precise field replacement with merge logic.

**Sources:**
- Current merge.ts implementation (HIGH confidence - project code)
- Claude Settings schema in config.ts (HIGH confidence - project code)

---

### Pitfall 3: No Validation in Wizard Flow

**What goes wrong:**
Wizard accepts invalid inputs (empty API keys, malformed URLs, invalid model names) without validation. Config gets written with invalid values, causing runtime errors when Claude Code tries to use them.

**Why it happens:**
Prompts validation is optional and easy to skip. Developers focus on flow completion, not input quality. The prompts library's validation format is different from typical patterns (returns `true` OR error message string, not boolean).

**How to avoid:**
```typescript
// WRONG: No validation
{
  type: 'text',
  name: 'apiKey',
  message: 'Enter API key'
}

// RIGHT: Proper validation with helpful messages
{
  type: 'text',
  name: 'apiKey',
  message: 'Enter API key',
  validate: value => {
    if (!value || value.trim().length === 0) {
      return 'API key is required';
    }
    if (value.length < 20) {
      return 'API key appears too short (expected 20+ chars)';
    }
    if (!value.startsWith('sk-ant-')) {
      return 'API key should start with "sk-ant-"';
    }
    return true; // Valid
  }
}

// RIGHT: URL validation
{
  type: 'text',
  name: 'baseUrl',
  message: 'API base URL',
  initial: 'https://api.anthropic.com',
  validate: value => {
    try {
      new URL(value);
      return true;
    } catch {
      return 'Invalid URL format (expected https://...)';
    }
  }
}

// RIGHT: Model name validation with suggestions
{
  type: 'autocomplete',
  name: 'model',
  message: 'Select model',
  choices: [
    { title: 'Claude Opus 4', value: 'claude-opus-4-20250514' },
    { title: 'Claude Sonnet 4', value: 'claude-sonnet-4-20250514' },
    { title: 'Claude Haiku 3.5', value: 'claude-3-5-haiku-20241022' }
  ]
}
```

**Warning signs:**
- Users enter empty values and tool accepts them
- Runtime errors with "invalid API key" or "malformed URL"
- Support requests about "why doesn't my API work?"
- Config validation errors after wizard completion

**Phase to address:**
Phase ONB-01 (First-Run Wizard) - Must implement validation for all wizard fields.

**Sources:**
- [prompts GitHub README - Validation](https://github.com/terkelg/prompts) (HIGH confidence)

---

### Pitfall 4: Terminal Color Compatibility Across Platforms

**What goes wrong:**
Color codes work on macOS/Linux but fail or look wrong on Windows. Some terminals don't support certain ANSI codes, or show garbled output. NO_COLOR environment variable not respected.

**Why it happens:**
ANSI escape codes have different support levels across terminals. Windows CMD has limited support (though Windows Terminal is better). Different terminals interpret codes differently. The NO_COLOR standard (https://no-color.org) should be respected.

**How to avoid:**
```typescript
// WRONG: Hardcoded ANSI codes
console.log('\x1b[36mProjects\x1b[0m'); // May fail on Windows CMD

// WRONG: Assuming color support
const colors = {
  cyan: '\x1b[36m',
  green: '\x1b[32m'
};

// RIGHT: Use color library with detection
import chalk from 'chalk';

// Check color support level
if (chalk.supportsColor.level === 0) {
  // No color support - use plain text
  console.log('Projects');
} else {
  console.log(chalk.cyan('Projects'));
}

// RIGHT: Respect NO_COLOR environment variable
if (process.env.NO_COLOR) {
  // Disable all colors
  console.log('Projects'); // Plain text
} else {
  console.log(chalk.cyan('Projects'));
}

// RIGHT: Use prompts built-in styling (respects NO_COLOR)
// prompts automatically handles color detection and NO_COLOR
```

**Warning signs:**
- Windows users report garbled output (like `[36mProjects[0m`)
- Colors don't appear in certain terminals
- Screenshots show broken color codes
- Users complain about "unreadable" output

**Phase to address:**
Phase UI-01 (Terminal Aesthetic) - Must implement color detection and NO_COLOR respect.

**Sources:**
- [chalk documentation](https://github.com/chalk/chalk#readme) (MEDIUM confidence - well-known library)
- [NO_COLOR specification](https://no-color.org) (HIGH confidence - standard)
- Windows Terminal vs CMD differences (LOW confidence - WebSearch)

---

### Pitfall 5: API Key Display/Logging Security Issues

**What goes wrong:**
API keys exposed in terminal output, logs, error messages, or config previews. Users accidentally share screenshots with visible keys. Keys logged to files or sent to telemetry.

**Why it happens:**
Developers focus on functionality, not security. Showing full config for debugging is convenient. Error messages include full config for context. Logs capture all data for troubleshooting.

**How to avoid:**
```typescript
// WRONG: Display full API key
console.log(`Config: ${JSON.stringify(config)}`);
console.log(`API Key: ${config.env.ANTHROPIC_AUTH_TOKEN}`);

// RIGHT: Mask sensitive values in display
function maskApiKey(key: string): string {
  if (!key || key.length < 8) return '[hidden]';
  return `${key.slice(0, 7)}...${key.slice(-4)}`;
}

console.log(`API Key: ${maskApiKey(config.env.ANTHROPIC_AUTH_TOKEN)}`);
// Output: sk-ant-...1234

// RIGHT: Sanitize config before logging/display
function sanitizeForDisplay(config: ClaudeSettings): ClaudeSettings {
  return {
    ...config,
    env: {
      ...config.env,
      ANTHROPIC_AUTH_TOKEN: maskApiKey(config.env.ANTHROPIC_AUTH_TOKEN ?? '')
    }
  };
}

// RIGHT: Never log full config
if (process.env.DEBUG) {
  console.log('Config:', sanitizeForDisplay(config));
}

// RIGHT: Clear terminal after password input (prompts password type does this)
{
  type: 'password',
  name: 'apiKey',
  message: 'Enter API key'
}

// WRONG: Store in process.env visible to other processes
process.env.TEMP_API_KEY = apiKey; // Visible in process list!

// RIGHT: Use only in memory, write directly to config
```

**Warning signs:**
- Users share screenshots with visible API keys
- Logs contain full API keys
- Error messages show full config with keys
- Config preview shows unmasked keys
- CI logs expose keys

**Phase to address:**
Phase CFG-01 (Triple Config) and ONB-01 (Wizard) - Must mask keys in all display contexts.

**Sources:**
- API key security best practices (HIGH confidence - WebSearch verified)
- OWASP sensitive data exposure guidelines (HIGH confidence)

---

### Pitfall 6: Wizard Flow State Management Without Persistence

**What goes wrong:**
User progresses through wizard steps, then cancels or encounters error. Partial state lost. Restarting wizard requires re-entering all information. No way to resume or save progress.

**Why it happens:**
Wizard flow treated as single atomic operation. State not persisted between steps. Developers assume users will complete in one session. No checkpoint mechanism.

**How to avoid:**
```typescript
// WRONG: All state in memory, lost on cancel
const answers = await prompts([
  { type: 'text', name: 'name', message: 'Config name?' },
  { type: 'text', name: 'apiKey', message: 'API key?' },
  { type: 'text', name: 'baseUrl', message: 'Base URL?' }
]);

// RIGHT: Save progress at each step
async function wizardWithPersistence() {
  const statePath = path.join(os.homedir(), '.cc-config', '.wizard-state.json');
  
  // Load existing state (resume capability)
  let state = await loadWizardState(statePath) ?? {};
  
  // Step 1: Name
  if (!state.name) {
    const result = await prompts({
      type: 'text',
      name: 'name',
      message: 'Config name?',
      initial: state.name
    }, { onCancel: () => saveWizardState(statePath, state) });
    
    if (result.name === undefined) return; // Cancelled
    state.name = result.name;
    await saveWizardState(statePath, state); // Save checkpoint
  }
  
  // Step 2: API Key
  if (!state.apiKey) {
    const result = await prompts({
      type: 'password',
      name: 'apiKey',
      message: 'API key?'
    }, { onCancel: () => saveWizardState(statePath, state) });
    
    if (result.apiKey === undefined) return;
    state.apiKey = result.apiKey;
    await saveWizardState(statePath, state);
  }
  
  // ... continue for each step
  
  // Clear state on successful completion
  await clearWizardState(statePath);
  return state;
}
```

**Warning signs:**
- Users frustrated by re-entering data after mistakes
- "Why do I have to start over?"
- Support requests about saving partial progress
- Wizard feels tedious for complex configurations

**Phase to address:**
Phase ONB-01 (First-Run Wizard) - Consider state persistence for complex flows.

**Sources:**
- Wizard UX patterns (LOW confidence - WebSearch only)
- npm init patterns (MEDIUM confidence - observation)

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems in prompts-based CLI tools.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip onCancel handling | Simpler code | Undefined values crash app | Never - always handle cancel |
| No input validation | Faster wizard flow | Invalid configs, runtime errors | Never - validate all fields |
| Hardcoded colors | Quick styling | Windows compatibility issues | Never - use color library |
| Display full API keys | Easier debugging | Security exposure | Never - always mask |
| Simple object replacement | Faster config update | Lost important fields | Never - use precise merge |
| No wizard state persistence | Simpler implementation | User frustration on cancel | MVP acceptable, add ASAP |
| Single large prompt array | Simpler flow | Can't resume mid-wizard | For simple wizards only |
| Skip NO_COLOR check | Faster output | Accessibility violation | Never - respect NO_COLOR |

## Integration Gotchas

Common mistakes when integrating prompts with existing config management system.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Prompts + ConfigService | Pass undefined values to writeConfig | Check all values before calling service |
| Prompts + Zod validation | Skip validation in wizard | Validate in prompts AND use Zod |
| Prompts + deep merge | Replace entire objects | Use precise field replacement with deep merge |
| Prompts + AppState | No state persistence for wizard | Save wizard progress to AppState |
| Prompts + UndoService | No undo for wizard operations | Support undo after wizard completion |
| Prompts + Preview | Show config before confirmation | Always preview with masked sensitive fields |
| Prompts + CLI args | Ignore CLI args when wizard runs | Support --name, --api-key args to skip prompts |
| Prompts + CI/CD | Require interactive input | Detect TTY, provide non-interactive fallback |

## Performance Traps

Patterns that work at small scale but fail with prompts-based interfaces.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Large select lists (>50 items) | Slow rendering, hard navigation | Use autocomplete with search, pagination | 50+ choices |
| No type-ahead debounce | Fast typing causes lag | Debounce autocomplete suggestions | Autocomplete fields |
| Synchronous validation blocks | UI freezes during check | Async validation, show loading state | Complex validation (API calls) |
| No input timeout | User stuck in infinite prompt | Timeout with default or cancel option | Unattended scripts |
| Rendering entire history | Memory issues with long sessions | Clear screen between major steps | Long wizard sessions |

## Security Mistakes

Domain-specific security issues for prompts-based config management.

| Mistake | Risk | Prevention |
|---------|------|------------|
| API key in prompt history | Key visible in scrollback | Use `type: 'password'` for sensitive fields |
| API key in error logs | Key in debug output | Mask before logging, sanitize errors |
| API key in screenshots | Key visible in screen captures | Mask in all terminal display |
| API key in process args | Visible in process list | Never pass as CLI arg, use prompt or file |
| API key in config preview | Key visible before confirmation | Mask in preview panel |
| API key in undo diff | Key visible in diff display | Mask sensitive fields in diff output |
| No .gitignore validation | Config tracked in Git | Check git tracking before writing |
| Permissive file permissions (777) | Other users read keys | Set 600 permissions for settings.local.json |

## UX Pitfalls

Common user experience mistakes in prompts-based wizard flows.

| Pitfall | User Impact | Better Approach |
|---------|-------------|------------------|
| No sensible defaults | Users type same values repeatedly | Provide `initial` values for common cases |
| Poor error messages | Users don't understand what's wrong | Specific validation messages with examples |
| No confirmation step | Users can't review before commit | Always show preview before final write |
| No escape path | Users feel trapped in wizard | Allow Ctrl+C, show "press Esc to cancel" |
| Long single wizard | Users lose patience | Break into logical steps with checkpoints |
| No keyboard shortcuts help | Users don't know j/k navigation | Show "j/k or arrows to navigate" in footer |
| No back navigation | Users can't fix earlier mistakes | Allow returning to previous steps |
| No progress indicator | Users don't know how many steps left | Show "Step X of Y" in header |
| Hidden password input | Users unsure if typing works | Show asterisks or dots for password fields |
| No cancel confirmation | Accidental cancel loses all progress | Ask "Cancel and discard progress?" |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces in prompts-based migration.

- [ ] **Cancellation handling:** Implemented onCancel for ALL prompt calls? Test by pressing Ctrl+C at each step
- [ ] **undefined checks:** All result values checked before use? Test with cancelled prompts
- [ ] **Field preservation:** Config replacement tested with existing permissions/hooks? Verify fields remain
- [ ] **API key masking:** Keys masked in ALL display contexts? Test preview, error, log, diff
- [ ] **Validation:** All wizard inputs validated? Test empty, invalid, malformed inputs
- [ ] **Color compatibility:** Tested on Windows CMD, Windows Terminal, macOS, Linux? Verify NO_COLOR respect
- [ ] **TTY detection:** Works in non-interactive environments? Test in CI/CD pipeline
- [ ] **Undo support:** Undo works for wizard-created configs? Test undo after wizard completion
- [ ] **CLI args:** Can skip wizard with --name, --api-key args? Test non-interactive mode
- [ ] **Error recovery:** Wizard handles errors gracefully? Test with invalid inputs, write failures
- [ ] **State persistence:** Can resume interrupted wizard? Test cancel and restart

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Undefined values written | MEDIUM | Config validation catches, show error, re-run wizard |
| Lost config fields | HIGH | Restore from backup (UndoService), re-apply with correct merge |
| Invalid API key | LOW | Re-run wizard or edit config manually |
| Color codes garbled | LOW | Set NO_COLOR=1, update color library |
| Key exposed in logs | HIGH | Rotate key immediately, sanitize logs, audit access |
| Wizard cancelled mid-flow | MEDIUM | Resume from saved state or restart |
| Wrong config applied | LOW | Use undo command, select correct config |
| Config corrupted | MEDIUM | Restore from backup directory |
| Windows path issues | LOW | Auto-fix on next load, use path.join() |

## Pitfall-to-Phase Mapping

How v2.0 roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Prompts cancellation | TUI-01 | Test Ctrl+C at each wizard step, verify graceful exit |
| Config field preservation | CFG-02 | Test with existing permissions/hooks, verify merge preserves |
| Wizard validation | ONB-01 | Test empty/invalid/malformed inputs, verify helpful messages |
| Terminal color compatibility | UI-01 | Test on Windows/macOS/Linux, verify NO_COLOR support |
| API key display security | CFG-01 + ONB-01 | Audit all display contexts, verify masking |
| Wizard state persistence | ONB-01 (optional) | Test cancel and resume, verify state saved |
| TTY detection | CLI-01 | Test in CI/CD, verify non-interactive fallback |
| Undo for wizard | CFG-02 | Test undo after wizard completion |
| Config preview | ONB-01 | Verify preview shown before final confirmation |
| CLI args support | CLI-01 | Test --name --api-key args, verify wizard skipped |

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Prompts library pitfalls | HIGH | Context7 verified, official GitHub README |
| Config merge patterns | HIGH | Project code analyzed, merge.ts well-documented |
| API key security | HIGH | WebSearch verified, OWASP standards |
| Wizard validation | HIGH | Prompts documentation verified |
| Ink-to-prompts migration | LOW | Limited sources found, WebSearch incomplete |
| Terminal color compatibility | MEDIUM | chalk documentation, NO_COLOR standard, but Windows specifics unclear |
| Wizard state patterns | LOW | WebSearch only, no authoritative sources |

## Open Questions

Areas needing phase-specific research or deeper investigation:

1. **Ink-to-prompts migration patterns** - What specific React TUI patterns translate poorly to prompts? Need to find migration guides or post-mortems from similar projects.
2. **Windows Terminal vs CMD** - Exact differences in ANSI support? Need platform-specific testing guidance.
3. **Prompts performance limits** - How many items before select/multiselect becomes unusable? Need benchmarks.
4. **Wizard UX research** - What makes wizards feel tedious vs. smooth? Need UX research for CLI wizards.
5. **State persistence patterns** - Best practices for saving wizard progress? Need patterns from tools like npm init, create-app.

## Sources

### High Confidence Sources

- [prompts GitHub README](https://github.com/terkelg/prompts) - Official documentation, verified via Context7
- [prompts GitHub Issues](https://github.com/terkelg/prompts/issues) - Common problems and solutions
- [NO_COLOR specification](https://no-color.org) - Standard for disabling terminal colors
- OWASP API Key Security Guidelines - Sensitive data exposure prevention
- Project source files: merge.ts, config.ts, config-service.ts - Verified implementation

### Medium Confidence Sources

- [chalk documentation](https://github.com/chalk/chalk) - Terminal color library with detection
- [LogRocket: Node.js CLI Best Practices](https://blog.logrocket.com/node-js-cli-best-practices/) - CLI development patterns
- npm init patterns - Observation of existing tools

### Low Confidence Sources

- WebSearch for "Ink React TUI migration to prompts" - Search incomplete, no authoritative sources found
- Windows Terminal compatibility - Limited documentation found
- Wizard UX patterns - WebSearch only, need more research

---
*Pitfalls research for: Ink to Prompts Migration (v2.0 Milestone)*
*Researched: 2026-04-30*