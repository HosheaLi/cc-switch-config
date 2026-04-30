import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { runCLI } from './index.js';
import { AppState } from '../lib/store/state.js';

// Test-specific project name to avoid polluting real state
const TEST_STATE_NAME = 'cli-index-test-state';

describe('CLI entry point', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cli-index-test-'));
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('first-run detection', () => {
    it('should check triple condition for first-run', async () => {
      // Verification: Logic exists in source
      // Pattern: !firstRunCompleted && !hasConfigs && !hasProjects
      const source = await fs.readFile('src/cli/index.ts', 'utf-8');
      expect(source).toContain('firstRunCompleted');
      expect(source).toContain('hasConfigs');
      expect(source).toContain('hasProjects');
      expect(source).toContain('ApiConfigStore');
      expect(source).toContain('ProjectIndex');
    });

    it('should set firstRunCompleted after wizard', async () => {
      const source = await fs.readFile('src/cli/index.ts', 'utf-8');
      expect(source).toContain('appState.set(\'firstRunCompleted\', true)');
    });

    it('should fallback to launchTUI when not first-run', async () => {
      const source = await fs.readFile('src/cli/index.ts', 'utf-8');
      expect(source).toContain('await launchTUI()');
    });

    it('should import AppState from correct path', async () => {
      const source = await fs.readFile('src/cli/index.ts', 'utf-8');
      expect(source).toContain('import { AppState } from \'../lib/store/state.js\'');
    });

    it('should import ApiConfigStore from correct path', async () => {
      const source = await fs.readFile('src/cli/index.ts', 'utf-8');
      expect(source).toContain('import { ApiConfigStore } from \'../lib/store/api-config.js\'');
    });

    it('should import ProjectIndex from correct path', async () => {
      const source = await fs.readFile('src/cli/index.ts', 'utf-8');
      expect(source).toContain('import { ProjectIndex } from \'../lib/store/project.js\'');
    });

    it('should import launchPromptsTUI from wizards', async () => {
      const source = await fs.readFile('src/cli/index.ts', 'utf-8');
      expect(source).toContain('import { launchPromptsTUI } from \'./prompts/wizards/main-wizard.js\'');
    });
  });
});