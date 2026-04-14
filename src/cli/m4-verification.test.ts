/**
 * M4 Verification Test - CLI Module No UI Dependencies
 *
 * Per CONSTITUTION.md M4: CLI module must NOT import ink/react.
 * CLI uses chalk for output formatting, ink is only for Phase 06 TUI.
 *
 * This test enforces the architectural boundary:
 * - CLI layer: Uses chalk for colored output, commander for commands
 * - TUI layer (Phase 06): Uses ink/react for interactive UI
 *
 * The separation ensures CLI remains testable and performant
 * without UI rendering overhead.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs-extra';
import path from 'path';

describe('M4 Verification: CLI no UI imports', () => {
  const cliDir = path.join(process.cwd(), 'src', 'cli');

  /**
   * Recursively find all TypeScript files in CLI directory.
   */
  async function findCLIFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...await findCLIFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Check if file contains forbidden imports.
   */
  async function checkForbiddenImports(filePath: string): Promise<string[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const forbidden: string[] = [];

    // Check for ink imports
    if (content.includes("from 'ink'") || content.includes('from "ink"')) {
      forbidden.push('ink');
    }

    // Check for react imports (allowed in Phase 06 TUI only)
    // CLI commands should NOT use react directly
    if (content.includes("from 'react'") || content.includes('from "react"')) {
      // Exception: TUI components (Phase 06) - but CLI commands shouldn't
      if (!filePath.includes('tui-launch.ts')) {
        forbidden.push('react');
      }
    }

    return forbidden;
  }

  it('CLI output utilities do not import ink', async () => {
    const outputDir = path.join(cliDir, 'output');
    const files = await findCLIFiles(outputDir);

    for (const file of files) {
      const forbidden = await checkForbiddenImports(file);
      expect(forbidden).toEqual([]);
    }
  });

  it('CLI commands do not import react', async () => {
    const commandsDir = path.join(cliDir, 'commands');
    const files = await findCLIFiles(commandsDir);

    for (const file of files) {
      const forbidden = await checkForbiddenImports(file);
      expect(forbidden).toEqual([]);
    }
  });

  it('CLI index does not import ink', async () => {
    const indexPath = path.join(cliDir, 'index.ts');
    const forbidden = await checkForbiddenImports(indexPath);
    expect(forbidden).toEqual([]);
  });

  it('All CLI files use chalk for coloring', async () => {
    const files = await findCLIFiles(cliDir);

    // Files that output colored text should import chalk
    const outputFiles = files.filter(f =>
      f.includes('output/') || f.includes('commands/')
    );

    for (const file of outputFiles) {
      const content = await fs.readFile(file, 'utf-8');
      // If file uses chalk (has colored output), verify import
      if (content.includes('chalk.green') || content.includes('chalk.red') || content.includes('chalk.yellow')) {
        expect(content.includes("from 'chalk'") || content.includes('from "chalk"')).toBe(true);
      }
    }
  });
});