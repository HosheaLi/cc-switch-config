/**
 * Import API Config Component
 *
 * Parses a pasted JSON env object (from .claude/settings.json env block)
 * and creates an API config entry.
 *
 * Supports both unified mode (all 6 model vars are the same value)
 * and granular mode (different values per var).
 */

import prompts from 'prompts';
import { promptWithCancel } from '../utils/handle-cancel.js';
import { colors, formatters, separator } from '../../theme/index.js';
import { inputConfigName } from './input-api-key.js';
import { maskApiKey } from '../../../lib/security/api-key.js';

/**
 * The 6 model environment variable keys.
 */
const MODEL_KEYS = [
  'ANTHROPIC_MODEL',
  'ANTHROPIC_DEFAULT_SONNET_MODEL',
  'ANTHROPIC_DEFAULT_HAIKU_MODEL',
  'ANTHROPIC_DEFAULT_OPUS_MODEL',
  'ANTHROPIC_REASONING_MODEL',
  'CLAUDE_CODE_SUBAGENT_MODEL',
] as const;

/**
 * Parse raw JSON text into env record.
 *
 * Accepts two formats:
 * - {"env": {"ANTHROPIC_MODEL": "...", ...}}
 * - {"ANTHROPIC_MODEL": "...", ...}  (bare env object)
 *
 * @param raw - Raw JSON string from user input
 * @returns Parsed env record
 * @throws Error with descriptive Chinese message on parse failure
 */
function parseEnvJson(raw: string): Record<string, string> {
  // Try to fix common paste formats:
  // 1. '"env": {...}' or '"env":{...}' — wrap in {}
  // 2. '{\n  "env": {\n    ...\n  }\n}' — already valid, parse directly
  // 3. '{\n  "ANTHROPIC_MODEL": ...\n}' — already valid, parse directly
  let cleaned = raw.trim();

  // If it doesn't start with '{', it might be a bare "env": { ... } fragment
  if (!cleaned.startsWith('{')) {
    // Strip leading "env": or 'env':
    cleaned = cleaned.replace(/^['"]?env['"]?\s*:\s*/, '');
  }

  // If still not wrapped in {}, try wrapping
  if (!cleaned.startsWith('{')) {
    cleaned = '{' + cleaned + '}';
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('JSON 格式无效，请检查括号和引号是否正确');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('JSON 内容必须是一个对象');
  }

  // Support {"env": {...}} wrapping
  const asRecord = parsed as Record<string, unknown>;
  if ('env' in asRecord && typeof asRecord.env === 'object' && asRecord.env !== null && !Array.isArray(asRecord.env)) {
    return asRecord.env as Record<string, string>;
  }

  return asRecord as Record<string, string>;
}

/**
 * Detect if env values represent unified mode.
 * Unified: all 6 model keys present and identical.
 */
function detectMode(env: Record<string, string>): {
  mode: 'unified' | 'granular';
  modelName?: string;
} {
  const values = MODEL_KEYS.map(k => env[k]).filter(v => v !== undefined);

  if (values.length === MODEL_KEYS.length && values.every(v => v === values[0])) {
    return { mode: 'unified', modelName: values[0] };
  }

  return { mode: 'granular' };
}

/**
 * Import API config from pasted JSON env.
 *
 * @param existingNames - Existing config names for duplicate detection
 * @returns Config object (same shape as inputFullApiConfig), or null if cancelled
 */
export async function inputImportApiConfig(
  existingNames: string[] = []
): Promise<{
  name: string;
  apiKey: string;
  baseUrl: string;
  mode: 'unified' | 'granular';
  modelName?: string;
  env?: Record<string, string>;
} | null> {
  console.log(colors.accent('\n导入 API 配置'));
  console.log(separator(40));
  console.log(colors.muted('粘贴 .claude/settings.json 中的 env 配置 JSON'));
  console.log(colors.muted('示例: {"env":{"ANTHROPIC_MODEL":"...","ANTHROPIC_AUTH_TOKEN":"sk-...",...}}'));
  console.log();

  // Step 1: Read JSON input (multiline support)
  // Reads all lines until an empty line (double Enter) signals completion
  console.log(colors.muted('粘贴 env 配置 JSON（粘贴后按两次回车提交）'));
  console.log(colors.muted('支持 {"env":{...}} 或直接 {"ANTHROPIC_MODEL": "..."} 格式'));
  console.log();
  const { createInterface } = await import('readline');
  const lines: string[] = [];
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });
  if (process.stdin.isPaused()) process.stdin.resume();
  for await (const line of rl) {
    if (line.trim() === '' && lines.length > 0) {
      rl.close();
      break;
    }
    lines.push(line);
  }
  const jsonStr = lines.join('\n').trim();
  if (!jsonStr) {
    console.log(formatters.error('输入为空'));
    return null;
  }

  // Step 2: Parse JSON
  let env: Record<string, string>;
  try {
    env = parseEnvJson(jsonStr);
  } catch (err) {
    console.log(formatters.error(`解析失败: ${err instanceof Error ? err.message : String(err)}`));
    return null;
  }

  // Step 3: Validate required fields
  const apiKey = env['ANTHROPIC_AUTH_TOKEN'];
  if (!apiKey) {
    console.log(formatters.error('缺少 ANTHROPIC_AUTH_TOKEN（API Key）'));
    return null;
  }

  const baseUrl = env['ANTHROPIC_BASE_URL'] || 'https://api.anthropic.com';

  // Step 4: Detect mode
  const detected = detectMode(env);
  const modelKeysFound = MODEL_KEYS.filter(k => env[k]);

  if (modelKeysFound.length === 0) {
    console.log(formatters.error('未找到任何模型环境变量（ANTHROPIC_MODEL 等）'));
    return null;
  }

  // Step 5: Show preview
  console.log(separator(40));
  console.log(colors.bold('解析结果:'));
  console.log(colors.muted(`  API Key:  ${maskApiKey(apiKey)}`));
  console.log(colors.muted(`  Base URL: ${baseUrl}`));
  console.log(colors.muted(`  模式:     ${detected.mode === 'unified' ? '统一模式 (unified)' : '独立模式 (granular)'}`));
  if (detected.mode === 'unified') {
    console.log(colors.muted(`  模型:     ${detected.modelName}`));
  } else {
    console.log(colors.muted(`  模型变量: ${modelKeysFound.length} / ${MODEL_KEYS.length} 个`));
  }
  console.log(separator(40));

  // Step 6: Prompt for config name
  const name = await inputConfigName('配置名称', existingNames);
  if (!name) return null;

  if (detected.mode === 'unified') {
    const varCount = MODEL_KEYS.length;
    console.log(formatters.success(`配置 "${name}" 创建完成 (统一模式, ${varCount} 个模型变量)`));
    return { name, apiKey, baseUrl, mode: 'unified', modelName: detected.modelName };
  }

  // Granular mode: build env with all vars including auth_token and base_url
  const granularEnv: Record<string, string> = {
    ...modelKeysFound.reduce((acc, k) => { acc[k] = env[k]; return acc; }, {} as Record<string, string>),
    ANTHROPIC_AUTH_TOKEN: apiKey,
    ANTHROPIC_BASE_URL: baseUrl,
    // Preserve any extra env vars not in the standard set
    ...Object.fromEntries(
      Object.entries(env).filter(([k]) =>
        !MODEL_KEYS.includes(k as typeof MODEL_KEYS[number]) &&
        k !== 'ANTHROPIC_AUTH_TOKEN' &&
        k !== 'ANTHROPIC_BASE_URL'
      )
    ),
  };

  console.log(formatters.success(`配置 "${name}" 创建完成 (独立模式, ${modelKeysFound.length} 个模型变量)`));
  return { name, apiKey, baseUrl, mode: 'granular', env: granularEnv };
}
