/**
 * Backup System for Configuration Files
 *
 * Creates timestamped backups before every modification, enabling users to
 * recover from mistakes or corrupted configurations.
 *
 * Key features:
 * - Automatic .backups directory creation
 * - Timestamped backup filenames (ISO format)
 * - Atomic restore operations (temp file + rename)
 * - Sorted backup listing (newest first)
 */

import fs from 'fs-extra';
import path from 'path';
import { exists } from './json.js';

/**
 * Create a timestamped backup of a file.
 *
 * Creates a backup in .backups directory with format:
 * {basename}.{YYYY-MM-DDTHH-mm-ss}
 *
 * @param filepath - Path to the file to backup
 * @returns Path to the backup file, or null if file doesn't exist
 * @throws Error if backup creation fails
 */
export async function createBackup(filepath: string): Promise<string | null> {
  // Check if file exists first
  const fileExists = await exists(filepath);
  if (!fileExists) {
    return null;
  }

  // Create backup directory
  const dir = path.dirname(filepath);
  const backupDir = path.join(dir, '.backups');
  await fs.ensureDir(backupDir);

  // Generate timestamp (ISO format with special chars replaced)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // Create backup filename and path
  const basename = path.basename(filepath);
  const backupFilename = `${basename}.${timestamp}`;
  const backupPath = path.join(backupDir, backupFilename);

  // Copy file to backup location
  await fs.copy(filepath, backupPath);

  return backupPath;
}

/**
 * List all backups for a file, sorted newest first.
 *
 * @param filepath - Original file path
 * @returns Array of backup paths, sorted newest first
 */
export async function listBackups(filepath: string): Promise<string[]> {
  const dir = path.dirname(filepath);
  const backupDir = path.join(dir, '.backups');
  const basename = path.basename(filepath);

  // Check if backup directory exists
  const backupDirExists = await fs.pathExists(backupDir);
  if (!backupDirExists) {
    return [];
  }

  // List all files matching pattern: {basename}.*
  const files = await fs.readdir(backupDir);
  // Pattern: {basename}.{YYYY-MM-DDTHH-mm-ss-msZ} (ISO format with special chars replaced)
  const backupPattern = new RegExp(`^${escapeRegex(basename)}\\.\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}-\\d{3}Z$`);

  const backups = files
    .filter(file => backupPattern.test(file))
    .map(file => path.join(backupDir, file))
    .sort((a, b) => {
      // Sort by timestamp (newest first)
      // Timestamp is at the end of filename after last dot
      const timestampA = extractTimestamp(a);
      const timestampB = extractTimestamp(b);
      return timestampB.localeCompare(timestampA);
    });

  return backups;
}

/**
 * Restore a file from a backup.
 *
 * Uses atomic write pattern (temp file + rename) to prevent corruption.
 *
 * @param filepath - Target file path to restore to
 * @param backupPath - Path to the backup file
 * @throws Error if backup file doesn't exist or restore fails
 */
export async function restoreBackup(filepath: string, backupPath: string): Promise<void> {
  // Verify backup exists
  const backupExists = await exists(backupPath);
  if (!backupExists) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }

  // Use atomic write pattern: copy to temp, then rename
  const tempPath = `${filepath}.tmp.${process.pid}`;

  try {
    // Copy backup to temp file
    await fs.copy(backupPath, tempPath);

    // Verify copy integrity before rename
    const backupStat = await fs.stat(backupPath);
    const tempStat = await fs.stat(tempPath);
    if (backupStat.size !== tempStat.size) {
      throw new Error(`Backup restore integrity check failed: size mismatch (${backupStat.size} vs ${tempStat.size})`);
    }

    // Atomic rename (on POSIX systems)
    await fs.rename(tempPath, filepath);
  } catch (error) {
    // Clean up temp file on error
    try {
      await fs.remove(tempPath);
    } catch {
      // Ignore cleanup errors - original error is more important
    }
    throw error;
  }
}

/**
 * Get the most recent backup for a file.
 *
 * @param filepath - Original file path
 * @returns Path to the latest backup, or null if no backups exist
 */
export async function getLatestBackup(filepath: string): Promise<string | null> {
  const backups = await listBackups(filepath);
  return backups.length > 0 ? backups[0] : null;
}

/**
 * Escape special regex characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract timestamp from backup filename.
 * Format: {basename}.{YYYY-MM-DDTHH-mm-ss-msZ} (ISO format with special chars replaced)
 */
export function extractTimestamp(backupPath: string): string {
  const basename = path.basename(backupPath);
  // Find the timestamp pattern at the end (including milliseconds and Z)
  const match = basename.match(/\.(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)$/);
  return match ? match[1] : '';
}