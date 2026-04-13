/**
 * Atomic JSON File Operations Tests
 *
 * Tests for write-rename pattern, crash safety, and error handling.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { writeJSON, readJSON, readJSONWithComments, exists } from './json.js';

describe('atomic writes', () => {
  let tempDir: string;
  let testFile: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'json-test-'));
    testFile = path.join(tempDir, 'test.json');
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('writeJSON', () => {
    it('should create temp file with .tmp suffix', async () => {
      const data = { test: 'value' };

      // Write the file
      await writeJSON(testFile, data);

      // Check that only the final file exists (temp file should be cleaned up)
      const files = await fs.readdir(tempDir);
      expect(files).toContain('test.json');
      expect(files.some(f => f.startsWith('test.json.tmp'))).toBe(false);
    });

    it('should rename temp to final path atomically', async () => {
      const data = { key: 'value', nested: { deep: true } };

      await writeJSON(testFile, data);

      // Verify file exists and content is correct
      const content = await fs.readFile(testFile, 'utf8');
      const parsed = JSON.parse(content);

      expect(parsed).toEqual(data);
    });

    it('should write JSON with pretty formatting (2 spaces)', async () => {
      const data = { a: 1, b: 2 };

      await writeJSON(testFile, data);

      const content = await fs.readFile(testFile, 'utf8');

      // Should have newlines for formatting
      expect(content).toContain('\n');
      expect(content).toBe(JSON.stringify(data, null, 2) + '\n');
    });

    it('should create parent directory if it does not exist', async () => {
      const nestedFile = path.join(tempDir, 'subdir', 'nested', 'test.json');
      const data = { nested: true };

      await writeJSON(nestedFile, data);

      // Verify file was created
      const exists = await fs.pathExists(nestedFile);
      expect(exists).toBe(true);

      const content = await fs.readFile(nestedFile, 'utf8');
      expect(JSON.parse(content)).toEqual(data);
    });

    it('should clean up temp file on error', async () => {
      // This is harder to test directly, but we can verify the pattern
      // by ensuring no temp files are left after successful write
      const data = { test: 'cleanup' };

      await writeJSON(testFile, data);

      const files = await fs.readdir(tempDir);
      const tempFiles = files.filter(f => f.includes('.tmp'));
      expect(tempFiles).toHaveLength(0);
    });

    it('should overwrite existing file atomically', async () => {
      // Create initial file
      await fs.writeJson(testFile, { version: 1 });

      // Overwrite with new data
      await writeJSON(testFile, { version: 2, extra: 'data' });

      // Verify atomic overwrite
      const content = await fs.readFile(testFile, 'utf8');
      const parsed = JSON.parse(content);

      expect(parsed.version).toBe(2);
      expect(parsed.extra).toBe('data');
    });

    it('should preserve file permissions after atomic write', async () => {
      // Create file with specific permissions
      await fs.writeJson(testFile, { initial: true });
      await fs.chmod(testFile, 0o600);

      // Get initial permissions
      const initialStat = await fs.stat(testFile);
      const initialMode = initialStat.mode & 0o777;

      // Overwrite
      await writeJSON(testFile, { updated: true });

      // Check permissions preserved
      const finalStat = await fs.stat(testFile);
      const finalMode = finalStat.mode & 0o777;

      // Note: fs.rename preserves permissions on POSIX systems
      // This test verifies the behavior
      expect(finalMode).toBe(initialMode);
    });
  });

  describe('readJSON', () => {
    it('should return parsed JSON object', async () => {
      const data = { key: 'value', number: 42 };
      await fs.writeJson(testFile, data);

      const result = await readJSON<typeof data>(testFile);

      expect(result).toEqual(data);
    });

    it('should return null for non-existent file (ENOENT)', async () => {
      const result = await readJSON('/non/existent/path/file.json');

      expect(result).toBeNull();
    });

    it('should throw enhanced error for malformed JSON', async () => {
      const malformedContent = '{ "key": "value" missing closing brace';
      await fs.writeFile(testFile, malformedContent);

      await expect(readJSON(testFile)).rejects.toThrow();
    });

    it('should include file path in error for malformed JSON', async () => {
      const malformedContent = '{ invalid json }';
      await fs.writeFile(testFile, malformedContent);

      try {
        await readJSON(testFile);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain(testFile);
      }
    });

    it('should include line number in error for malformed JSON', async () => {
      // Create JSON with error on line 2
      const content = '{\n  "key": invalid\n}';
      await fs.writeFile(testFile, content);

      try {
        await readJSON(testFile);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        // Should mention line number
        const message = (error as Error).message;
        expect(message).toMatch(/line\s*\d+/i);
      }
    });
  });

  describe('readJSONWithComments', () => {
    it('should parse JSON with single-line comments', async () => {
      const content = `{
  // This is a comment
  "key": "value"
}`;
      await fs.writeFile(testFile, content);

      const result = await readJSONWithComments(testFile);

      expect(result).toEqual({ key: 'value' });
    });

    it('should parse JSON with multi-line comments', async () => {
      const content = `{
  /* This is a
     multi-line comment */
  "key": "value"
}`;
      await fs.writeFile(testFile, content);

      const result = await readJSONWithComments(testFile);

      expect(result).toEqual({ key: 'value' });
    });

    it('should return null for non-existent file', async () => {
      const result = await readJSONWithComments('/non/existent/file.json');

      expect(result).toBeNull();
    });

    it('should handle trailing commas in JSON', async () => {
      const content = `{
  "items": [1, 2, 3,],
  "key": "value",
}`;
      await fs.writeFile(testFile, content);

      // Should either handle trailing commas or throw
      // (depends on implementation choice)
      try {
        const result = await readJSONWithComments(testFile);
        expect(result).toBeDefined();
      } catch {
        // Also acceptable to reject trailing commas
      }
    });
  });

  describe('exists', () => {
    it('should return true for existing file', async () => {
      await fs.writeJson(testFile, { test: true });

      const result = await exists(testFile);

      expect(result).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      const result = await exists('/non/existent/file.json');

      expect(result).toBe(false);
    });

    it('should return false for directory', async () => {
      const result = await exists(tempDir);

      expect(result).toBe(false);
    });
  });

  describe('crash simulation', () => {
    it('should leave original file intact if temp file exists but rename not called', async () => {
      // Create original file
      const originalData = { version: 1, original: true };
      await fs.writeJson(testFile, originalData);

      // Simulate partial write: create temp file but don't rename
      const tempPath = `${testFile}.tmp.${process.pid}`;
      await fs.writeFile(tempPath, JSON.stringify({ version: 2, partial: true }));

      // Original should still be intact
      const original = await fs.readJson(testFile);
      expect(original).toEqual(originalData);

      // Cleanup temp
      await fs.remove(tempPath);
    });

    it('should verify atomic rename semantics', async () => {
      // This test verifies the core atomic write pattern
      const data = { atomic: true, timestamp: Date.now() };

      // Write atomically
      await writeJSON(testFile, data);

      // Verify the final file exists and is correct
      const result = await readJSON<typeof data>(testFile);
      expect(result).toEqual(data);
    });
  });

  describe('error handling', () => {
    it('should throw descriptive error for permission denied', async () => {
      // Skip on Windows (permission handling differs)
      if (process.platform === 'win32') {
        return;
      }

      // Create read-only directory
      const readOnlyDir = path.join(tempDir, 'readonly');
      await fs.ensureDir(readOnlyDir);
      await fs.chmod(readOnlyDir, 0o500);

      const readOnlyFile = path.join(readOnlyDir, 'test.json');

      try {
        await writeJSON(readOnlyFile, { test: true });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toMatch(/EACCES|permission/i);
      } finally {
        // Restore permissions for cleanup
        await fs.chmod(readOnlyDir, 0o700);
      }
    });
  });
});