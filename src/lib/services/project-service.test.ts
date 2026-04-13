/**
 * ProjectService Tests
 *
 * Tests for project management service.
 * Wave 0 stubs - will be implemented in Wave 1.
 *
 * Per F4: ProjectService handles project index, directory scanning, CRUD, and status queries.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('ProjectService', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'project-service-test-'));
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('scanProjects', () => {
    it.todo('scanProjects finds .claude directories');
    it.todo('scanProjects scans recursively within depth limit');
    it.todo('scanProjects respects scan directories from AppState');
    it.todo('scanProjects handles permission errors gracefully');
  });

  describe('registerProject', () => {
    it.todo('registerProject creates project entry');
    it.todo('registerProject validates project path exists');
    it.todo('registerProject sets default config path');
    it.todo('registerProject updates project index');
  });

  describe('listProjects', () => {
    it.todo('listProjects returns all registered');
    it.todo('listProjects sorts by last modified');
    it.todo('listProjects filters by active status');
  });

  describe('updateProject', () => {
    it.todo('updateProject modifies activeConfig');
    it.todo('updateProject validates changes');
    it.todo('updateProject persists to project index');
  });

  describe('getProject', () => {
    it.todo('getProject retrieves by id');
    it.todo('getProject retrieves by path');
    it.todo('getProject returns null for non-existent');
  });

  describe('removeProject', () => {
    it.todo('removeProject deletes from index');
    it.todo('removeProject returns true on success');
    it.todo('removeProject returns false for non-existent');
  });
});