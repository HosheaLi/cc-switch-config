/**
 * Input API Key Component - SEC-01, SEC-04
 *
 * Per SEC-01: API key never exposed in CLI args, logs
 * Per SEC-04: 'password' type input for API key (auto-clear)
 */

import prompts from 'prompts';
import { promptWithCancel } from '../utils/handle-cancel.js';
import { colors, formatters, separator } from '../../theme/index.js';

/**
 * Input API key with password masking.
 *
 * @param message - Optional custom message
 * @returns API key string, or null if cancelled
 */
export async function inputApiKey(
  message: string = '输入 API Key'
): Promise<string | null> {
  const result = await promptWithCancel<string>({
    type: 'password',
    name: 'apiKey',
    message,
    validate: (value: string) => {
      if (!value || value.trim().length === 0) {
        return 'API Key 不能为空';
      }
      if (value.length < 10) {
        return 'API Key 长度不足';
      }
      return true;
    },
  });

  return result.value;
}

/**
 * Input API config name with validation.
 *
 * @param message - Optional custom message
 * @param existingNames - Existing config names to avoid duplicates
 * @returns Config name, or null if cancelled
 */
export async function inputConfigName(
  message: string = '配置名称',
  existingNames: string[] = []
): Promise<string | null> {
  const result = await promptWithCancel<string>({
    type: 'text',
    name: 'configName',
    message,
    initial: 'anthropic',
    validate: (value: string) => {
      if (!value || value.trim().length === 0) {
        return '名称不能为空';
      }
      const trimmed = value.trim();
      if (existingNames.includes(trimmed)) {
        return `名称 "${trimmed}" 已存在`;
      }
      // 放宽验证：允许中文、字母、数字、下划线、连字符、空格
      if (!/^[\w一-龥\-\s]+$/.test(trimmed)) {
        return '名称包含无效字符';
      }
      if (trimmed.length > 50) {
        return '名称过长（最多50字符）';
      }
      return true;
    },
  });

  return result.value?.trim() ?? null;
}

/**
 * Input base URL with default value.
 *
 * @param message - Optional custom message
 * @returns Base URL, or null if cancelled
 */
export async function inputBaseUrl(
  message: string = 'API Base URL'
): Promise<string | null> {
  const result = await promptWithCancel<string>({
    type: 'text',
    name: 'baseUrl',
    message,
    initial: 'https://api.anthropic.com',
    validate: (value: string) => {
      if (!value || value.trim().length === 0) {
        return 'URL 不能为空';
      }
      try {
        new URL(value);
        return true;
      } catch {
        return '无效的 URL 格式';
      }
    },
  });

  return result.value?.trim() ?? null;
}

/**
 * Input model name with default value.
 *
 * @param message - Optional custom message
 * @returns Model name, or null if cancelled
 */
export async function inputModelName(
  message: string = '模型名称'
): Promise<string | null> {
  const result = await promptWithCancel<string>({
    type: 'text',
    name: 'modelName',
    message,
    initial: 'claude-sonnet-4-6',
  });

  return result.value?.trim() ?? null;
}

/**
 * Input full API config in one flow.
 *
 * @returns Complete API config object, or null if cancelled
 */
export async function inputFullApiConfig(): Promise<{
  name: string;
  apiKey: string;
  baseUrl: string;
  modelName: string;
} | null> {
  console.log(colors.accent('\n创建 API 配置'));
  console.log(separator(40));

  const name = await inputConfigName('配置名称');
  if (!name) return null;

  const apiKey = await inputApiKey('API Key (已隐藏)');
  if (!apiKey) return null;

  const baseUrl = await inputBaseUrl('API Base URL');
  if (!baseUrl) return null;

  const modelName = await inputModelName('模型名称');
  if (!modelName) return null;

  console.log(separator(40));
  console.log(formatters.success(`配置 "${name}" 创建完成`));

  return { name, apiKey, baseUrl, modelName };
}