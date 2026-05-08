/**
 * Select API Config Component
 *
 * Per D-03: SelectApiConfig prompts user to choose API configuration.
 * Per TUI-04: Autocomplete for >5 configs, select for <=5.
 * Per TUI-05: Ctrl+C returns null (cancellation).
 * Per CFG-04: API key NOT shown in description (modelName @ baseUrl only).
 */

import { colors } from '../../theme/index.js';
import type { Choice } from 'prompts';
import type { PromptObject } from 'prompts';
import { getPromptType, createFuzzySuggest } from '../utils/autocomplete.js';
import { promptWithCancel } from '../utils/handle-cancel.js';
import type { ApiConfig } from '../../../lib/types/api-config.js';

/**
 * 扩展 prompts 配置接口支持 autocomplete suggest。
 *
 * 用于类型安全的 autocomplete prompt 配置。
 */
interface AutocompletePromptConfig extends PromptObject {
  suggest?: (input: string, choices: Choice[]) => Promise<Choice[]>;
}

/**
 * Select an API configuration from available configs.
 *
 * Per D-03: Interactive selection triggered when config argument omitted.
 * Per CFG-04: Description shows modelName and baseUrl only (NO API key).
 *
 * @param configs - Record of config name to ApiConfig
 * @param message - Optional custom message for the prompt
 * @returns Selected config name, or null if cancelled/empty
 */
export async function selectApiConfig(
  configs: Record<string, ApiConfig>,
  message: string = '选择 API 配置'
): Promise<string | null> {
  const names = Object.keys(configs);

  // Empty configs handling
  if (names.length === 0) {
    console.log(colors.warning('没有可用配置。'));
    console.log(colors.muted('先创建配置: cc-config config add'));
    return null;
  }

  // Build choices array - CFG-04: NO API key in description
  const choices: Choice[] = names.map(name => {
    const config = configs[name];
    // Format: modelName @ baseUrl (NO API key)
    const displayModel = config.mode === 'granular' ? 'granular' : config.modelName ?? 'granular';
    const description = `${displayModel} @ ${config.baseUrl}`;

    return {
      title: name,
      value: name,
      description,
    };
  });

  // Determine prompt type based on count (TUI-04)
  const promptType = getPromptType(names.length);

  const promptConfig = {
    type: promptType,
    name: 'config',
    message,
    choices,
    initial: 0,
  };

  // Add fuzzy suggest for autocomplete mode
  if (promptType === 'autocomplete') {
    (promptConfig as AutocompletePromptConfig).suggest = createFuzzySuggest(choices);
  }

  // Execute prompt with cancellation support (TUI-05)
  const result = await promptWithCancel<string>(promptConfig);

  return result.value;
}