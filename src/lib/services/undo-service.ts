/**
 * UndoService - Undo Service Wrapper for Backup System
 *
 * Handles undo operations for config modifications.
 * Per D-06: Single undo - restore most recent backup.
 * Per U2: Undo support for config modifications.
 *
 * Key features:
 * - undo: Restore most recent backup for a project
 * - extractTimestamp: Parse timestamp from backup filename
 * - ServiceError with NO_BACKUP code when no backup exists
 *
 * Dependencies (constructor injected):
 * - getProjectConfigPath: Function to derive config path from project path
 */

import path from 'path';
import { ServiceError } from './types.js';
import { getLatestBackup, restoreBackup, extractTimestamp } from '../file-system/backup.js';

/**
 * Result of an undo operation.
 */
export interface UndoResult {
  /** Timestamp when backup was created */
  backupTime: Date;
  /** Backup filename (basename only) */
  backupFilename: string;
  /** Whether restore was successful */
  restored: boolean;
}

/**
 * UndoService class for managing undo operations.
 *
 * Usage:
 * ```typescript
 * const service = new UndoService((p) => `${p}/.claude/settings.local.json`);
 * const result = await service.undo('/path/to/project');
 * console.log(`Restored from ${result.backupFilename} (${result.backupTime})`);
 * ```
 */
export class UndoService {
  /**
   * Create UndoService with injected config path resolver.
   *
   * @param getProjectConfigPath - Function to derive config path from project path
   */
  constructor(
    private getProjectConfigPath: (projectPath: string) => string
  ) {}

  /**
   * Undo the last configuration modification.
   *
   * Per D-06: Single undo - restore most recent backup.
   *
   * Steps:
   * 1. Get config path using injected function
   * 2. Call getLatestBackup to find most recent backup
   * 3. Throw ServiceError if no backup available (NO_BACKUP)
   * 4. Call restoreBackup to restore the backup
   * 5. Extract timestamp from backup filename
   * 6. Return UndoResult with backup details
   *
   * @param projectPath - Path to the project directory
   * @returns UndoResult with backup time, filename, and restored status
   * @throws ServiceError with code 'NO_BACKUP' if no backup exists
   */
  async undo(projectPath: string): Promise<UndoResult> {
    // Get config path
    const configPath = this.getProjectConfigPath(projectPath);

    // Find most recent backup
    const backupPath = await getLatestBackup(configPath);

    if (!backupPath) {
      throw new ServiceError(
        'No backup available to undo',
        'NO_BACKUP',
        { projectPath, configPath }
      );
    }

    // Restore the backup
    await restoreBackup(configPath, backupPath);

    // Extract timestamp from backup filename
    const backupFilename = path.basename(backupPath);
    const backupTime = this.extractTimestamp(backupPath);

    return {
      backupTime,
      backupFilename,
      restored: true,
    };
  }

  /**
   * Extract timestamp from backup filename.
   * Delegates to shared extractTimestamp from backup module.
   *
   * Backup format: settings.json.YYYY-MM-DDTHH-mm-ss-msZ
   *
   * @param backupPath - Full path to backup file
   * @returns Date object parsed from filename timestamp
   */
  private extractTimestamp(backupPath: string): Date {
    const timestampStr = extractTimestamp(backupPath);
    if (!timestampStr) {
      return new Date();
    }

    // Convert from backup format to ISO format
    const isoStr = timestampStr
      .replace(/T(\d{2})-(\d{2})-(\d{2})/, 'T$1:$2:$3')
      .replace(/-(\d{3})Z$/, '.$1Z');

    return new Date(isoStr);
  }
}