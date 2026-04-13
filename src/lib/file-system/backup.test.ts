import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { createBackup, listBackups, restoreBackup, getLatestBackup } from './backup.js';

describe('backup', () => {
  let tempDir: string;
  let testFile: string;

  beforeEach(async () => {
    // Create temp directory for each test
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'backup-test-'));
    testFile = path.join(tempDir, 'test-config.json');
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.remove(tempDir);
  });

  describe('createBackup', () => {
    it('should create .backups directory', async () => {
      // Write a test file
      await fs.writeJson(testFile, { test: 'data' });

      // Create backup
      const backupPath = await createBackup(testFile);

      // Verify .backups directory exists
      const backupDir = path.join(tempDir, '.backups');
      expect(await fs.pathExists(backupDir)).toBe(true);
      expect(backupPath).not.toBeNull();
    });

    it('should copy file with timestamped name', async () => {
      // Write a test file
      const testData = { test: 'data', nested: { value: 123 } };
      await fs.writeJson(testFile, testData);

      // Create backup
      const backupPath = await createBackup(testFile);
      expect(backupPath).not.toBeNull();

      // Verify backup exists and has correct content
      expect(await fs.pathExists(backupPath!)).toBe(true);
      const backupData = await fs.readJson(backupPath!);
      expect(backupData).toEqual(testData);
    });

    it('should return null if file does not exist', async () => {
      // Don't create the test file
      const backupPath = await createBackup(testFile);
      expect(backupPath).toBeNull();
    });

    it('should use backup filename format: {basename}.{timestamp}', async () => {
      await fs.writeJson(testFile, { test: 'data' });

      const backupPath = await createBackup(testFile);
      expect(backupPath).not.toBeNull();

      // Check filename format: test-config.json.YYYY-MM-DDTHH-mm-ss-msZ (ISO format)
      const filename = path.basename(backupPath!);
      expect(filename).toMatch(/^test-config\.json\.\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/);
    });

    it('should create multiple backups with different timestamps', async () => {
      await fs.writeJson(testFile, { version: 1 });

      const backup1 = await createBackup(testFile);
      await new Promise(resolve => setTimeout(resolve, 10)); // Ensure different timestamp

      await fs.writeJson(testFile, { version: 2 });
      const backup2 = await createBackup(testFile);

      expect(backup1).not.toBeNull();
      expect(backup2).not.toBeNull();
      expect(backup1).not.toBe(backup2);
    });
  });

  describe('listBackups', () => {
    it('should return empty array if no backups exist', async () => {
      const backups = await listBackups(testFile);
      expect(backups).toEqual([]);
    });

    it('should return sorted array (newest first)', async () => {
      await fs.writeJson(testFile, { version: 1 });
      const backup1 = await createBackup(testFile);
      await new Promise(resolve => setTimeout(resolve, 10));

      await fs.writeJson(testFile, { version: 2 });
      const backup2 = await createBackup(testFile);
      await new Promise(resolve => setTimeout(resolve, 10));

      await fs.writeJson(testFile, { version: 3 });
      const backup3 = await createBackup(testFile);

      const backups = await listBackups(testFile);

      // Should have 3 backups, newest first
      expect(backups).toHaveLength(3);
      expect(backups[0]).toBe(backup3);
      expect(backups[1]).toBe(backup2);
      expect(backups[2]).toBe(backup1);
    });

    it('should only list backups for the specified file', async () => {
      // Create backups for testFile
      await fs.writeJson(testFile, { test: 1 });
      await createBackup(testFile);

      // Create backups for another file
      const otherFile = path.join(tempDir, 'other-config.json');
      await fs.writeJson(otherFile, { other: 1 });
      await createBackup(otherFile);

      const backups = await listBackups(testFile);

      // Should only have backups for testFile
      expect(backups).toHaveLength(1);
      expect(backups[0]).toContain('test-config.json.');
    });
  });

  describe('restoreBackup', () => {
    it('should copy backup to original location', async () => {
      // Create original and backup
      const originalData = { version: 1, data: 'original' };
      await fs.writeJson(testFile, originalData);
      const backupPath = await createBackup(testFile);

      // Modify the original
      const modifiedData = { version: 2, data: 'modified' };
      await fs.writeJson(testFile, modifiedData);

      // Restore from backup
      await restoreBackup(testFile, backupPath!);

      // Verify restored content
      const restoredData = await fs.readJson(testFile);
      expect(restoredData).toEqual(originalData);
    });

    it('should throw error if backup file does not exist', async () => {
      const nonExistentBackup = path.join(tempDir, '.backups', 'non-existent.json');
      await expect(restoreBackup(testFile, nonExistentBackup)).rejects.toThrow();
    });

    it('should use atomic write pattern (temp file + rename)', async () => {
      // Create backup
      await fs.writeJson(testFile, { test: 'data' });
      const backupPath = await createBackup(testFile);

      // Restore
      await restoreBackup(testFile, backupPath!);

      // Verify no temp files left
      const files = await fs.readdir(tempDir);
      const tempFiles = files.filter(f => f.includes('.tmp.'));
      expect(tempFiles).toHaveLength(0);
    });
  });

  describe('getLatestBackup', () => {
    it('should return most recent backup', async () => {
      await fs.writeJson(testFile, { version: 1 });
      const backup1 = await createBackup(testFile);
      await new Promise(resolve => setTimeout(resolve, 10));

      await fs.writeJson(testFile, { version: 2 });
      const backup2 = await createBackup(testFile);
      await new Promise(resolve => setTimeout(resolve, 10));

      await fs.writeJson(testFile, { version: 3 });
      const backup3 = await createBackup(testFile);

      const result = await getLatestBackup(testFile);
      // Should return the most recent backup (backup3)
      expect(result).toBe(backup3);
      // Verify all backups exist
      const allBackups = await listBackups(testFile);
      expect(allBackups).toHaveLength(3);
    });

    it('should return null if no backups exist', async () => {
      const result = await getLatestBackup(testFile);
      expect(result).toBeNull();
    });
  });
});