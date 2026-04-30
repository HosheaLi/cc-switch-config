/**
 * AppState Tests
 *
 * Tests for application-wide state persistence using conf package.
 * Per DATA-05: AppState manages active project, UI preferences, and recent projects.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Conf from 'conf';
import { AppState, type AppStateData } from './state.js';

// Use a test-specific project name to avoid polluting real state
const TEST_PROJECT_NAME = 'cc-config-switch-test';

describe('AppState', () => {
  let appState: AppState;

  beforeAll(() => {
    // Create AppState with test project name
    appState = new AppState(TEST_PROJECT_NAME);
  });

  afterAll(() => {
    // Clean up test state
    appState?.clear();
  });

  beforeEach(() => {
    // Reset to defaults before each test
    appState?.clear();
  });

  describe('get/set operations', () => {
    it('should return default value for unset key', () => {
      const activeProject = appState.get('activeProjectId');
      expect(activeProject).toBeNull();
    });

    it('should store and retrieve value', () => {
      appState.set('activeProjectId', 'test-project-123');
      const result = appState.get('activeProjectId');
      expect(result).toBe('test-project-123');
    });

    it('should handle uiPreferences object', () => {
      const prefs = appState.get('uiPreferences');
      expect(prefs).toEqual({
        theme: 'dark',
        showPreview: true,
      });
    });

    it('should update nested uiPreferences', () => {
      appState.set('uiPreferences', { theme: 'light', showPreview: false });
      const prefs = appState.get('uiPreferences');
      expect(prefs.theme).toBe('light');
      expect(prefs.showPreview).toBe(false);
    });
  });

  describe('getActiveProject', () => {
    it('should return null when no active project', () => {
      const result = appState.getActiveProject();
      expect(result).toBeNull();
    });

    it('should return active project ID when set', () => {
      appState.set('activeProjectId', 'project-abc');
      const result = appState.getActiveProject();
      expect(result).toBe('project-abc');
    });
  });

  describe('setActiveProject', () => {
    it('should update activeProjectId', () => {
      appState.setActiveProject('new-project-123');
      expect(appState.get('activeProjectId')).toBe('new-project-123');
    });

    it('should add project to recentProjects list', () => {
      appState.setActiveProject('project-1');
      const recent = appState.get('recentProjects');
      expect(recent).toContain('project-1');
    });

    it('should cap recent projects at 10 entries', () => {
      // Add 15 projects
      for (let i = 1; i <= 15; i++) {
        appState.setActiveProject(`project-${i}`);
      }

      const recent = appState.get('recentProjects');
      expect(recent.length).toBe(10);
    });

    it('should move existing project to front of recent list', () => {
      // Set initial projects
      appState.setActiveProject('project-a');
      appState.setActiveProject('project-b');
      appState.setActiveProject('project-c');

      // Set project-a again (should move to front)
      appState.setActiveProject('project-a');

      const recent = appState.get('recentProjects');
      expect(recent[0]).toBe('project-a');
      // Should not have duplicates
      expect(recent.filter((id) => id === 'project-a').length).toBe(1);
    });

    it('should maintain most recent at front', () => {
      appState.setActiveProject('first');
      appState.setActiveProject('second');
      appState.setActiveProject('third');

      const recent = appState.get('recentProjects');
      expect(recent[0]).toBe('third');
      expect(recent[1]).toBe('second');
      expect(recent[2]).toBe('first');
    });
  });

  describe('clear', () => {
    it('should reset all state to defaults', () => {
      // Set some state
      appState.set('activeProjectId', 'test-project');
      appState.set('lastUsedTemplate', 'my-template');
      appState.set('uiPreferences', { theme: 'light', showPreview: false });
      appState.setActiveProject('another-project');

      // Clear
      appState.clear();

      // Verify defaults
      expect(appState.get('activeProjectId')).toBeNull();
      expect(appState.get('lastUsedTemplate')).toBeNull();
      expect(appState.get('uiPreferences')).toEqual({
        theme: 'dark',
        showPreview: true,
      });
      expect(appState.get('recentProjects')).toEqual([]);
    });
  });

  describe('persistence', () => {
    it('should persist state across AppState instances', () => {
      // Set state in first instance
      appState.set('activeProjectId', 'persisted-project');
      appState.setActiveProject('persisted-project');

      // Create new instance with same project name
      const newInstance = new AppState(TEST_PROJECT_NAME);

      // Verify state persisted
      expect(newInstance.get('activeProjectId')).toBe('persisted-project');

      // Cleanup
      newInstance.clear();
    });
  });

  describe('getFilePath', () => {
    it('should return config file path', () => {
      const filePath = appState.getFilePath();
      expect(filePath).toContain('cc-config-switch-test');
      expect(filePath.endsWith('.json') || filePath.includes('cc-config-switch-test')).toBe(true);
    });
  });

  describe('lastUsedTemplate', () => {
    it('should default to null', () => {
      expect(appState.get('lastUsedTemplate')).toBeNull();
    });

    it('should store and retrieve template name', () => {
      appState.set('lastUsedTemplate', 'anthropic-claude');
      expect(appState.get('lastUsedTemplate')).toBe('anthropic-claude');
    });
  });

  describe('scanDirectories', () => {
    it('should default to empty array', () => {
      const dirs = appState.get('scanDirectories');
      expect(dirs).toEqual([]);
    });

    it('should store and retrieve scan directories', () => {
      appState.set('scanDirectories', ['~/code', '~/projects']);
      const dirs = appState.get('scanDirectories');
      expect(dirs).toEqual(['~/code', '~/projects']);
    });

    it('should allow adding directories to the list', () => {
      appState.set('scanDirectories', ['~/code']);
      appState.set('scanDirectories', [...appState.get('scanDirectories'), '~/projects']);
      expect(appState.get('scanDirectories')).toEqual(['~/code', '~/projects']);
    });

    it('should persist scan directories across instances', () => {
      appState.set('scanDirectories', ['~/work', '~/personal']);

      const newInstance = new AppState(TEST_PROJECT_NAME);
      expect(newInstance.get('scanDirectories')).toEqual(['~/work', '~/personal']);

      newInstance.clear();
    });
  });

  describe('firstRunCompleted', () => {
    it('should default to false', () => {
      expect(appState.get('firstRunCompleted')).toBe(false);
    });

    it('should store and retrieve completion flag', () => {
      appState.set('firstRunCompleted', true);
      expect(appState.get('firstRunCompleted')).toBe(true);
    });

    it('should persist completion flag across instances', () => {
      appState.set('firstRunCompleted', true);

      const newInstance = new AppState(TEST_PROJECT_NAME);
      expect(newInstance.get('firstRunCompleted')).toBe(true);

      newInstance.clear();
    });
  });

  describe('skipDirectories', () => {
    it('should default to empty array', () => {
      expect(appState.get('skipDirectories')).toEqual([]);
    });

    it('should store and retrieve skip directories', () => {
      appState.set('skipDirectories', ['custom-skip']);
      expect(appState.get('skipDirectories')).toEqual(['custom-skip']);
    });

    it('should persist skip directories across instances', () => {
      appState.set('skipDirectories', ['my-dir']);

      const newInstance = new AppState(TEST_PROJECT_NAME);
      expect(newInstance.get('skipDirectories')).toEqual(['my-dir']);

      newInstance.clear();
    });
  });
});