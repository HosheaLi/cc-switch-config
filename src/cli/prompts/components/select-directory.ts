/**
 * Select Directory Component - ONB-05
 *
 * Directory selection for scan operations.
 */

import path from 'path';
import fs from 'fs';
import os from 'os';
import type { Choice } from 'prompts';
import { promptWithCancel } from '../utils/handle-cancel.js';
import { formatDirectoryChoice, addCancelOption, isCancelSelection } from '../utils/format-choices.js';
import { colors } from '../../theme/index.js';

/**
 * Select a scan directory from a list of options.
 *
 * @param directories - List of directory paths
 * @param message - Optional custom message
 * @param allowCustom - Allow custom directory input
 * @returns Selected directory path, or null if cancelled
 */
export async function selectDirectory(
  directories: string[],
  message: string = '选择扫描目录',
  allowCustom: boolean = true
): Promise<string | null> {
  if (directories.length === 0 && !allowCustom) {
    console.log(colors.warning('没有可用的扫描目录。'));
    return null;
  }

  let choices: Choice[] = directories.map(dir => formatDirectoryChoice(dir));

  if (allowCustom) {
    choices.push({
      title: colors.accent('自定义目录...'),
      value: '__custom__',
      description: '输入自定义路径',
    });
  }

  choices = addCancelOption(choices);

  const result = await promptWithCancel<string>({
    type: 'select',
    name: 'directory',
    message,
    choices,
    initial: 0,
  });

  const selected = result.value;

  // Check if cancelled or cancel option selected
  if (!selected || isCancelSelection(selected)) {
    return null;
  }

  // Handle custom directory input
  if (selected === '__custom__') {
    return inputCustomDirectory();
  }

  return selected;
}

/**
 * Input a custom directory path.
 *
 * @param message - Optional custom message
 * @returns Directory path, or null if cancelled
 */
export async function inputCustomDirectory(
  message: string = '输入目录路径'
): Promise<string | null> {
  const result = await promptWithCancel<string>({
    type: 'text',
    name: 'directory',
    message,
    initial: process.cwd(),
    validate: (value: string) => {
      if (!value || value.trim().length === 0) {
        return '路径不能为空';
      }
      const trimmed = value.trim();

      // Expand ~ before validation
      let expandedPath = trimmed;
      if (trimmed.startsWith('~')) {
        expandedPath = path.join(os.homedir(), trimmed.slice(1));
      }

      try {
        const resolved = path.resolve(expandedPath);
        if (!fs.existsSync(resolved)) {
          return `目录不存在: ${resolved}`;
        }
        if (!fs.statSync(resolved).isDirectory()) {
          return `不是目录: ${resolved}`;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return `无效路径: ${message}`;
      }
      return true;
    },
  });

  return result.value?.trim() ?? null;
}

/**
 * Select multiple directories for batch scan.
 *
 * @param directories - List of available directories
 * @param message - Optional custom message
 * @returns Array of selected paths, or null if cancelled
 */
export async function selectMultipleDirectories(
  directories: string[],
  message: string = '选择要扫描的目录'
): Promise<string[] | null> {
  if (directories.length === 0) {
    console.log(colors.warning('没有可用的目录。'));
    return null;
  }

  const choices: Choice[] = directories.map(dir => formatDirectoryChoice(dir));

  const result = await promptWithCancel<string[]>({
    type: 'multiselect',
    name: 'directories',
    message,
    choices,
    initial: 0,
    instructions: false,
  });

  return result.value ?? null;
}

/**
 * Quick select for common scan directories.
 *
 * @returns Selected directory, or null if cancelled
 */
export async function quickSelectScanDirectory(): Promise<string | null> {
  const commonDirs = [
    process.cwd(),
    process.env.HOME || '~',
  ];

  // Filter to existing directories
  const validDirs = commonDirs.filter(dir => {
    try {
      return fs.existsSync(dir);
    } catch {
      return false;
    }
  });

  return selectDirectory(validDirs, '扫描目录', true);
}