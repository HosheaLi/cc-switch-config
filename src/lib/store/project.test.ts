/**
 * ProjectIndex Tests
 *
 * Tests for project registration, lookup, update, and removal operations.
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { ProjectIndex, ProjectEntry, ProjectIndexData } from './project.js';

describe('ProjectIndex', () => {
  let tempDir: string;
  let tempDirReal: string; // realpath resolved temp dir
  let testProjectDir: string;
  let testProjectDirReal: string; // realpath resolved path
  let projectIndex: ProjectIndex;
  let testProjectsFile: string;

  beforeAll(async () => {
    // Create temp directory for test data
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'project-index-test-'));
    // Resolve realpath for macOS (/var -> /private/var)
    tempDirReal = await fs.realpath(tempDir);
    testProjectsFile = path.join(tempDirReal, 'projects.json');
  });

  afterAll(async () => {
    await fs.remove(tempDir);
  });

  beforeEach(async () => {
    // Create a test project directory
    testProjectDir = path.join(tempDir, 'test-project');
    await fs.ensureDir(testProjectDir);

    // Resolve realpath for macOS (/var -> /private/var)
    testProjectDirReal = await fs.realpath(testProjectDir);

    // Ensure projects file exists and is empty
    await fs.writeJson(testProjectsFile, { version: 1, projects: {}, pathIndex: {} });

    // Create project index with custom file path for testing
    projectIndex = new ProjectIndex(testProjectsFile);
    projectIndex.clearCache();
  });

  afterEach(async () => {
    await fs.remove(testProjectDir);
    // Reset projects file to empty
    await fs.writeJson(testProjectsFile, { version: 1, projects: {}, pathIndex: {} });
  });

  describe('register', () => {
    it('Test 1: register creates new project entry with UUID', async () => {
      const entry = await projectIndex.register(testProjectDir);

      expect(entry).toBeDefined();
      expect(entry.id).toBeDefined();
      expect(entry.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i); // UUID format
      expect(entry.name).toBe('test-project'); // name from path basename
      expect(entry.path).toBe(testProjectDirReal); // realpath resolved
      expect(entry.activeConfig).toBeNull();
      expect(entry.lastModified).toBeDefined();
    });

    it('Test 2: register returns existing entry if path already registered', async () => {
      const firstEntry = await projectIndex.register(testProjectDir);
      const secondEntry = await projectIndex.register(testProjectDir);

      expect(secondEntry.id).toBe(firstEntry.id);
      expect(secondEntry.path).toBe(firstEntry.path);
    });

    it('Test 12: path normalization (realpath) handles symlinks', async () => {
      // Skip symlink test on Windows (symlink permissions differ)
      if (process.platform === 'win32') {
        return;
      }

      // Create a symlink to the test project
      const symlinkDir = path.join(tempDir, 'project-symlink');
      await fs.symlink(testProjectDir, symlinkDir);

      // Register via symlink path
      const symlinkEntry = await projectIndex.register(symlinkDir);

      // Register via real path
      const realEntry = await projectIndex.register(testProjectDir);

      // Should return the same entry (normalized to real path)
      expect(symlinkEntry.id).toBe(realEntry.id);
      expect(symlinkEntry.path).toBe(testProjectDirReal); // Should be resolved to real path

      // Cleanup symlink
      await fs.remove(symlinkDir);
    });
  });

  describe('getByPath', () => {
    it('Test 3: getByPath returns project entry for registered path', async () => {
      const registered = await projectIndex.register(testProjectDir);
      const found = await projectIndex.getByPath(testProjectDir);

      expect(found).toBeDefined();
      expect(found?.id).toBe(registered.id);
      expect(found?.path).toBe(testProjectDirReal);
    });

    it('Test 4: getByPath returns null for non-existent path', async () => {
      const notFound = await projectIndex.getByPath('/non/existent/path');

      expect(notFound).toBeNull();
    });
  });

  describe('getById', () => {
    it('Test 5: getById returns project entry for valid ID', async () => {
      const registered = await projectIndex.register(testProjectDir);
      const found = await projectIndex.getById(registered.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(registered.id);
      expect(found?.path).toBe(testProjectDirReal);
    });

    it('Test 6: getById returns null for non-existent ID', async () => {
      const notFound = await projectIndex.getById('non-existent-uuid');

      expect(notFound).toBeNull();
    });
  });

  describe('update', () => {
    it('Test 7: update modifies project metadata (activeConfig, lastModified)', async () => {
      const registered = await projectIndex.register(testProjectDir);
      const originalTimestamp = registered.lastModified;

      // Small delay to ensure timestamp differs
      await new Promise(resolve => setTimeout(resolve, 10));

      // Update activeConfig
      const updated = await projectIndex.update(registered.id, { activeConfig: 'anthropic-template' });

      expect(updated).toBe(true);

      // Verify update
      const entry = await projectIndex.getById(registered.id);
      expect(entry?.activeConfig).toBe('anthropic-template');
      // Timestamp should be updated (after delay)
      expect(entry?.lastModified).not.toBe(originalTimestamp);
    });

    it('should return false for non-existent project', async () => {
      const result = await projectIndex.update('non-existent-id', { activeConfig: 'test' });

      expect(result).toBe(false);
    });
  });

  describe('remove', () => {
    it('Test 8: remove deletes project entry and returns true', async () => {
      const registered = await projectIndex.register(testProjectDir);

      const removed = await projectIndex.remove(registered.id);

      expect(removed).toBe(true);

      // Verify entry is gone
      const notFound = await projectIndex.getById(registered.id);
      expect(notFound).toBeNull();
    });

    it('Test 9: remove returns false for non-existent project', async () => {
      const removed = await projectIndex.remove('non-existent-id');

      expect(removed).toBe(false);
    });
  });

  describe('getAll', () => {
    it('Test 10: getAll returns all project entries', async () => {
      // Register multiple projects
      const project1Dir = path.join(tempDir, 'project1');
      const project2Dir = path.join(tempDir, 'project2');
      await fs.ensureDir(project1Dir);
      await fs.ensureDir(project2Dir);

      const entry1 = await projectIndex.register(project1Dir);
      const entry2 = await projectIndex.register(project2Dir);

      const all = await projectIndex.getAll();

      expect(all).toHaveLength(2);
      expect(all.map(e => e.id)).toContain(entry1.id);
      expect(all.map(e => e.id)).toContain(entry2.id);

      // Cleanup
      await fs.remove(project1Dir);
      await fs.remove(project2Dir);
    });

    it('should return empty array when no projects registered', async () => {
      // Fresh index with empty file
      projectIndex.clearCache();
      const all = await projectIndex.getAll();

      expect(all).toHaveLength(0);
    });
  });

  describe('persistence', () => {
    it('Test 11: projects persist after index reload', async () => {
      // Register a project
      const registered = await projectIndex.register(testProjectDir);

      // Create a new ProjectIndex instance (simulates restart)
      const newIndex = new ProjectIndex(testProjectsFile);
      newIndex.clearCache();

      // Load persisted data
      const found = await newIndex.getById(registered.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(registered.id);
      expect(found?.path).toBe(testProjectDirReal);
    });
  });

  describe('data structure', () => {
    it('should maintain pathIndex for fast lookup', async () => {
      await projectIndex.register(testProjectDir);

      // Read raw data to verify pathIndex
      const data = await fs.readJson(testProjectsFile) as ProjectIndexData;

      expect(data.pathIndex).toBeDefined();
      expect(data.pathIndex[testProjectDirReal]).toBeDefined();
    });

    it('should store projects keyed by ID', async () => {
      const registered = await projectIndex.register(testProjectDir);

      const data = await fs.readJson(testProjectsFile) as ProjectIndexData;

      expect(data.projects[registered.id]).toBeDefined();
    });

    it('should include version field', async () => {
      await projectIndex.register(testProjectDir);

      const data = await fs.readJson(testProjectsFile) as ProjectIndexData;

      expect(data.version).toBeDefined();
      expect(data.version).toBe(1);
    });
  });

  describe('getByName', () => {
    it('should find project by name', async () => {
      const registered = await projectIndex.register(testProjectDir);

      const found = await projectIndex.getByName(registered.name);

      expect(found).toBeDefined();
      expect(found?.id).toBe(registered.id);
    });

    it('should return null for non-existent name', async () => {
      const found = await projectIndex.getByName('non-existent-project');

      expect(found).toBeNull();
    });
  });

  describe('resolve', () => {
    it('should resolve project by UUID', async () => {
      const registered = await projectIndex.register(testProjectDir);

      const resolved = await projectIndex.resolve(registered.id);

      expect(resolved).toBeDefined();
      expect(resolved?.id).toBe(registered.id);
    });

    it('should resolve project by name', async () => {
      const registered = await projectIndex.register(testProjectDir);

      const resolved = await projectIndex.resolve(registered.name);

      expect(resolved).toBeDefined();
      expect(resolved?.id).toBe(registered.id);
    });

    it('should resolve project by path', async () => {
      const registered = await projectIndex.register(testProjectDir);

      const resolved = await projectIndex.resolve(testProjectDir);

      expect(resolved).toBeDefined();
      expect(resolved?.id).toBe(registered.id);
    });

    it('should return null for non-existent identifier', async () => {
      const resolved = await projectIndex.resolve('non-existent');

      expect(resolved).toBeNull();
    });
  });
});