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
 * Get the path to a project's Claude Code settings.local.json file.
 *
 * 始终写入 settings.local.json（项目级覆盖文件），CLAUDE CODE 读取时
 * settings.local.json 优先级高于 settings.json。
 * 这样可以隔离 API 配置变更与 hooks、permissions 等其他配置。
 *
 * @param projectPath - Root path of the project
 * @returns Path to settings.local.json
 */
export function getProjectConfigPath(projectPath: string): string {
  return path.join(projectPath, '.claude', 'settings.local.json');
}