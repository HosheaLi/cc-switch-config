/**
 * Choice Formatting Helpers
 *
 * Utilities for formatting prompt choices with consistent styling.
 * Per UI-01~06: 使用统一主题模块 (picocolors) 替代 chalk。
 */

import os from 'os';
import type { Choice } from 'prompts';
import { colors } from '../../theme/index.js';
import path from 'path';

const HOME_CLAUDE = path.join(os.homedir(), '.claude');

/**
 * Format a project choice with name and config status.
 *
 * @param project - Project entry
 * @returns Formatted Choice object
 */
export function formatProjectChoice(project: { name: string; path: string; activeConfig?: string | null }): Choice {
  const displayName = project.name || path.basename(project.path);
  const isGlobal = project.path === HOME_CLAUDE;
  const nameLabel = isGlobal
    ? `${displayName} (全局)`
    : displayName;
  const configStatus = project.activeConfig
    ? colors.success(`[${project.activeConfig}]`)
    : colors.muted('[未配置]');
  const descPath = isGlobal ? '~/.claude' : project.path;

  return {
    title: `${nameLabel} ${configStatus}`,
    value: project.path,
    description: descPath,
  };
}

/**
 * Format a template/API config choice with name and optional description.
 *
 * @param name - Template/config name
 * @param description - Optional description
 * @returns Formatted Choice object
 */
export function formatTemplateChoice(name: string, description?: string): Choice {
  return {
    title: name,
    value: name,
    description: description ?? '',
  };
}

/**
 * Format a directory choice with path and optional label.
 *
 * @param dirPath - Directory path
 * @param label - Optional label
 * @returns Formatted Choice object
 */
export function formatDirectoryChoice(dirPath: string, label?: string): Choice {
  const displayLabel = label || path.basename(dirPath);
  return {
    title: `${displayLabel} (${dirPath})`,
    value: dirPath,
  };
}

/**
 * Format choices for a simple list of strings.
 *
 * @param items - List of string items
 * @returns Array of Choice objects
 */
export function formatStringChoices(items: string[]): Choice[] {
  return items.map(item => ({
    title: item,
    value: item,
  }));
}

/**
 * Add a "Cancel" option at the end of choices.
 *
 * @param choices - Existing choices
 * @returns Choices with Cancel option appended
 */
export function addCancelOption(choices: Choice[]): Choice[] {
  return [
    ...choices,
    {
      title: colors.danger('取消'),
      value: '__cancel__',
      description: '返回上一级或退出',
    },
  ];
}

/**
 * Check if user selected the cancel option.
 *
 * @param value - Selected value
 * @returns true if value is the cancel sentinel
 */
export function isCancelSelection(value: string): boolean {
  return value === '__cancel__';
}