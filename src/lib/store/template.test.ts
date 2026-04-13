/**
 * TemplateStore Tests
 *
 * Tests for template CRUD operations with persistence.
 * Per DATA-02: TemplateStore manages user-defined API provider templates.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { TemplateStore } from './template.js';
import type { TemplateConfig } from '../types/provider.js';
import { ValidationError } from '../types/validation.js';

describe('TemplateStore', () => {
  let tempDir: string;
  let templatesFile: string;
  let store: TemplateStore;

  // Helper to create valid template config
  const createValidTemplate = (name: string): TemplateConfig => ({
    name,
    description: `Test template for ${name}`,
    provider: {
      name: 'Test Provider',
      baseUrl: 'https://api.test.com',
      authType: 'token',
      headers: { 'X-Custom': 'value' },
      env: { API_KEY: 'test-key' },
    },
    tags: ['test', 'unit'],
  });

  beforeEach(async () => {
    // Create temp directory for test isolation
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'template-store-test-'));
    templatesFile = path.join(tempDir, 'templates.json');

    // Create store instance pointing to temp directory
    // We need to mock getConfigDir for testing
    store = new TemplateStore(templatesFile);
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.remove(tempDir);
  });

  describe('getAll', () => {
    it('should return empty object for new store', async () => {
      const templates = await store.getAll();

      expect(templates).toEqual({});
    });

    it('should return all templates after adding', async () => {
      const template1 = createValidTemplate('template1');
      const template2 = createValidTemplate('template2');

      await store.set('template1', template1);
      await store.set('template2', template2);

      const templates = await store.getAll();

      expect(Object.keys(templates)).toHaveLength(2);
      expect(templates.template1.name).toBe('template1');
      expect(templates.template2.name).toBe('template2');
    });
  });

  describe('set', () => {
    it('should create new template with valid data', async () => {
      const template = createValidTemplate('test-template');

      await store.set('test-template', template);

      // Verify template was saved
      const saved = await store.get('test-template');
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe('test-template');
      expect(saved?.provider.baseUrl).toBe('https://api.test.com');
    });

    it('should throw ValidationError for invalid template', async () => {
      const invalidTemplate = {
        name: '', // Invalid: empty name
        provider: {
          name: 'Test',
          baseUrl: 'not-a-url', // Invalid: not a URL
          authType: 'token',
        },
      };

      await expect(store.set('invalid', invalidTemplate as TemplateConfig)).rejects.toThrow(ValidationError);
    });

    it('should add createdAt timestamp on creation', async () => {
      const template = createValidTemplate('timestamp-test');

      await store.set('timestamp-test', template);

      const saved = await store.get('timestamp-test');
      expect(saved?.createdAt).toBeDefined();
      expect(saved?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should update updatedAt timestamp on modification', async () => {
      const template = createValidTemplate('update-test');
      await store.set('update-test', template);

      const initial = await store.get('update-test');
      const initialUpdatedAt = initial?.updatedAt;

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update the template
      const updatedTemplate = { ...template, description: 'Updated description' };
      await store.set('update-test', updatedTemplate);

      const updated = await store.get('update-test');
      expect(updated?.updatedAt).toBeDefined();
      // updatedAt should be updated (or created if it wasn't there)
      expect(updated?.updatedAt).not.toBe(initialUpdatedAt);
    });

    it('should create backup before modification', async () => {
      // First, create initial template
      const template = createValidTemplate('backup-test');
      await store.set('backup-test', template);

      // Now update it - this should trigger backup
      const updatedTemplate = { ...template, description: 'Updated' };
      await store.set('backup-test', updatedTemplate);

      // Check for backup directory
      const backupDir = path.join(tempDir, '.backups');
      const backupExists = await fs.pathExists(backupDir);
      expect(backupExists).toBe(true);

      // Check for backup files
      const backups = await fs.readdir(backupDir);
      expect(backups.length).toBeGreaterThan(0);
    });
  });

  describe('get', () => {
    it('should return template by name', async () => {
      const template = createValidTemplate('get-test');
      await store.set('get-test', template);

      const result = await store.get('get-test');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('get-test');
      expect(result?.provider.baseUrl).toBe('https://api.test.com');
    });

    it('should return null for non-existent template', async () => {
      const result = await store.get('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should remove existing template and return true', async () => {
      const template = createValidTemplate('delete-test');
      await store.set('delete-test', template);

      const result = await store.delete('delete-test');

      expect(result).toBe(true);

      // Verify it's actually deleted
      const deleted = await store.get('delete-test');
      expect(deleted).toBeNull();
    });

    it('should return false for non-existent template', async () => {
      const result = await store.delete('non-existent');

      expect(result).toBe(false);
    });

    it('should create backup before deletion', async () => {
      const template = createValidTemplate('delete-backup-test');
      await store.set('delete-backup-test', template);

      await store.delete('delete-backup-test');

      // Check for backup
      const backupDir = path.join(tempDir, '.backups');
      const backupExists = await fs.pathExists(backupDir);
      expect(backupExists).toBe(true);
    });
  });

  describe('list', () => {
    it('should return empty array for new store', async () => {
      const names = await store.list();

      expect(names).toEqual([]);
    });

    it('should return all template names as array', async () => {
      await store.set('alpha', createValidTemplate('alpha'));
      await store.set('beta', createValidTemplate('beta'));
      await store.set('gamma', createValidTemplate('gamma'));

      const names = await store.list();

      expect(names).toHaveLength(3);
      expect(names).toContain('alpha');
      expect(names).toContain('beta');
      expect(names).toContain('gamma');
    });
  });

  describe('persistence', () => {
    it('templates should persist after store reload', async () => {
      // Add templates with first store instance
      const template1 = createValidTemplate('persist1');
      const template2 = createValidTemplate('persist2');

      await store.set('persist1', template1);
      await store.set('persist2', template2);

      // Create a new store instance pointing to same file
      const newStore = new TemplateStore(templatesFile);

      // Verify templates persisted
      const templates = await newStore.getAll();
      expect(Object.keys(templates)).toHaveLength(2);
      expect(templates.persist1).toBeDefined();
      expect(templates.persist2).toBeDefined();
    });

    it('should store templates in valid JSON format', async () => {
      const template = createValidTemplate('json-test');
      await store.set('json-test', template);

      // Read the file directly
      const content = await fs.readFile(templatesFile, 'utf8');
      const parsed = JSON.parse(content);

      expect(parsed.version).toBeDefined();
      expect(parsed.templates).toBeDefined();
      expect(parsed.templates['json-test']).toBeDefined();
    });
  });
});