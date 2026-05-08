/**
 * Config Wizard - API config CRUD operations
 *
 * Per CFG-03: Manage API configs via CLI
 */

import { ApiService } from '../../../lib/services/index.js';
import { ApiConfigStore, readConfig, writeConfig } from '../../../lib/store/index.js';
import { selectTemplate } from '../components/select-template.js';
import { confirmWithDetails } from '../components/confirm-action.js';
import { inputFullApiConfig, inputConfigName } from '../components/input-api-key.js';
import { colors, formatters, separator as themeSeparator } from '../../theme/index.js';

/**
 * @deprecated
 *
 * 此 wizard 已废弃，将在 Phase 15 移除。
 * 请使用 CLI 命令替代：
 * - `cc-config config add` 创建配置
 * - `cc-config config list` 查看配置
 * - `cc-config config remove` 删除配置
 *
 * 迁移说明：
 * - 新 CLI 命令使用 ApiService (Phase 10)
 * - 配置存储为 ApiConfig (unified/granular 模式)
 * - API Key 输入使用 password 类型 (SEC-04)
 *
 * 详见 ROADMAP.md Phase 11。
 */

/**
 * Run the config add wizard.
 *
 * Flow:
 * 1. Input config name
 * 2. Input API key (password)
 * 3. Input base URL
 * 4. Input model name
 * 5. Save config
 *
 * @returns Promise that resolves when wizard completes
 */
export async function runConfigAddWizard(): Promise<void> {
  const apiConfigStore = new ApiConfigStore();
  const apiService = new ApiService(apiConfigStore, readConfig, writeConfig);

  try {
    const existingConfigs = await apiService.listConfigs();

    const config = await inputFullApiConfig();
    if (!config) return; // Cancelled

    // Create ApiConfig with unified mode
    await apiService.createConfig(config.name, {
      name: config.name,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      mode: 'unified',
      modelName: config.modelName,
    });

    console.log(formatters.success(`配置 "${config.name}" 已创建`));

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(formatters.error(`创建失败: ${message}`));
  }
}

/**
 * Run the config list wizard.
 *
 * Shows all available configs with details.
 *
 * @returns Promise that resolves when wizard completes
 */
export async function runConfigListWizard(): Promise<void> {
  const apiConfigStore = new ApiConfigStore();
  const apiService = new ApiService(apiConfigStore, readConfig, writeConfig);

  try {
    const configs = await apiService.listConfigs();

    if (configs.length === 0) {
      console.log(formatters.warning('没有可用的配置。'));
      console.log(colors.muted('创建配置: cc-config config add'));
      return;
    }

    console.log(colors.accent('\n可用配置'));
    console.log(themeSeparator(40));

    for (const name of configs) {
      try {
        const config = await apiService.getConfig(name);
        if (config) {
          console.log(colors.foreground(`  ${name}`));
          const modelName = config.modelName || '未设置';
          const hasKey = config.apiKey;
          console.log(colors.muted(`    模型: ${modelName}`));
          console.log(colors.muted(`    API Key: ${hasKey ? '已配置' : '未设置'}`));
        }
      } catch {
        console.log(colors.foreground(`  ${name}`));
        console.log(colors.muted(`    (无法加载详情)`));
      }
    }

    console.log(themeSeparator(40));
    console.log(colors.muted(`共 ${configs.length} 个配置`));

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(formatters.error(`列表失败: ${message}`));
  }
}

/**
 * Run the config remove wizard.
 *
 * Flow:
 * 1. Select config to remove
 * 2. Confirm deletion
 * 3. Remove config
 *
 * @returns Promise that resolves when wizard completes
 */
export async function runConfigRemoveWizard(): Promise<void> {
  const apiConfigStore = new ApiConfigStore();
  const apiService = new ApiService(apiConfigStore, readConfig, writeConfig);

  try {
    const configs = await apiService.listConfigs();

    if (configs.length === 0) {
      console.log(formatters.warning('没有可用的配置。'));
      return;
    }

    console.log(colors.accent('\n删除配置'));
    console.log(themeSeparator(40));

    const configName = await selectTemplate(configs, '选择要删除的配置');
    if (!configName) return; // Cancelled

    const confirmed = await confirmWithDetails(
      '删除配置',
      `将永久删除配置 "${configName}"`,
      true // Dangerous
    );

    if (!confirmed) {
      console.log(colors.muted('已取消。'));
      return;
    }

    await apiService.deleteConfig(configName);
    console.log(formatters.success(`配置 "${configName}" 已删除`));

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(formatters.error(`删除失败: ${message}`));
  }
}

/**
 * Run config wizard with sub-command routing.
 *
 * @param subCommand - 'add' | 'list' | 'remove'
 * @returns Promise that resolves when wizard completes
 */
export async function runConfigWizard(subCommand?: string): Promise<void> {
  switch (subCommand) {
    case 'add':
      await runConfigAddWizard();
      break;
    case 'list':
      await runConfigListWizard();
      break;
    case 'remove':
      await runConfigRemoveWizard();
      break;
    default:
      // Default to list
      await runConfigListWizard();
      break;
  }
}