/**
 * 简化首次运行向导 - 3步替代6步
 *
 * 流程: 导入全局配置 → 创建 API 配置 → 扫描目录注册项目 → 完成提示
 */

import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import { createServices } from '../../utils/service-factory.js';
import { createSpinner } from '../../utils/spinner.js';
import { selectFromScanResults } from '../components/select-project.js';
import { selectDirectory } from '../components/select-directory.js';
import { inputFullApiConfig } from '../components/input-api-key.js';
import { colors, formatters } from '../../theme/index.js';
import { readJSON } from '../../../lib/file-system/json.js';
import type { ApiConfig } from '../../../lib/types/api-config.js';

const SEP = '━'.repeat(44);
const MODEL_KEYS = [
  'ANTHROPIC_MODEL',
  'ANTHROPIC_DEFAULT_SONNET_MODEL',
  'ANTHROPIC_DEFAULT_HAIKU_MODEL',
  'ANTHROPIC_DEFAULT_OPUS_MODEL',
  'ANTHROPIC_REASONING_MODEL',
  'CLAUDE_CODE_SUBAGENT_MODEL',
] as const;

/**
 * 从 ClaudeSettings.env 推断配置模式。
 * 所有 6 个模型变量相同则为 unified 模式，否则为 granular。
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
 * 将 ClaudeSettings.env 转换为 ApiConfig。
 */
function envToApiConfig(name: string, env: Record<string, string>): ApiConfig {
  const apiKey = env['ANTHROPIC_AUTH_TOKEN'] ?? '';
  const baseUrl = env['ANTHROPIC_BASE_URL'] ?? 'https://api.anthropic.com';
  const detected = detectMode(env);
  const modelKeysFound = MODEL_KEYS.filter(k => env[k]);

  if (detected.mode === 'unified') {
    return {
      name,
      apiKey,
      baseUrl,
      mode: 'unified',
      modelName: detected.modelName,
    };
  }

  const granularEnv: Record<string, string> = {
    ...modelKeysFound.reduce((acc, k) => { acc[k] = env[k]; return acc; }, {} as Record<string, string>),
    ANTHROPIC_AUTH_TOKEN: apiKey,
    ANTHROPIC_BASE_URL: baseUrl,
    ...Object.fromEntries(
      Object.entries(env).filter(([k]) =>
        !MODEL_KEYS.includes(k as typeof MODEL_KEYS[number]) &&
        k !== 'ANTHROPIC_AUTH_TOKEN' &&
        k !== 'ANTHROPIC_BASE_URL'
      )
    ),
  };

  return {
    name,
    apiKey,
    baseUrl,
    mode: 'granular',
    env: granularEnv,
  };
}

export async function runOnboardingWizard(): Promise<void> {
  const svc = createServices();

  try {
    console.log(colors.accent('\n╔══════════════════════════════════════════╗'));
    console.log(colors.accent('║       欢迎使用 cc-config                  ║'));
    console.log(colors.accent('╚══════════════════════════════════════════╝'));
    console.log();

    // Step 0: 导入全局配置
    console.log(colors.bold('步骤 1/4: 导入全局配置'));
    console.log(colors.muted(SEP));
    await importGlobalConfig(svc);

    // Step 1: 创建 API 配置
    console.log(colors.bold('\n步骤 2/4: 创建 API 配置'));
    console.log(colors.muted(SEP));

    const config = await inputFullApiConfig();
    if (!config) {
      console.log(colors.muted('\n已取消。下次运行 cc-config 继续设置。'));
      return;
    }

    await svc.apiService.createConfig(config.name, {
      name: config.name,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      mode: config.mode,
      modelName: config.mode === 'unified' ? config.modelName : undefined,
      env: config.mode === 'granular' ? config.env : undefined,
    });

    console.log(formatters.success(`配置 "${config.name}" 已创建`));

    // Step 2: 扫描目录注册项目
    console.log(colors.bold('\n步骤 3/4: 扫描并注册项目'));
    console.log(colors.muted(SEP));

    const directory = await selectDirectory([process.cwd()], '选择要扫描的目录', true);
    if (!directory) {
      console.log(colors.muted('\n已跳过扫描。运行 cc-config scan 随时扫描。'));
      console.log(formatters.success('设置完成！运行 cc-config 打开仪表盘。'));
      return;
    }

    const spinner = createSpinner('扫描中...');
    let results;
    try {
      results = await svc.projectService.scanProjects(undefined, [directory]);
      spinner.succeed(`扫描完成: ${results.length} 个项目`);
    } catch (error) {
      spinner.fail('扫描失败');
      throw error;
    }

    const newProjects = results.filter(r => r.isNew);
    console.log(colors.muted(`发现 ${results.length} 个项目 (${newProjects.length} 新)`));

    if (newProjects.length === 0) {
      console.log(formatters.success('所有项目都已注册。'));
    } else {
      const selectedPaths = await selectFromScanResults(newProjects, '选择要注册的项目 (空格选择, 回车确认)');
      if (selectedPaths && selectedPaths.length > 0) {
        for (const projectPath of selectedPaths) {
          await svc.projectService.registerProject(projectPath);
        }
        console.log(formatters.success(`已注册 ${selectedPaths.length} 个项目`));
      }
    }

    // Step 3: 完成
    console.log(colors.bold('\n步骤 4/4: 完成'));
    console.log(colors.muted(SEP));
    console.log(formatters.success('设置完成！'));
    console.log(colors.muted('运行 cc-config 打开仪表盘，进行配置切换。'));
    console.log(colors.muted('或直接: cc-config <配置名>  快速切换当前项目'));
    console.log();

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(formatters.error(`设置失败: ${message}`));
  }
}

/**
 * 从 ~/.claude/settings.json 读取并导入全局配置。
 * a. 将配置作为"全局API配置"加入 api-configs
 * b. 将 ~/.claude 注册为项目
 */
async function importGlobalConfig(svc: ReturnType<typeof createServices>): Promise<void> {
  const globalSettingsPath = path.join(os.homedir(), '.claude', 'settings.json');
  const claudeExists = await fs.pathExists(globalSettingsPath);
  if (!claudeExists) {
    console.log(colors.muted('未检测到全局 Claude Code 配置 (~/.claude/settings.json)，跳过。'));
    return;
  }

  const raw = await readJSON<Record<string, unknown>>(globalSettingsPath);
  if (!raw || typeof raw.env !== 'object' || raw.env === null) {
    console.log(colors.muted('全局配置中无环境变量，跳过导入。'));
    return;
  }

  const env = raw.env as Record<string, string>;

  // a. 导入为 API 配置
  const configName = '全局配置';
  const existingConfigs = await svc.apiService.getAllConfigs();
  if (!existingConfigs[configName]) {
    const apiConfig = envToApiConfig(configName, env);
    await svc.apiConfigStore.set(configName, apiConfig);
    console.log(formatters.success(`已导入全局配置 "${configName}"`));
  } else {
    console.log(colors.muted('全局配置 "${configName}" 已存在，跳过导入。'));
  }

  // b. 注册 ~/.claude 为项目
  const homeClaude = path.join(os.homedir(), '.claude');
  const existingProject = await svc.projectIndex.getByPath(homeClaude);
  if (!existingProject) {
    await svc.projectService.registerProject(homeClaude);
    console.log(formatters.success('已注册 ".claude(全局)" 项目'));
  } else {
    console.log(colors.muted('".claude(全局)" 项目已注册，跳过。'));
  }
}
