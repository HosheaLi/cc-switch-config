/**
 * Select Project Component - TUI-01, TUI-04
 *
 * Per D-02: j/k + arrow keys navigation (prompts built-in)
 * Per D-04: Autocomplete for lists >20
 */

import prompts from 'prompts';
import type { Choice } from 'prompts';
import type { ProjectEntry } from '../../../lib/store/project.js';
import { getPromptType, createFuzzySuggest } from '../utils/autocomplete.js';
import { promptWithCancel, defaultOnCancel } from '../utils/handle-cancel.js';
import { formatProjectChoice } from '../utils/format-choices.js';

/**
 * Select a single project from a list.

/**
 * Select a single project from a list.
 *
 * @param projects - List of projects to select from
 * @param message - Optional custom message
 * @returns Selected project path, or null if cancelled
 */
export async function selectProject(
  projects: ProjectEntry[],
  message: string = '选择项目'
): Promise<string | null> {
  if (projects.length === 0) {
    console.log('没有已注册的项目。请先扫描并注册项目。');
    return null;
  }

  const sorted = [...projects].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
  const choices: Choice[] = sorted.map(formatProjectChoice);
  const promptType = getPromptType(projects.length);

  const config: prompts.PromptObject = {
    type: promptType,
    name: 'project',
    message,
    choices,
    initial: 0,
  };

  // Add fuzzy suggest for autocomplete
  if (promptType === 'autocomplete') {
    config.suggest = createFuzzySuggest(choices);
  }

  const result = await promptWithCancel<string>(config);
  return result.value;
}

/**
 * Select multiple projects from a list (for scan results).
 *
 * @param projects - List of projects to select from
 * @param message - Optional custom message
 * @returns Array of selected project paths, or null if cancelled
 */
export async function selectMultipleProjects(
  projects: ProjectEntry[],
  message: string = '选择要注册的项目'
): Promise<string[] | null> {
  if (projects.length === 0) {
    console.log('没有新项目。');
    return null;
  }

  const sorted = [...projects].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
  const choices: Choice[] = sorted.map(formatProjectChoice);

  const result = await prompts(
    {
      type: 'multiselect',
      name: 'projects',
      message,
      choices,
      initial: 0,
      instructions: false, // Hide instructions for cleaner UI
    },
    { onCancel: defaultOnCancel }
  );

  return result.projects ?? null;
}

/**
 * Select a project path from scan results.
 *
 * @param results - Scan results with isNew flag
 * @param message - Optional custom message
 * @returns Array of selected paths, or null if cancelled
 */
export async function selectFromScanResults(
  results: Array<{ path: string; isNew: boolean; name?: string }>,
  message: string = '选择要注册的项目'
): Promise<string[] | null> {
  const newProjects = results.filter(r => r.isNew);

  if (newProjects.length === 0) {
    console.log('没有发现新项目。');
    return null;
  }

  const sorted = [...newProjects].sort((a, b) => (a.name || a.path).localeCompare(b.name || b.path, 'zh-CN'));
  const choices: Choice[] = sorted.map(r => ({
    title: r.name || r.path.split('/').pop() || r.path,
    value: r.path,
    description: r.path,
  }));

  const result = await prompts(
    {
      type: 'multiselect',
      name: 'paths',
      message,
      choices,
      initial: 0,
      instructions: false,
    },
    { onCancel: defaultOnCancel }
  );

  return result.paths ?? null;
}