/**
 * CLI Entry Point Tests
 *
 * Per D-08: src/index.ts is the shebang entry for npm bin execution.
 * Tests verify:
 * - Shebang line present
 * - runCLI import from CLI module
 * - Error handling with handleCLIError
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs-extra';

describe('CLI entry point (src/index.ts)', () => {
  const indexPath = 'src/index.ts';

  it('contains shebang "#!/usr/bin/env node"', async () => {
    const content = await fs.readFile(indexPath, 'utf-8');
    expect(content.includes('#!/usr/bin/env node')).toBe(true);
  });

  it('imports runCLI from ./cli/index.js', async () => {
    const content = await fs.readFile(indexPath, 'utf-8');
    expect(content.includes("import { runCLI } from './cli/index.js'")).toBe(true);
  });

  it('imports handleCLIError from ./cli/output/error.js', async () => {
    const content = await fs.readFile(indexPath, 'utf-8');
    expect(content.includes("import { handleCLIError } from './cli/output/error.js'")).toBe(true);
  });

  it('imports CommanderError from commander', async () => {
    const content = await fs.readFile(indexPath, 'utf-8');
    expect(content.includes("import { CommanderError } from 'commander'")).toBe(true);
  });

  it('calls runCLI().catch with CommanderError handling', async () => {
    const content = await fs.readFile(indexPath, 'utf-8');
    // Should have runCLI().catch() with CommanderError handling for version/help display
    expect(content.includes('runCLI().catch')).toBe(true);
    expect(content.includes('CommanderError')).toBe(true);
    expect(content.includes('handleCLIError')).toBe(true);
  });

  it('is NOT a skeleton placeholder', async () => {
    const content = await fs.readFile(indexPath, 'utf-8');
    // Should NOT contain placeholder message
    expect(content.includes('Phase 1 foundation initializing')).toBe(false);
    expect(content.includes('Placeholder for future CLI')).toBe(false);
  });
});