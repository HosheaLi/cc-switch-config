---
type: constitution
milestone: v2.0
created: 2026-05-08
status: active
---

# GSD Constitution - CCAPISwitch v2.0

## Locked Decisions (v1.0 - Preserved)

### Architecture
- **D-01**: Services 作为类 + 构造函数注入
- **D-02**: Services 抛出 Error 错误处理
- **D-03**: 模板应用使用 Deep Merge（精确字段替换）
- **D-04**: 项目检测：自动扫描 + 手动确认
- **D-05**: 扫描目录：用户配置根目录
- **R1**: 原子写入（atomic write）
- **R2**: 备份系统（backup system）
- **M4**: 模块分离（Services 不依赖 UI）

### Testing
- **M1**: 测试覆盖率 80%+
- Vitest bench mode for performance
- Clean env per test (Phase 14)
- Duck typing for errors

### Dependencies
- Ink + React (TUI) - **将被移除** (Phase 15)
- picocolors@1.1.1 (ANSI color)
- prompts (npm 风格列表选择)

## New Decisions (v2.0 - Active)

### TUI Replacement
- **Framework**: prompts (terkelg/prompts)
- **Style**: npm 风格列表选择 (j/k + Enter/Esc)
- **Removed**: Ink, React, Ink components

### Config Structure
- **Structure**: 三元组 ApiConfig (name/apiKey/baseUrl/modelName)
- **Replacement**: 精确字段替换（只修改 env/model，保留其他）
- **Security**: API key password-type input, masked display

### Design System
- **Aesthetic**: OpenCode Terminal (#201d1d/#fdfcfc)
- **Colors**: Apple HIG 语义色 (via picocolors)
- **NO_COLOR**: centralized in theme module

### Security
- **Input**: API key password-type input
- **Display**: masked in preview/diff/logs
- **CLI args**: no API key exposure
- **Logs**: no API key logging

## Quality Gates

### Pre-Phase
- [ ] constitution.md exists
- [ ] UI-SPEC.md exists (if UI phase)
- [ ] CONTEXT.md exists
- [ ] Previous phase complete

### During Phase
- [ ] TDD: RED → FAIL → GREEN → PASS → Verify ≥80%
- [ ] CR: Fix CRITICAL/HIGH → Fix MEDIUM
- [ ] Security: No new vulnerabilities

### Post-Phase
- [ ] Tests pass
- [ ] Coverage ≥80%
- [ ] Code review complete
- [ ] Documentation updated
- [ ] STATE.md updated

## Constraints

### Must NOT Change
- Atomic write (R1)
- Backup system (R2)
- Cross-platform support (R4)
- Services error handling (D-02)

### Must Preserve
- permissions/hooks/mcpServers in settings.json
- v1.0 validated features
- Test coverage ≥80%

### Must Remove (Phase 15)
- Ink dependency
- React dependency
- TemplateConfig/TemplateService
- All Ink components

## Risk Mitigation

### TUI Replacement Risk
- **Fallback**: Keep CLI commands functional
- **Test**: E2E flow validation
- **Rollback**: Git branches per phase

### Config Migration Risk
- **Backup**: settings.json backup before apply
- **Validation**: Schema validation before write
- **Undo**: Restore from backup on failure

## Success Metrics

### v2.0 Success
- [ ] All Phase 10-14 requirements validated
- [ ] Ink completely removed
- [ ] Bundle size reduced
- [ ] Performance maintained or improved
- [ ] Test coverage ≥80%
- [ ] No regressions in v1.0 features