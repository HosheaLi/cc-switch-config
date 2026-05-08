/**
 * Select Template/API Config Component - TUI-01, TUI-04
 *
 * Per D-04: Autocomplete for large template lists
 */

import prompts from 'prompts';
import type { Choice } from 'prompts';
import { getPromptType, createFuzzySuggest } from '../utils/autocomplete.js';
import { promptWithCancel, defaultOnCancel } from '../utils/handle-cancel.js';
import { formatTemplateChoice, addCancelOption, isCancelSelection } from '../utils/format-choices.js';
import { colors } from '../../theme/index.js';

/**
 * Template/API config metadata
 */
interface TemplateInfo {
  name: string;
  description?: string;
  provider?: string;
}

/**
 * Select a template/API config from a list.
 *
 * @param templates - List of template names or TemplateInfo objects
 * @param message - Optional custom message
 * @param allowCancel - Add cancel option at the end
 * @returns Selected template name, or null if cancelled
 */
export async function selectTemplate(
  templates: string[] | TemplateInfo[],
  message: string = '选择 API 配置',
  allowCancel: boolean = false
): Promise<string | null> {
  if (templates.length === 0) {
    console.log(colors.warning('没有可用配置。'));
    console.log(colors.muted('先创建配置: cc-config config add'));
    return null;
  }

  let choices: Choice[] = templates.map(t =>
    typeof t === 'string'
      ? formatTemplateChoice(t)
      : formatTemplateChoice(t.name, t.description)
  );

  if (allowCancel) {
    choices = addCancelOption(choices);
  }

  const promptType = getPromptType(templates.length);

  const config: prompts.PromptObject = {
    type: promptType,
    name: 'template',
    message,
    choices,
    initial: 0,
  };

  if (promptType === 'autocomplete') {
    config.suggest = createFuzzySuggest(choices);
  }

  const result = await promptWithCancel<string>(config);
  const selected = result.value;

  // Check if cancel option was selected
  if (selected && isCancelSelection(selected)) {
    return null;
  }

  return selected;
}

/**
 * Select a template with preview of config content.
 *
 * @param templates - List of template info with details
 * @param message - Optional custom message
 * @returns Selected template name, or null if cancelled
 */
export async function selectTemplateWithPreview(
  templates: TemplateInfo[],
  message: string = '选择配置'
): Promise<string | null> {
  if (templates.length === 0) {
    console.log('没有可用配置。');
    return null;
  }

  const choices: Choice[] = templates.map(t => ({
    title: t.name,
    value: t.name,
    description: t.provider ? `${t.provider} - ${t.description || ''}` : t.description || '',
  }));

  const promptType = getPromptType(templates.length);

  const config: prompts.PromptObject = {
    type: promptType,
    name: 'template',
    message,
    choices,
    initial: 0,
  };

  if (promptType === 'autocomplete') {
    config.suggest = createFuzzySuggest(choices);
  }

  const result = await promptWithCancel<string>(config);
  return result.value;
}

/**
 * Quick select for single template (no navigation needed).
 *
 * @param templates - List of template names
 * @returns Selected template name, or null if cancelled
 */
export async function quickSelectTemplate(
  templates: string[]
): Promise<string | null> {
  if (templates.length === 1) {
    // Auto-select if only one option
    return templates[0];
  }

  return selectTemplate(templates, '选择配置');
}