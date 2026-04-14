/**
 * Auto-Switch Utility Tests
 *
 * Tests auto-switch detection logic for shell hook integration.
 * Per D-01: Shell hook like direnv.
 * Per D-02: Silent unless actual switch.
 * Per D-03: Prompt for unregistered .claude directories.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';

// Mock fs-extra
vi.mock('fs-extra', () => ({
  default: {
    pathExists: vi.fn(),
  },
}));

// Mock project store
vi.mock('../../lib/store/project.js', () => ({
  ProjectIndex: vi.fn(),
}));

// Mock state store
vi.mock('../../lib/store/state.js', () => ({
  AppState: vi.fn(),
}));

// Import AFTER mocks
import fs from 'fs-extra';
import { detectAutoSwitch, applyAutoSwitch, formatSwitchMessage, AutoSwitchResult } from './auto-switch.js';

describe('auto-switch utility', () => {
  let mockProjectIndex: any;
  let mockAppState: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock project index
    mockProjectIndex = {
      getByPath: vi.fn(),
    };

    // Create mock app state
    mockAppState = {
      getActiveProject: vi.fn().mockReturnValue(null),
      setActiveProject: vi.fn(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('detectAutoSwitch', () => {
    it('returns switched=true when project differs from active (D-02)', async () => {
      // Setup: registered project, different from active
      mockProjectIndex.getByPath.mockResolvedValue({
        id: 'proj-123',
        path: '/test/my-project',
        activeConfig: 'anthropic-template',
        lastModified: '2026-04-14T00:00:00Z',
      });
      mockAppState.getActiveProject.mockReturnValue('proj-456'); // Different active

      const result = await detectAutoSwitch('/test/my-project', mockProjectIndex, mockAppState);

      expect(result.switched).toBe(true);
      expect(result.projectId).toBe('proj-123');
      expect(result.projectName).toBe('my-project');
      expect(result.templateName).toBe('anthropic-template');
      expect(result.unregisteredDir).toBe(false);
    });

    it('returns switched=false when same project active (D-02)', async () => {
      // Setup: registered project, same as active
      mockProjectIndex.getByPath.mockResolvedValue({
        id: 'proj-123',
        path: '/test/my-project',
        activeConfig: 'anthropic-template',
        lastModified: '2026-04-14T00:00:00Z',
      });
      mockAppState.getActiveProject.mockReturnValue('proj-123'); // Same active

      const result = await detectAutoSwitch('/test/my-project', mockProjectIndex, mockAppState);

      expect(result.switched).toBe(false); // D-02: no message on no-change
      expect(result.projectId).toBe('proj-123');
      expect(result.projectName).toBe('my-project');
    });

    it('returns unregisteredDir=true when .claude found but not registered (D-03)', async () => {
      // Setup: no registered project, .claude directory exists
      mockProjectIndex.getByPath.mockResolvedValue(null);
      vi.mocked(fs.pathExists).mockResolvedValue(true);

      const result = await detectAutoSwitch('/test/unregistered', mockProjectIndex, mockAppState);

      expect(result.switched).toBe(false);
      expect(result.projectId).toBe(null);
      expect(result.unregisteredDir).toBe(true); // D-03
    });

    it('returns all null when no project and no .claude', async () => {
      // Setup: no registered project, no .claude directory
      mockProjectIndex.getByPath.mockResolvedValue(null);
      vi.mocked(fs.pathExists).mockResolvedValue(false);

      const result = await detectAutoSwitch('/test/random', mockProjectIndex, mockAppState);

      expect(result.switched).toBe(false);
      expect(result.projectId).toBe(null);
      expect(result.projectName).toBe(null);
      expect(result.templateName).toBe(null);
      expect(result.unregisteredDir).toBe(false);
    });

    it('returns null templateName when project has no activeConfig', async () => {
      // Setup: registered project without active config
      mockProjectIndex.getByPath.mockResolvedValue({
        id: 'proj-789',
        path: '/test/no-config',
        activeConfig: null,
        lastModified: '2026-04-14T00:00:00Z',
      });
      mockAppState.getActiveProject.mockReturnValue(null);

      const result = await detectAutoSwitch('/test/no-config', mockProjectIndex, mockAppState);

      expect(result.switched).toBe(true);
      expect(result.templateName).toBe(null);
    });
  });

  describe('applyAutoSwitch', () => {
    it('calls setActiveProject when projectId exists', () => {
      const result: AutoSwitchResult = {
        switched: true,
        projectId: 'proj-123',
        projectName: 'my-project',
        templateName: 'anthropic-template',
        unregisteredDir: false,
      };

      applyAutoSwitch(result, mockAppState);

      expect(mockAppState.setActiveProject).toHaveBeenCalledWith('proj-123');
    });

    it('does not call setActiveProject when projectId is null', () => {
      const result: AutoSwitchResult = {
        switched: false,
        projectId: null,
        projectName: null,
        templateName: null,
        unregisteredDir: true,
      };

      applyAutoSwitch(result, mockAppState);

      expect(mockAppState.setActiveProject).not.toHaveBeenCalled();
    });
  });

  describe('formatSwitchMessage', () => {
    it('returns null when no switch and no unregistered (D-02 silent)', () => {
      const result: AutoSwitchResult = {
        switched: false,
        projectId: 'proj-123',
        projectName: 'my-project',
        templateName: 'anthropic-template',
        unregisteredDir: false,
      };

      const message = formatSwitchMessage(result);

      expect(message).toBe(null); // D-02: silent mode
    });

    it('returns switch message when switched=true (D-02)', () => {
      const result: AutoSwitchResult = {
        switched: true,
        projectId: 'proj-123',
        projectName: 'my-project',
        templateName: 'anthropic-template',
        unregisteredDir: false,
      };

      const message = formatSwitchMessage(result);

      expect(message).toContain('Switched to project: my-project');
      expect(message).toContain('Template: anthropic-template');
    });

    it('returns switch message without template when templateName is null', () => {
      const result: AutoSwitchResult = {
        switched: true,
        projectId: 'proj-123',
        projectName: 'my-project',
        templateName: null,
        unregisteredDir: false,
      };

      const message = formatSwitchMessage(result);

      expect(message).toContain('Switched to project: my-project');
      expect(message).not.toContain('Template:');
    });

    it('returns unregistered message for unregisteredDir (D-03)', () => {
      const result: AutoSwitchResult = {
        switched: false,
        projectId: null,
        projectName: null,
        templateName: null,
        unregisteredDir: true,
      };

      const message = formatSwitchMessage(result);

      expect(message).toContain('Found .claude directory');
      expect(message).toContain('cc-config register');
    });
  });
});