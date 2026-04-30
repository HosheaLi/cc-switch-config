---
phase: 10
slug: config-service
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-30
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm run test:coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm run test:coverage`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | CFG-01 | — | ApiConfigStore CRUD operations | unit | `vitest run src/lib/store/api-config.test.ts` | ❌ W0 | ⬜ pending |
| 10-01-02 | 01 | 1 | CFG-01 | — | ApiConfigSchema unified/granular validation | unit | `vitest run src/lib/types/api-config.test.ts` | ❌ W0 | ⬜ pending |
| 10-02-01 | 02 | 1 | CFG-02 | — | replaceEnvModel preserves permissions/hooks/mcpServers | unit | `vitest run src/lib/types/replacement.test.ts` | ❌ W0 | ⬜ pending |
| 10-03-01 | 03 | 1 | CFG-04 | T-10-01 | maskApiKey shows last 4 chars only | unit | `vitest run src/lib/security/api-key.test.ts` | ❌ W0 | ⬜ pending |
| 10-03-02 | 03 | 1 | SEC-01 | T-10-01/02 | API key never passed via CLI args | unit | `vitest run src/lib/security/api-key.test.ts` | ❌ W0 | ⬜ pending |
| 10-04-01 | 04 | 2 | SEC-03 | T-10-06 | Atomic write and backup maintained (R1/R2) | unit | `vitest run src/lib/store/api-config.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/store/api-config.test.ts` — ApiConfigStore CRUD tests (covers CFG-01, SEC-03)
- [ ] `src/lib/types/api-config.test.ts` — ApiConfig schema tests, mode validation (covers CFG-01)
- [ ] `src/lib/types/replacement.test.ts` — replaceEnvModel function tests (covers CFG-02)
- [ ] `src/lib/security/api-key.test.ts` — maskApiKey, CLI validation tests (covers CFG-04, SEC-01)
- [ ] `src/lib/services/api-service.test.ts` — ApiService integration tests (covers all)

*Existing infrastructure covers test framework (vitest.config.ts, beforeEach/afterEach patterns). Wave 0 creates new test files for new modules.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| API key not visible in screenshots | CFG-04 | Screenshot capture requires external tool | Run config list/preview, take screenshot, verify masked output |
| Config file permissions 600 | SEC-03 | File permission check in runtime environment | Run `ls -la ~/.claude/api-configs.json`, verify -rw------- |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending