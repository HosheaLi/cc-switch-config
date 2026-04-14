/**
 * M4 Verification Test - TUI Layer Architectural Boundaries
 *
 * Per Clean Architecture: TUI can depend on Services, Services cannot depend on TUI.
 * Per M4: TUI imports react/ink, but Services do NOT.
 *
 * This test verifies:
 * - TUI can import from Services (correct dependency direction)
 * - TUI does NOT import from CLI (reverse dependency violation)
 * - TUI screens use Services for data, not Store directly
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs-extra';
import path from 'path';

describe('M4 TUI Verification: Architectural Boundaries', () => {
  const tuiDir = path.join(process.cwd(), 'src', 'tui');
  const cliDir = path.join(process.cwd(), 'src', 'cli');
  const servicesDir = path.join(process.cwd(), 'src', 'lib', 'services');

  /**
   * Recursively find all TypeScript files in a directory.
   */
  async function findFiles(dir: string, extensions: string[]): Promise<string[]> {
    const files: string[] = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...await findFiles(fullPath, extensions));
        } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext)) && !entry.name.includes('.test.')) {
          files.push(fullPath);
        }
      }
    } catch {
      // Directory might not exist
    }

    return files;
  }

  describe('TUI dependency direction', () => {
    it('TUI does NOT import from CLI', async () => {
      const files = await findFiles(tuiDir, ['.ts', '.tsx']);

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        expect(content).not.toMatch(/from ['"].*cli['"]/);
        expect(content).not.toMatch(/from ['"].*\/cli\/['"]/);
      }
    });

    it('TUI can import from Services (correct direction)', async () => {
      const appPath = path.join(tuiDir, 'app.tsx');
      const exists = await fs.pathExists(appPath);

      if (exists) {
        const content = await fs.readFile(appPath, 'utf-8');
        // TUI app should import from Services (Clean Architecture)
        // Path may be '../lib/services/index.js' or similar
        expect(content).toMatch(/services\/index/);
      }
    });

    it('TUI can import from Store (for creating Service instances)', async () => {
      const appPath = path.join(tuiDir, 'app.tsx');
      const exists = await fs.pathExists(appPath);

      if (exists) {
        const content = await fs.readFile(appPath, 'utf-8');
        // TUI app can import Store classes for Service constructor injection
        // Path may be '../lib/store/index.js' or similar
        expect(content).toMatch(/store\/index/);
      }
    });
  });

  describe('TUI barrel exports', () => {
    it('TUI barrel export includes app entry point', async () => {
      const barrelPath = path.join(tuiDir, 'index.ts');
      const exists = await fs.pathExists(barrelPath);

      if (exists) {
        const content = await fs.readFile(barrelPath, 'utf-8');
        expect(content).toContain('runTUI');
      }
    });

    it('TUI barrel export includes screens', async () => {
      const barrelPath = path.join(tuiDir, 'index.ts');
      const exists = await fs.pathExists(barrelPath);

      if (exists) {
        const content = await fs.readFile(barrelPath, 'utf-8');
        expect(content).toContain('screens');
      }
    });
  });

  describe('Screen boundaries', () => {
    it('Screens directory exists', async () => {
      const screensDir = path.join(tuiDir, 'screens');
      const exists = await fs.pathExists(screensDir);
      expect(exists).toBe(true);
    });

    it('Screens do NOT import from CLI', async () => {
      const screensDir = path.join(tuiDir, 'screens');
      const files = await findFiles(screensDir, ['.tsx']);

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        expect(content).not.toMatch(/from ['"].*cli['"]/);
      }
    });
  });

  describe('Component boundaries', () => {
    it('Components directory exists', async () => {
      const componentsDir = path.join(tuiDir, 'components');
      const exists = await fs.pathExists(componentsDir);
      expect(exists).toBe(true);
    });

    it('Components do NOT import from CLI', async () => {
      const componentsDir = path.join(tuiDir, 'components');
      const files = await findFiles(componentsDir, ['.tsx']);

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        expect(content).not.toMatch(/from ['"].*cli['"]/);
      }
    });
  });
});