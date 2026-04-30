# Requirements: CCAPISwitch v2.0

**Defined:** 2026-04-30
**Core Value:** Terminal-Native 体验 - npm 风格列表选择，简化配置管理，首次引导流程

## v1 Requirements (v2.0 Milestone)

### TUI & Prompts Integration

- [ ] **TUI-01**: User can navigate list with j/k keys and arrow keys
- [ ] **TUI-02**: User can confirm with Enter and cancel with Esc
- [ ] **TUI-03**: User experiences linear wizard flow (no multi-screen navigation)
- [ ] **TUI-04**: User can autocomplete search in large project lists (>20 items)
- [ ] **TUI-05**: User sees onCancel handling for graceful Ctrl+C exit
- [ ] **TUI-06**: Ink React TUI layer completely removed

### Configuration Management

- [ ] **CFG-01**: User can store multiple API configs as 三元组 (name + apiKey + baseUrl + modelName)
- [ ] **CFG-02**: User's permissions/hooks/mcpServers preserved when applying config (precise field replacement)
- [ ] **CFG-03**: User can manage API configs via CLI: `cc-config config add/list/remove`
- [ ] **CFG-04**: User sees API key masked in all display contexts (preview/diff/logs)
- [ ] **CFG-05**: User can switch project config via `cc-config switch [project] [config]`
- [ ] **CFG-06**: TemplateConfig/TemplateService/TemplateStore removed and replaced

### Onboarding & UX

- [ ] **ONB-01**: User experiences first-run wizard (API config → scan directory → scan → main interface)
- [ ] **ONB-02**: System detects firstRunCompleted flag in AppState
- [ ] **ONB-03**: System scans directories with Promise.all parallel traversal
- [ ] **ONB-04**: System skips node_modules/.git/dist/build/target/.venv/__pycache__
- [ ] **ONB-05**: User sees progress indicator during scan operations
- [ ] **ONB-06**: User sees diff preview before config application confirmation

### Design System

- [ ] **UI-01**: User sees OpenCode warm color palette (#201d1d/#fdfcfc/#9a9898)
- [ ] **UI-02**: User sees monospace-only typography throughout
- [ ] **UI-03**: User sees flat depth system (no shadows, border-only elevation)
- [ ] **UI-04**: User sees Apple HIG semantic colors (blue/red/green/orange for accent/danger/success/warning)
- [ ] **UI-05**: System respects NO_COLOR environment variable
- [ ] **UI-06**: System detects Windows CMD vs Terminal for ANSI color compatibility

### Security & Reliability

- [ ] **SEC-01**: User's API key never exposed in CLI args, logs, screenshots
- [ ] **SEC-02**: User sees validation error messages for invalid inputs (prompts validate pattern)
- [ ] **SEC-03**: System maintains atomic write and backup from v1.0 (R1/R2)
- [ ] **SEC-04**: User sees 'password' type input for API key (auto-clear)

## v2 Requirements (Future Milestone)

### Deferred Features

- **FUZZ-01**: Fuzzy search wrapper integration (prompts uses prefix match)
- **STATE-01**: Wizard state persistence for resume-from-interrupt
- **ENV-01**: Project-level multi-config schemes (dev/test/prod environments)
- **SYNC-01**: Config export/import for sharing between machines
- **MCP-01**: MCP server management
- **API-01**: API connectivity validation

## Out of Scope

| Feature | Reason |
|---------|--------|
| Ink React TUI | v1.0 feedback "逻辑混乱样式难看" — replaced by prompts |
| Multi-screen navigation | Linear wizard proven simpler (npm init pattern) |
| Real-time preview | v1.0 caused "样式难看" complaints — diff preview separate |
| Desktop GUI | Prompts terminal-native meets needs |
| Cloud sync | Local-only tool design |
| Multi-user collaboration | Personal tool scope |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TUI-01 | Phase 09 | Pending |
| TUI-02 | Phase 09 | Pending |
| TUI-03 | Phase 09 | Pending |
| TUI-04 | Phase 09 | Pending |
| TUI-05 | Phase 09 | Pending |
| TUI-06 | Phase 15 | Pending |
| CFG-01 | Phase 10 | Pending |
| CFG-02 | Phase 10 | Pending |
| CFG-04 | Phase 10 | Pending |
| CFG-03 | Phase 11 | Complete ✓ |
| CFG-05 | Phase 13 | Pending |
| CFG-06 | Phase 15 | Pending |
| ONB-01 | Phase 12 | Pending |
| ONB-02 | Phase 12 | Pending |
| ONB-03 | Phase 12 | Pending |
| ONB-04 | Phase 12 | Pending |
| ONB-05 | Phase 12 | Pending |
| ONB-06 | Phase 13 | Pending |
| UI-01 | Phase 14 | Pending |
| UI-02 | Phase 14 | Pending |
| UI-03 | Phase 14 | Pending |
| UI-04 | Phase 14 | Pending |
| UI-05 | Phase 14 | Pending |
| UI-06 | Phase 14 | Pending |
| SEC-01 | Phase 10 | Pending |
| SEC-02 | Phase 11 | Complete ✓ |
| SEC-03 | Phase 10 | Pending |
| SEC-04 | Phase 11 | Complete ✓ |

**Coverage:**
- v1 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-30*
*Last updated: 2026-04-30 after roadmap creation*