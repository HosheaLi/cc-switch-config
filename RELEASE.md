# Release Checklist

> Refer to [release-pipeline.md](https://github.com/user/repo) for full release workflow.
> Adapt commands below to the current project (cc-config-switch, TypeScript/Node.js).

## Pre-release Checklist

- [ ] `npm test` — all tests pass
- [ ] `npm run test:coverage` — coverage acceptable (core ≥ 80%)
- [ ] `npm run build` — builds cleanly
- [ ] `npm run typecheck` — no type errors
- [ ] Version updated in `package.json`
- [ ] `CHANGELOG.md` updated with new version entry
- [ ] `src/version.ts` reflects correct version (reads from package.json via createRequire — **auto-sync**: no manual change needed)
- [ ] README / USAGE / DEVELOPMENT docs reviewed and up to date
- [ ] Manual smoke test: `npm run build && cc-config --version` returns correct version

## Release Steps

```bash
# 1. Final verification
npm test && npm run build

# 2. Commit
git add -A
git commit -m "release: v<version> — <release description>"

# 3. Tag
git tag v<version>

# 4. Push
git push origin main && git push origin v<version>
```

## Post-release Verification

```bash
# Install from npm
npm install -g cc-config-switch@<version>
cc-config --version

# Verify CLI works
cc-config --help
```

## Version Strategy

Follow [SemVer 2.0](https://semver.org/):

| Segment | When | Example |
|---------|------|---------|
| MAJOR | Breaking API changes | 2.0.0 |
| MINOR | Backward-compatible features | 0.5.0 |
| PATCH | Backward-compatible fixes | 0.4.1 |
