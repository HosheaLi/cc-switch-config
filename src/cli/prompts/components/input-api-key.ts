/**
 * Input API Key Component - SEC-01, SEC-04
 *
 * Per SEC-01: API key never exposed in CLI args, logs
 * Per SEC-04: 'password' type input for API key (auto-clear)
 *
 * Supports both unified mode (single model name for all 6 model vars)
 * and granular mode (individual env var input).
 */

import prompts from 'prompts';
import { promptWithCancel } from '../utils/handle-cancel.js';
import { colors, formatters, separator } from '../../theme/index.js';

/**
 * Mode selection prompt — unified vs granular.
 */
async function selectConfigMode(): Promise<'unified' | 'granular' | null> {
  const result = await promptWithCancel<'unified' | 'granular'>({
    type: 'select',
    name: 'mode',
    message: '配置模式',
    choices: [
      { title: '统一模式 (unified)', description: '一个模型名称应用于所有 6 个模型环境变量', value: 'unified' },
      { title: '独立模式 (granular)', description: '分别填写每个环境变量', value: 'granular' },
    ],
    initial: 0,
  });
  return result.value;
}

/**
 * Prompt user to input all env vars for granular mode.
 * Each key in the provided template keys is prompted.
 */
async function inputGranularEnv(): Promise<Record<string, string> | null> {
  const env: Record<string, string> = {};

  const modelKeys: { key: string; label: string; initial: string }[] = [
    { key: 'ANTHROPIC_MODEL', label: 'ANTHROPIC_MODEL (默认模型)', initial: '' },
    { key: 'ANTHROPIC_DEFAULT_SONNET_MODEL', label: 'ANTHROPIC_DEFAULT_SONNET_MODEL (Sonnet)', initial: '' },
    { key: 'ANTHROPIC_DEFAULT_HAIKU_MODEL', label: 'ANTHROPIC_DEFAULT_HAIKU_MODEL (Haiku)', initial: '' },
    { key: 'ANTHROPIC_DEFAULT_OPUS_MODEL', label: 'ANTHROPIC_DEFAULT_OPUS_MODEL (Opus)', initial: '' },
    { key: 'ANTHROPIC_REASONING_MODEL', label: 'ANTHROPIC_REASONING_MODEL (推理)', initial: '' },
    { key: 'CLAUDE_CODE_SUBAGENT_MODEL', label: 'CLAUDE_CODE_SUBAGENT_MODEL (子Agent)', initial: '' },
  ];

  console.log(colors.muted('\n--- 模型环境变量 (按需填写，留空则跳过) ---'));
  for (const entry of modelKeys) {
    const result = await promptWithCancel<string>({
      type: 'text',
      name: entry.key,
      message: entry.label,
      initial: entry.initial,
    });
    const val = result.value?.trim();
    if (val) {
      env[entry.key] = val;
    }
  }

  // apiKey and baseUrl are already captured separately
  return env;
}

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
      if (!/^[\w\p{Script=Han}\-\s]+$/u.test(trimmed)) {
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
 * Supports both unified mode (enter one model name for all 6 vars)
 * and granular mode (enter each env var individually).
 *
 * @returns Complete API config object, or null if cancelled
 */
export async function inputFullApiConfig(): Promise<{
  name: string;
  apiKey: string;
  baseUrl: string;
  mode: 'unified' | 'granular';
  modelName?: string;
  env?: Record<string, string>;
} | null> {
  console.log(colors.accent('\n创建 API 配置'));
  console.log(separator(40));

  const name = await inputConfigName('配置名称');
  if (!name) return null;

  const apiKey = await inputApiKey('API Key (已隐藏)');
  if (!apiKey) return null;

  const baseUrl = await inputBaseUrl('API Base URL');
  if (!baseUrl) return null;

  const mode = await selectConfigMode();
  if (!mode) return null;

  if (mode === 'unified') {
    // Unified mode: single model name → 6 model env vars
    const modelName = await inputModelName('模型名称');
    if (!modelName) return null;

    console.log(separator(40));
    console.log(formatters.success(`配置 "${name}" 创建完成 (统一模式)`));

    return { name, apiKey, baseUrl, mode: 'unified', modelName };
  } else {
    // Granular mode: user fills individual env vars
    const modelKeys = await inputGranularEnv();
    if (!modelKeys) return null;

    const env: Record<string, string> = {
      ...modelKeys,
      ANTHROPIC_AUTH_TOKEN: apiKey,
      ANTHROPIC_BASE_URL: baseUrl,
    };

    console.log(separator(40));
    const varCount = Object.keys(modelKeys).length;
    console.log(formatters.success(`配置 "${name}" 创建完成 (独立模式, ${varCount} 个模型变量)`));

    return { name, apiKey, baseUrl, mode: 'granular', env };
  }
}