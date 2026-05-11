/**
 * Edit Project Component
 *
 * Prompts user to modify project name and optionally path.
 */

import prompts from 'prompts';
import { promptWithCancel } from '../utils/handle-cancel.js';
import { colors, formatters, separator } from '../../theme/index.js';
import { confirmAction } from './confirm-action.js';
import type { ProjectEntry } from '../../../lib/store/project.js';

/**
 * Edit project details.
 *
 * Allows user to modify:
 * - name (text input)
 * - path (optional, directory selection via text input)
 *
 * @param existing - Current ProjectEntry
 * @param allProjects - All projects for duplicate path/name checks
 * @returns Updated fields, or null if cancelled
 */
export async function inputEditProject(
  existing: ProjectEntry,
  allProjects: ProjectEntry[]
): Promise<{ name: string; path: string } | null> {
  console.log(colors.accent('\n编辑项目'));
  console.log(separator(40));
  console.log(colors.muted(`  当前名称: ${existing.name}`));
  console.log(colors.muted(`  当前路径: ${existing.path}`));

  const otherProjects = allProjects.filter(p => p.id !== existing.id);

  // Edit name
  const nameResult = await promptWithCancel<string>({
    type: 'text',
    name: 'name',
    message: '项目名称',
    initial: existing.name,
    validate: (value: string) => {
      if (!value || value.trim().length === 0) {
        return '名称不能为空';
      }
      const trimmed = value.trim();
      if (otherProjects.some(p => p.name === trimmed)) {
        return `名称 "${trimmed}" 已被其他项目使用`;
      }
      if (trimmed.length > 100) {
        return '名称过长（最多100字符）';
      }
      return true;
    },
  });

  if (nameResult.cancelled || !nameResult.value) return null;
  const newName = nameResult.value.trim();

  // Edit path (optional)
  const changePath = await confirmAction('修改项目路径？', false);
  let newPath = existing.path;

  if (changePath) {
    const pathResult = await promptWithCancel<string>({
      type: 'text',
      name: 'path',
      message: '项目路径',
      initial: existing.path,
      validate: (value: string) => {
        if (!value || value.trim().length === 0) {
          return '路径不能为空';
        }
        const trimmed = value.trim();
        if (otherProjects.some(p => p.path === trimmed)) {
          return `路径 "${trimmed}" 已被其他项目注册`;
        }
        return true;
      },
    });

    if (pathResult.cancelled || !pathResult.value) return null;
    newPath = pathResult.value.trim();
  }

  console.log(separator(40));
  console.log(formatters.success('修改确认:'));
  console.log(colors.muted(`  名称: ${existing.name} → ${newName}`));
  if (newPath !== existing.path) {
    console.log(colors.muted(`  路径: ${existing.path} → ${newPath}`));
  } else {
    console.log(colors.muted(`  路径: ${newPath}（不变）`));
  }
  console.log(separator(40));

  return { name: newName, path: newPath };
}
