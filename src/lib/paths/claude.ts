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

/**
 * Get the path to a project's Claude Code settings file.
 *
 * 全局项目 (~/.claude) 读写 settings.json
 * 其他项目读写 settings.local.json
 *
 * @param projectPath - Root path of the project
 * @returns Path to the appropriate settings file
 */
export function getProjectConfigPath(projectPath: string): string {
  const homeClaude = path.join(os.homedir(), '.claude');
  if (path.resolve(projectPath) === homeClaude) {
    return path.join(homeClaude, 'settings.json');
  }
  return path.join(projectPath, '.claude', 'settings.local.json');
}