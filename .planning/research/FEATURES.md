# Feature Research

**Domain:** CLI/TUI Configuration Management Tools
**Researched:** 2026-04-13
**Confidence:** MEDIUM (based on web search results, competitor analysis, and common CLI tool patterns)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Profile CRUD Operations** | Core functionality - all config managers have this | MEDIUM | Create, list, switch, delete profiles/configurations |
| **Interactive TUI Selector** | Modern CLI tools use TUI (fzf-style) for selection | MEDIUM | Arrow-key navigation, fuzzy search, visual feedback |
| **Configuration Preview** | Users need to see what will change before applying | LOW | Show generated/modified config content |
| **List All Projects/Profiles** | Basic visibility into managed configurations | LOW | Display current status for each project |
| **Quick Switch Command** | Efficiency - switching should be one command | LOW | `tool switch <name>` or interactive selection |
| **Current Status Display** | Show active configuration at a glance | LOW | `tool current` or `tool status` command |
| **JSON Config Support** | Settings files are JSON format | LOW | Read/write JSON configuration files |
| **Error Messages** | Users need feedback when things go wrong | LOW | Clear, actionable error messages |
| **Help Documentation** | All CLI tools need `--help` | LOW | Command reference and usage examples |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Auto-Switch by Directory** | Hands-free context switching when cd-ing into projects | MEDIUM | Detect project directory, auto-apply correct config |
| **Project Directory Scan** | Discover existing projects automatically vs manual add | MEDIUM | Scan specified paths for Claude Code projects |
| **API Connectivity Validation** | Verify API is reachable before committing config | MEDIUM | Test API endpoint with current credentials |
| **Provider Templates** | Quick setup for common API providers (OpenRouter, etc.) | MEDIUM | Pre-configured templates, user can create custom |
| **MCP Server Management** | Manage MCP servers alongside API/model config | HIGH | List, add, remove, configure MCP servers |
| **Import/Export Configs** | Backup, share, migrate configurations between machines | MEDIUM | Export to file, import from file |
| **Diff Before Apply** | Show what will change before applying new config | MEDIUM | Side-by-side comparison, confirmation prompt |
| **Config Validation** | Syntax check + semantic validation before save | MEDIUM | Catch errors early, provide suggestions |
| **Multi-level Config Hierarchy** | Support user/project/local override layers | HIGH | Match Claude Code's config priority system |
| **Token Security Handling** | Keep tokens out of git, use settings.local.json | MEDIUM | Auto-detect git, prevent token commits |
| **Fuzzy Search** | Quick navigation with fuzzy matching | LOW | Filter projects/configs by partial match |
| **Bulk Operations** | Apply template to multiple projects at once | MEDIUM | Select multiple, batch apply configuration |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Pre-defined Provider Templates (v1)** | Quick start for common providers | Maintenance burden, quickly outdated, scope creep | Support custom templates only; add pre-defined later |
| **Cloud Sync** | Access configs from multiple machines | Introduces cloud dependency, auth complexity, security concerns | Keep local-only; import/export for manual sync |
| **Token Encryption** | Security concern for stored tokens | Claude Code itself uses plaintext; adds complexity without benefit | Store in settings.local.json, rely on file permissions, .gitignore |
| **Desktop GUI (v1)** | Easier for non-technical users | Doubles development effort, different UX paradigm | Start with TUI; consider Tauri desktop in v2 |
| **Real-time Config Watch** | Auto-reload when files change externally | Race conditions, complex state management | Manual refresh or explicit reload command |
| **Version History / Undo** | Recover from mistakes | Complex state management, storage overhead | Users can use git for version control |
| **Config Merge / Conflict Resolution** | Handle conflicting configs | Edge-case complexity, rarely needed | Explicit overwrite; warn before destructive actions |
| **Multi-User Collaboration** | Share configs across team | Requires cloud, auth, permissions - massive scope | Single-user tool; share configs via git or export files |

## Feature Dependencies

```
Project Directory Management
    └──requires──> Config File Read/Write

Auto-Switch by Directory
    ├──requires──> Project Directory Management
    └──requires──> Config Apply Mechanism

MCP Server Management
    └──requires──> Config File Read/Write
    └──requires──> JSON Schema Validation

Provider Templates
    ├──requires──> Config Apply Mechanism
    └──enhances──> Profile CRUD Operations

API Connectivity Validation
    └──requires──> HTTP Client
    └──requires──> Credential Access

Config Validation
    ├──requires──> JSON Schema
    └──enhances──> Config Preview

Diff Before Apply
    └──requires──> Config Preview
    └──requires──> Config Apply Mechanism

Bulk Operations
    └──requires──> Project Directory Management
    └──requires──> Provider Templates

Token Security Handling
    └──conflicts──> Pre-defined Provider Templates (tokens in templates)
```

### Dependency Notes

- **Auto-Switch requires Project Directory Management:** Need to know which projects exist and their locations to detect and switch contexts
- **Provider Templates enhances Profile CRUD:** Templates make profile creation faster but aren't required for basic CRUD
- **Token Security Handling conflicts with Pre-defined Provider Templates:** Pre-defined templates might contain example tokens that users accidentally commit; custom-only approach avoids this

## MVP Definition

### Launch With (v1)

Minimum viable product - what's needed to validate the concept.

- [ ] **Profile CRUD Operations** - Core value: manage multiple configurations
- [ ] **Interactive TUI Selector** - Modern UX expected by users
- [ ] **Configuration Preview** - Show what will change
- [ ] **List All Projects/Profiles** - Visibility into managed state
- [ ] **Quick Switch Command** - Efficiency for common operation
- [ ] **Current Status Display** - Know active configuration
- [ ] **Custom Provider Templates** - Flexibility without maintenance burden
- [ ] **Token Security Handling** - Keep tokens in settings.local.json, warn on potential git commits

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] **Auto-Switch by Directory** - Popular differentiator; add when users request hands-free switching
- [ ] **Project Directory Scan** - Convenience feature; add when manual management becomes tedious
- [ ] **Config Validation** - Error prevention; add when users report config errors
- [ ] **Diff Before Apply** - Confidence feature; add when users request preview improvements
- [ ] **Import/Export Configs** - Portability; add when users need to migrate or backup

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **MCP Server Management** - Complex feature; defer until core is stable
- [ ] **API Connectivity Validation** - Quality-of-life; requires HTTP implementation
- [ ] **Pre-defined Provider Templates** - Maintenance overhead; add when user demand is clear
- [ ] **Bulk Operations** - Power user feature; add when single-project workflow is validated
- [ ] **Desktop GUI (Tauri)** - Platform expansion; only if TUI shows traction
- [ ] **Multi-level Config Hierarchy** - Advanced feature; add when users need granular control

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Profile CRUD Operations | HIGH | MEDIUM | P1 |
| Interactive TUI Selector | HIGH | MEDIUM | P1 |
| Configuration Preview | HIGH | LOW | P1 |
| List All Projects/Profiles | HIGH | LOW | P1 |
| Quick Switch Command | HIGH | LOW | P1 |
| Current Status Display | HIGH | LOW | P1 |
| Custom Provider Templates | MEDIUM | MEDIUM | P1 |
| Token Security Handling | HIGH | MEDIUM | P1 |
| Auto-Switch by Directory | MEDIUM | MEDIUM | P2 |
| Project Directory Scan | MEDIUM | MEDIUM | P2 |
| Config Validation | MEDIUM | MEDIUM | P2 |
| Diff Before Apply | MEDIUM | MEDIUM | P2 |
| Import/Export Configs | MEDIUM | MEDIUM | P2 |
| MCP Server Management | MEDIUM | HIGH | P3 |
| API Connectivity Validation | MEDIUM | MEDIUM | P3 |
| Pre-defined Provider Templates | LOW | MEDIUM | P3 |
| Bulk Operations | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | cc-switch | nvm-style tools | direnv | Our Approach |
|---------|-----------|-----------------|--------|--------------|
| Profile Management | Full CRUD | Version CRUD | N/A (env-based) | Full CRUD for configs |
| Auto-Switch | Yes (directory-based) | Yes (.nvmrc) | Yes (.envrc) | Yes (directory detection) |
| Interactive TUI | Desktop GUI | CLI args / shell | Shell hooks | TUI selector (ink/React) |
| Import/Export | Yes | No | No | Yes |
| Templates | Pre-defined providers | N/A | N/A | Custom templates first |
| Validation | Basic | No | No | Config + API validation |
| Token Security | Unknown | N/A | File-based | settings.local.json |

### Key Differentiation Opportunities

1. **TUI-first approach** - cc-switch has desktop GUI, we have TUI (faster, more scriptable)
2. **Custom templates** - Others hardcode providers; we let users define their own
3. **Validation** - Most tools don't validate; we can validate config + API reachability
4. **Project-centric view** - Focus on managing multi-project configurations, not just profiles

## Sources

- [cc-switch GitHub Repository](https://github.com/farion1231/cc-switch) - Reference implementation for Claude Code config management
- [nvm (Node Version Manager)](https://github.com/nvm-sh/nvm) - CLI profile/switching patterns
- [direnv](https://direnv.net/) - Auto-switch directory-based configuration
- [AWS CLI Profile Manager](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html) - Profile management patterns
- [TUI Design Patterns](https://github.com/charmbracelet/bubbletea) - Terminal UI patterns
- [Claude Code Settings Documentation](https://docs.anthropic.com/en/docs/claude-code/settings-json) - Configuration format reference
- Project Context: /Users/lihaoxuan/code/P07_CCAPISwitch/.planning/PROJECT.md

---
*Feature research for: CLI/TUI Configuration Management Tools*
*Researched: 2026-04-13*