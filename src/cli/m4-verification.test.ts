/**
 * M4 Verification Test - CLI Module No UI Dependencies
 *
 * Per CONSTITUTION.md M4: CLI module must NOT import ink/react.
 * Per Clean Architecture: Services must NOT depend on TUI.
 * CLI uses chalk for output formatting, ink is only for Phase 06 TUI.
 *
 * This test enforces the architectural boundary:
 * - CLI layer: Uses chalk for colored output, commander for commands
 * - TUI layer (Phase 06): Uses ink/react for interactive UI
 * - Services layer: Must NOT import ink/react or from TUI
 *
 * The separation ensures CLI remains testable and performant
 * without UI rendering overhead.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs-extra';
import path from 'path';

describe('M4 Verification: Architectural Boundaries', () => {
  const cliDir = path.join(process.cwd(), 'src', 'cli');
  const servicesDir = path.join(process.cwd(), 'src', 'lib', 'services');
  const tuiDir = path.join(process.cwd(), 'src', 'tui');

  /**
   * Recursively find all TypeScript files in a directory.
   */
  async function findFiles(dir: string, extension: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...await findFiles(fullPath, extension));
      } else if (entry.isFile() && entry.name.endsWith(extension) && !entry.name.endsWith('.test.ts')) {
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

    // Check for react imports (allowed in TUI only)
    if (content.includes("from 'react'") || content.includes('from "react"')) {
      forbidden.push('react');
    }

    // Check for TUI imports in Services or CLI (except tui-launch.ts)
    if (!filePath.includes('tui-launch.ts')) {
      if (content.match(/from ['"].*tui['"]/) || content.match(/from ['"].*\/tui\/['"]/)) {
        forbidden.push('tui');
      }
    }

    return forbidden;
  }

  describe('CLI layer', () => {
    it('CLI output utilities do not import ink', async () => {
      const outputDir = path.join(cliDir, 'output');
      const files = await findFiles(outputDir, '.ts');

      for (const file of files) {
        const forbidden = await checkForbiddenImports(file);
        expect(forbidden).toEqual([]);
      }
    });

    it('CLI commands do not import ink or react', async () => {
      const commandsDir = path.join(cliDir, 'commands');
      const files = await findFiles(commandsDir, '.ts');

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
      const files = await findFiles(cliDir, '.ts');

      // Files that output colored text should import chalk
      const outputFiles = files.filter(f =>
        f.includes('output/') || f.includes('commands/') || f.includes('utils/')
      );

      for (const file of outputFiles) {
        const content = await fs.readFile(file, 'utf-8');
        // If file uses chalk (has colored output), verify import
        if (content.includes('chalk.green') || content.includes('chalk.red') || content.includes('chalk.yellow')) {
          expect(content.includes("from 'chalk'") || content.includes('from "chalk"')).toBe(true);
        }
      }
    });

    it('CLI imports TUI only via tui-launch.ts', async () => {
      const files = await findFiles(cliDir, '.ts');

      for (const file of files) {
        if (file.includes('tui-launch.ts')) {
          // tui-launch.ts is allowed to import from TUI
          const content = await fs.readFile(file, 'utf-8');
          expect(content.includes("from '../../tui")).toBe(true);
        } else {
          // Other CLI files should NOT import TUI screens/components directly
          const forbidden = await checkForbiddenImports(file);
          expect(forbidden).toEqual([]);
        }
      }
    });
  });

  describe('Services layer (Clean Architecture)', () => {
    it('Services do NOT import ink', async () => {
      const files = await findFiles(servicesDir, '.ts');

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        expect(content).not.toMatch(/from ['"]ink['"]/);
      }
    });

    it('Services do NOT import react', async () => {
      const files = await findFiles(servicesDir, '.ts');

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        expect(content).not.toMatch(/from ['"]react['"]/);
      }
    });

    it('Services do NOT import from TUI', async () => {
      const files = await findFiles(servicesDir, '.ts');

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        expect(content).not.toMatch(/from ['"].*tui['"]/);
      }
    });

    it('Services barrel export does NOT include TUI', async () => {
      const barrelPath = path.join(servicesDir, 'index.ts');
      const content = await fs.readFile(barrelPath, 'utf-8');
      expect(content).not.toContain('ink');
      expect(content).not.toContain('react');
      expect(content).not.toContain('tui');
    });
  });
});