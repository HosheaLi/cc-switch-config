/**
 * UndoService Tests
 *
 * Tests undo service wrapper for backup system.
 * Per D-06: Single undo - restore most recent backup.
 * Per U2: Undo support for config modifications.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';
import { UndoService } from './undo-service.js';
import { ServiceError } from './types.js';
import * as backupModule from '../file-system/backup.js';

// Mock backup module
vi.mock('../file-system/backup.js', () => ({
  getLatestBackup: vi.fn(),
  restoreBackup: vi.fn(),
  listBackups: vi.fn(),
  extractTimestamp: vi.fn((backupPath: string) => {
    const basename = path.basename(backupPath);
    const match = basename.match(/\.(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)$/);
    return match ? match[1] : '';
  }),
}));

describe('UndoService', () => {
  let undoService: UndoService;
  let mockGetLatestBackup: ReturnType<typeof vi.spyOn>;
  let mockRestoreBackup: ReturnType<typeof vi.spyOn>;

  const mockGetProjectConfigPath = vi.fn((projectPath: string) =>
    `${projectPath}/.claude/settings.local.json`
  );

  beforeEach(() => {
    vi.clearAllMocks();
    undoService = new UndoService(mockGetProjectConfigPath);

    mockGetLatestBackup = vi.spyOn(backupModule, 'getLatestBackup');
    mockRestoreBackup = vi.spyOn(backupModule, 'restoreBackup');
  });

  describe('undo', () => {
    it('Test 1: UndoService.undo() calls getLatestBackup and restoreBackup', async () => {
      // Setup: Mock successful backup
      mockGetLatestBackup.mockResolvedValue('/path/to/.backups/settings.json.2026-04-15T10-30-00-123Z');
      mockRestoreBackup.mockResolvedValue(undefined);

      // Execute
      const result = await undoService.undo('/path/to/project');

      // Verify
      expect(mockGetLatestBackup).toHaveBeenCalledWith('/path/to/project/.claude/settings.local.json');
      expect(mockRestoreBackup).toHaveBeenCalledWith(
        '/path/to/project/.claude/settings.local.json',
        '/path/to/.backups/settings.json.2026-04-15T10-30-00-123Z'
      );
      expect(result.restored).toBe(true);
    });

    it('Test 2: UndoService.undo() throws ServiceError when no backup available', async () => {
      // Setup: Mock no backup
      mockGetLatestBackup.mockResolvedValue(null);

      // Execute and verify
      await expect(undoService.undo('/path/to/project')).rejects.toThrow(ServiceError);

      // Verify error details
      try {
        await undoService.undo('/path/to/project');
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceError);
        expect((error as ServiceError).code).toBe('NO_BACKUP');
        expect((error as ServiceError).message).toContain('No backup available');
      }

      // Verify restoreBackup was not called
      expect(mockRestoreBackup).not.toHaveBeenCalled();
    });

    it('Test 3: UndoService.undo() returns backup timestamp and restored status', async () => {
      // Setup: Mock backup with specific timestamp
      const backupPath = '/path/to/.backups/settings.json.2026-04-15T10-30-00-123Z';
      mockGetLatestBackup.mockResolvedValue(backupPath);
      mockRestoreBackup.mockResolvedValue(undefined);

      // Execute
      const result = await undoService.undo('/path/to/project');

      // Verify result structure
      expect(result).toHaveProperty('backupTime');
      expect(result).toHaveProperty('backupFilename');
      expect(result).toHaveProperty('restored');
      expect(result.restored).toBe(true);
      expect(result.backupFilename).toBe('settings.json.2026-04-15T10-30-00-123Z');

      // Verify timestamp is a Date
      expect(result.backupTime).toBeInstanceOf(Date);
    });

    it('handles restoreBackup failure', async () => {
      // Setup: Mock backup exists but restore fails
      mockGetLatestBackup.mockResolvedValue('/path/to/.backups/settings.json.2026-04-15T10-30-00-123Z');
      mockRestoreBackup.mockRejectedValue(new Error('Restore failed'));

      // Execute and verify
      await expect(undoService.undo('/path/to/project')).rejects.toThrow('Restore failed');
    });

    it('extracts timestamp from backup filename correctly', async () => {
      // Setup: Mock backup with specific timestamp (UTC)
      const backupPath = '/path/to/.backups/settings.json.2026-04-15T14-45-30-456Z';
      mockGetLatestBackup.mockResolvedValue(backupPath);
      mockRestoreBackup.mockResolvedValue(undefined);

      // Execute
      const result = await undoService.undo('/path/to/project');

      // Verify timestamp matches filename (use UTC methods since backup is in UTC)
      // Format: YYYY-MM-DDTHH-mm-ss-msZ -> Date in UTC
      expect(result.backupTime.getUTCFullYear()).toBe(2026);
      expect(result.backupTime.getUTCMonth()).toBe(3); // April (0-indexed)
      expect(result.backupTime.getUTCDate()).toBe(15);
      expect(result.backupTime.getUTCHours()).toBe(14);
      expect(result.backupTime.getUTCMinutes()).toBe(45);
      expect(result.backupTime.getUTCSeconds()).toBe(30);
    });
  });

  describe('constructor', () => {
    it('accepts getProjectConfigPath function', () => {
      const customPathFn = vi.fn((path: string) => `${path}/custom.json`);
      const service = new UndoService(customPathFn);
      expect(service).toBeDefined();
    });

    it('uses injected path function for config lookup', async () => {
      mockGetLatestBackup.mockResolvedValue('/backup/path');
      mockRestoreBackup.mockResolvedValue(undefined);

      await undoService.undo('/custom/project');

      // Verify the injected function was called
      expect(mockGetProjectConfigPath).toHaveBeenCalledWith('/custom/project');
    });
  });
});