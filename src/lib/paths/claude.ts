/**
 * Claude Code Settings Paths
 *
 * Provides paths to Claude Code configuration directories.
 * Claude Code stores settings in ~/.claude/ directory.
 */

import path from 'path';
import os from 'os';

/**
 * Get the path to Claude Code settings directory.
 * This is the ~/.claude directory where Claude Code stores its configuration.
 */
export function getClaudeSettingsPath(): string {
  return path.join(os.homedir(), '.claude');
}

/**
 * Get the path to Claude Code settings.json file.
 */
export function getClaudeSettingsFilePath(): string {
  return path.join(getClaudeSettingsPath(), 'settings.json');
}

/**
 * Get the path to Claude Code local settings file.
 * settings.local.json is for secrets that shouldn't be tracked in git.
 */
export function getClaudeLocalSettingsFilePath(): string {
  return path.join(getClaudeSettingsPath(), 'settings.local.json');
}