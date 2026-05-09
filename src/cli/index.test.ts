import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { runCLI } from './index.js';

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
      const source = await fs.readFile('src/cli/index.ts', 'utf-8');
      expect(source).toContain('firstRunCompleted');
      expect(source).toContain('hasConfigs');
      expect(source).toContain('hasProjects');
      expect(source).toContain('createServices');
    });

    it('should set firstRunCompleted after wizard', async () => {
      const source = await fs.readFile('src/cli/index.ts', 'utf-8');
      expect(source).toContain('appState.set(\'firstRunCompleted\', true)');
    });

    it('should fallback to launchTUI when not first-run', async () => {
      const source = await fs.readFile('src/cli/index.ts', 'utf-8');
      expect(source).toContain('await launchTUI()');
    });

    it('should import createServices from service-factory', async () => {
      const source = await fs.readFile('src/cli/index.ts', 'utf-8');
      expect(source).toContain('import { createServices } from \'./utils/service-factory.js\'');
    });

    it('should import runOnboardingWizard from onboarding wizard', async () => {
      const source = await fs.readFile('src/cli/index.ts', 'utf-8');
      expect(source).toContain('import { runOnboardingWizard } from \'./prompts/wizards/onboarding-wizard.js\'');
    });
  });
});
