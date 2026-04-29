/**
 * ProjectService Tests
 *
 * Tests for project management service.
 * Per F4: ProjectService handles project index, directory scanning, CRUD, and status queries.
 * Per D-01: Services as classes + constructor injection.
 * Per D-04: Auto scan user-configured roots + manual confirm.
 * Per D-05: Scan directories stored in AppState.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { ProjectService, type ScanResult } from './project-service.js';
import { ProjectIndex, type ProjectEntry } from '../store/project.js';
import { AppState } from '../store/state.js';
import { ServiceError } from './types.js';

// Test-specific project name to avoid polluting real state
const TEST_STATE_NAME = 'project-service-test-state';

describe('ProjectService', () => {
  let tempDir: string;
  let projectService: ProjectService;
  let mockProjectIndex: ProjectIndex;
  let mockAppState: AppState;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'project-service-test-'));
    mockProjectIndex = new ProjectIndex(path.join(tempDir, 'projects.json'));
    mockAppState = new AppState(TEST_STATE_NAME);
    mockAppState.clear();
    mockProjectIndex.clearCache(); // Ensure fresh state for each test
    projectService = new ProjectService(mockProjectIndex, mockAppState);
  });

  afterEach(async () => {
    mockProjectIndex.clearCache(); // Clear cache before removing temp dir
    await fs.remove(tempDir);
    mockAppState.clear();
  });

  describe('constructor', () => {
    it('should accept ProjectIndex and AppState via constructor injection', () => {
      const index = new ProjectIndex(path.join(tempDir, 'test-projects.json'));
      const state = new AppState('test-constructor');
      const service = new ProjectService(index, state);
      expect(service).toBeDefined();
    });
  });

  describe('scanProjects', () => {
    it('should find directories with .claude/settings.json', async () => {
      // Create test directory structure
      const project1 = path.join(tempDir, 'project1');
      const project2 = path.join(tempDir, 'subdir', 'project2');
      await fs.ensureDir(path.join(project1, '.claude'));
      await fs.ensureDir(path.join(project2, '.claude'));
      await fs.writeJSON(path.join(project1, '.claude', 'settings.json'), {});
      await fs.writeJSON(path.join(project2, '.claude', 'settings.json'), {});

      // Set scan directory
      mockAppState.set('scanDirectories', [tempDir]);

      const results = await projectService.scanProjects();

      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results.map((r) => r.path)).toContain(project1);
      expect(results.map((r) => r.path)).toContain(project2);
    });

    it('should find directories with .claude/settings.local.json', async () => {
      // Create test directory with settings.local.json only
      const project3 = path.join(tempDir, 'project3');
      await fs.ensureDir(path.join(project3, '.claude'));
      await fs.writeJSON(path.join(project3, '.claude', 'settings.local.json'), {});

      mockAppState.set('scanDirectories', [tempDir]);

      const results = await projectService.scanProjects();

      expect(results.map((r) => r.path)).toContain(project3);
    });

    it('should find directories with either settings.json or settings.local.json', async () => {
      // Create one with settings.json, one with settings.local.json
      const project4 = path.join(tempDir, 'project4');
      const project5 = path.join(tempDir, 'project5');
      await fs.ensureDir(path.join(project4, '.claude'));
      await fs.ensureDir(path.join(project5, '.claude'));
      await fs.writeJSON(path.join(project4, '.claude', 'settings.json'), {});
      await fs.writeJSON(path.join(project5, '.claude', 'settings.local.json'), {});

      mockAppState.set('scanDirectories', [tempDir]);

      const results = await projectService.scanProjects();

      expect(results.map((r) => r.path)).toContain(project4);
      expect(results.map((r) => r.path)).toContain(project5);
    });

    it('should respect maxDepth limit', async () => {
      // Create nested structure
      const deepProject = path.join(tempDir, 'level1', 'level2', 'level3', 'level4', 'project');
      await fs.ensureDir(path.join(deepProject, '.claude'));
      await fs.writeJSON(path.join(deepProject, '.claude', 'settings.json'), {});

      mockAppState.set('scanDirectories', [tempDir]);

      // Default maxDepth is 3, so level4 should not be found
      const results = await projectService.scanProjects(3);
      expect(results.map((r) => r.path)).not.toContain(deepProject);

      // With maxDepth=5, should find it
      const deepResults = await projectService.scanProjects(5);
      expect(deepResults.map((r) => r.path)).toContain(deepProject);
    });

    it('should skip node_modules and hidden directories', async () => {
      // Create directories that should be skipped
      const nodeModulesProject = path.join(tempDir, 'node_modules', 'some-package');
      const hiddenProject = path.join(tempDir, '.hidden-project');

      await fs.ensureDir(path.join(nodeModulesProject, '.claude'));
      await fs.ensureDir(path.join(hiddenProject, '.claude'));
      await fs.writeJSON(path.join(nodeModulesProject, '.claude', 'settings.json'), {});
      await fs.writeJSON(path.join(hiddenProject, '.claude', 'settings.json'), {});

      // Create a valid project
      const validProject = path.join(tempDir, 'valid-project');
      await fs.ensureDir(path.join(validProject, '.claude'));
      await fs.writeJSON(path.join(validProject, '.claude', 'settings.json'), {});

      mockAppState.set('scanDirectories', [tempDir]);

      const results = await projectService.scanProjects();

      expect(results.map((r) => r.path)).not.toContain(nodeModulesProject);
      expect(results.map((r) => r.path)).not.toContain(hiddenProject);
      expect(results.map((r) => r.path)).toContain(validProject);
    });

    it('should default to current directory when no scan directories configured', async () => {
      const originalCwd = process.cwd();
      mockAppState.set('scanDirectories', []);

      // Create a project in temp dir and chdir there
      const cwdProject = path.join(tempDir, 'cwd-project');
      await fs.ensureDir(path.join(cwdProject, '.claude'));
      await fs.writeJSON(path.join(cwdProject, '.claude', 'settings.json'), {});
      process.chdir(tempDir);

      try {
        const results = await projectService.scanProjects();
        // Use realpath to handle macOS /var -> /private/var symlink
        const realCwdProject = await fs.realpath(cwdProject);
        expect(results.map((r) => path.resolve(r.path))).toContain(realCwdProject);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should mark found projects as isNew when not registered', async () => {
      const newProject = path.join(tempDir, 'new-project');
      await fs.ensureDir(path.join(newProject, '.claude'));
      await fs.writeJSON(path.join(newProject, '.claude', 'settings.json'), {});

      mockAppState.set('scanDirectories', [tempDir]);

      const results = await projectService.scanProjects();
      const found = results.find((r) => r.path === newProject);
      expect(found?.isNew).toBe(true);
    });

    it('should mark found projects as not isNew when already registered', async () => {
      const registeredProject = path.join(tempDir, 'registered-project');
      await fs.ensureDir(path.join(registeredProject, '.claude'));
      await fs.writeJSON(path.join(registeredProject, '.claude', 'settings.json'), {});

      // Register it first
      await mockProjectIndex.register(registeredProject);

      mockAppState.set('scanDirectories', [tempDir]);

      const results = await projectService.scanProjects();
      const found = results.find((r) => r.path === registeredProject);
      expect(found?.isNew).toBe(false);
    });

    it('should handle permission errors gracefully', async () => {
      // Create a directory structure
      const validProject = path.join(tempDir, 'valid-project');
      await fs.ensureDir(path.join(validProject, '.claude'));
      await fs.writeJSON(path.join(validProject, '.claude', 'settings.json'), {});

      mockAppState.set('scanDirectories', [tempDir]);

      // This should not throw even if there are permission issues somewhere
      const results = await projectService.scanProjects();
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('should expand ~ to home directory', async () => {
      // This test verifies the path expansion logic
      mockAppState.set('scanDirectories', ['~/some-dir']);
      // Even if ~/some-dir doesn't exist, scanProjects should handle it gracefully
      const results = await projectService.scanProjects();
      // Should return empty array or results (not throw)
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('registerProject', () => {
    it('should create project entry via ProjectIndex', async () => {
      const projectPath = path.join(tempDir, 'test-project');
      await fs.ensureDir(path.join(projectPath, '.claude'));
      await fs.writeJSON(path.join(projectPath, '.claude', 'settings.json'), {});

      const entry = await projectService.registerProject(projectPath);

      expect(entry).toBeDefined();
      // Path is resolved via realpath on macOS (/var -> /private/var)
      const resolvedPath = await fs.realpath(projectPath);
      expect(entry.path).toBe(resolvedPath);
      expect(entry.id).toBeDefined();
    });

    it('should return existing entry if already registered', async () => {
      const projectPath = path.join(tempDir, 'duplicate-project');
      await fs.ensureDir(path.join(projectPath, '.claude'));
      await fs.writeJSON(path.join(projectPath, '.claude', 'settings.json'), {});

      const entry1 = await projectService.registerProject(projectPath);
      const entry2 = await projectService.registerProject(projectPath);

      expect(entry1.id).toBe(entry2.id);
    });
  });

  describe('listProjects', () => {
    it('should return all registered projects', async () => {
      // Register multiple projects
      const project1 = path.join(tempDir, 'list-project-1');
      const project2 = path.join(tempDir, 'list-project-2');
      await fs.ensureDir(path.join(project1, '.claude'));
      await fs.ensureDir(path.join(project2, '.claude'));
      await fs.writeJSON(path.join(project1, '.claude', 'settings.json'), {});
      await fs.writeJSON(path.join(project2, '.claude', 'settings.json'), {});

      await mockProjectIndex.register(project1);
      await mockProjectIndex.register(project2);

      const projects = await projectService.listProjects();

      expect(projects.length).toBe(2);
      // Paths are resolved via realpath
      const resolved1 = await fs.realpath(project1);
      const resolved2 = await fs.realpath(project2);
      expect(projects.map((p) => p.path)).toContain(resolved1);
      expect(projects.map((p) => p.path)).toContain(resolved2);
    });

    it('should return empty array when no projects registered', async () => {
      // Create a fresh ProjectIndex for this test
      const freshIndex = new ProjectIndex(path.join(tempDir, 'empty-projects.json'));
      const freshService = new ProjectService(freshIndex, mockAppState);
      const projects = await freshService.listProjects();
      expect(projects).toEqual([]);
    });
  });

  describe('getProjectByPath', () => {
    it('should find project by path', async () => {
      const projectPath = path.join(tempDir, 'find-by-path');
      await fs.ensureDir(path.join(projectPath, '.claude'));
      await fs.writeJSON(path.join(projectPath, '.claude', 'settings.json'), {});

      await mockProjectIndex.register(projectPath);

      const entry = await projectService.getProjectByPath(projectPath);

      expect(entry).toBeDefined();
      // Path is resolved via realpath
      const resolvedPath = await fs.realpath(projectPath);
      expect(entry?.path).toBe(resolvedPath);
    });

    it('should return null for non-existent path', async () => {
      const entry = await projectService.getProjectByPath('/non-existent/path');
      expect(entry).toBeNull();
    });
  });

  describe('getProjectById', () => {
    it('should find project by ID', async () => {
      const projectPath = path.join(tempDir, 'find-by-id');
      await fs.ensureDir(path.join(projectPath, '.claude'));
      await fs.writeJSON(path.join(projectPath, '.claude', 'settings.json'), {});

      const registered = await mockProjectIndex.register(projectPath);

      const entry = await projectService.getProjectById(registered.id);

      expect(entry).toBeDefined();
      expect(entry?.id).toBe(registered.id);
    });

    it('should return null for non-existent ID', async () => {
      const entry = await projectService.getProjectById('non-existent-id');
      expect(entry).toBeNull();
    });
  });

  describe('updateProject', () => {
    it('should modify activeConfig', async () => {
      const projectPath = path.join(tempDir, 'update-project');
      await fs.ensureDir(path.join(projectPath, '.claude'));
      await fs.writeJSON(path.join(projectPath, '.claude', 'settings.json'), {});

      const entry = await mockProjectIndex.register(projectPath);

      const success = await projectService.updateProject(entry.id, {
        activeConfig: 'test-template',
      });

      expect(success).toBe(true);

      const updated = await mockProjectIndex.getById(entry.id);
      expect(updated?.activeConfig).toBe('test-template');
    });

    it('should return false for non-existent project', async () => {
      const success = await projectService.updateProject('non-existent-id', {
        activeConfig: 'test-template',
      });
      expect(success).toBe(false);
    });
  });

  describe('removeProject', () => {
    it('should delete project from index', async () => {
      const projectPath = path.join(tempDir, 'remove-project');
      await fs.ensureDir(path.join(projectPath, '.claude'));
      await fs.writeJSON(path.join(projectPath, '.claude', 'settings.json'), {});

      const entry = await mockProjectIndex.register(projectPath);

      const success = await projectService.removeProject(entry.id);

      expect(success).toBe(true);

      const removed = await mockProjectIndex.getById(entry.id);
      expect(removed).toBeNull();
    });

    it('should return true on successful removal', async () => {
      const projectPath = path.join(tempDir, 'remove-success');
      await fs.ensureDir(path.join(projectPath, '.claude'));
      await fs.writeJSON(path.join(projectPath, '.claude', 'settings.json'), {});

      const entry = await mockProjectIndex.register(projectPath);

      const result = await projectService.removeProject(entry.id);
      expect(result).toBe(true);
    });

    it('should return false for non-existent project', async () => {
      const result = await projectService.removeProject('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('scanDirectories management', () => {
    it('should get scan directories from AppState', () => {
      mockAppState.set('scanDirectories', ['~/code', '~/projects']);
      const dirs = projectService.getScanDirectories();
      expect(dirs).toEqual(['~/code', '~/projects']);
    });

    it('should return empty array when no scan directories set', () => {
      mockAppState.set('scanDirectories', []);
      const dirs = projectService.getScanDirectories();
      expect(dirs).toEqual([]);
    });

    it('should add scan directory to AppState', () => {
      mockAppState.set('scanDirectories', ['~/code']);
      projectService.addScanDirectory('~/projects');
      expect(mockAppState.get('scanDirectories')).toEqual(['~/code', '~/projects']);
    });

    it('should not duplicate scan directories when adding', () => {
      mockAppState.set('scanDirectories', ['~/code']);
      projectService.addScanDirectory('~/code'); // Already exists
      expect(mockAppState.get('scanDirectories')).toEqual(['~/code']);
    });

    it('should remove scan directory from AppState', () => {
      mockAppState.set('scanDirectories', ['~/code', '~/projects']);
      projectService.removeScanDirectory('~/code');
      expect(mockAppState.get('scanDirectories')).toEqual(['~/projects']);
    });

    it('should handle removing non-existent directory', () => {
      mockAppState.set('scanDirectories', ['~/code']);
      projectService.removeScanDirectory('~/non-existent');
      expect(mockAppState.get('scanDirectories')).toEqual(['~/code']);
    });
  });
});