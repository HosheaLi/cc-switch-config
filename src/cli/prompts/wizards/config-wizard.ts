/**
 * Config Wizard - API config CRUD operations
 *
 * Per CFG-03: Manage API configs via CLI
 */

import chalk from 'chalk';
import { TemplateService } from '../../../lib/services/index.js';
import { TemplateStore, readConfig, writeConfig } from '../../../lib/store/index.js';
import { selectTemplate } from '../components/select-template.js';
import { confirmWithDetails } from '../components/confirm-action.js';
import { inputFullApiConfig, inputConfigName } from '../components/input-api-key.js';
import { formatters, separator as themeSeparator } from '../../theme/index.js';

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
  const templateStore = new TemplateStore();
  const templateService = new TemplateService(templateStore, readConfig, writeConfig);

  try {
    const existingTemplates = await templateService.listTemplates();

    const config = await inputFullApiConfig();
    if (!config) return; // Cancelled

    // Create template/config with proper TemplateConfig structure
    await templateService.createTemplate(config.name, {
      name: config.name,
      description: `API config for ${config.name}`,
      provider: {
        name: config.modelName,
        baseUrl: config.baseUrl,
        authType: 'header',
        env: {
          ANTHROPIC_API_KEY: config.apiKey,
        },
      },
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
  const templateStore = new TemplateStore();
  const templateService = new TemplateService(templateStore, readConfig, writeConfig);

  try {
    const templates = await templateService.listTemplates();

    if (templates.length === 0) {
      console.log(formatters.warning('没有可用的配置。'));
      console.log(chalk.gray('创建配置: cc-config config add'));
      return;
    }

    console.log(chalk.cyan('\n可用配置'));
    console.log(themeSeparator(40));

    for (const name of templates) {
      try {
        const template = await templateService.getTemplate(name);
        if (template) {
          console.log(chalk.white(`  ${name}`));
          const modelName = template.provider?.name || '未设置';
          const hasKey = template.provider?.env?.ANTHROPIC_API_KEY;
          console.log(chalk.gray(`    模型: ${modelName}`));
          console.log(chalk.gray(`    API Key: ${hasKey ? '已配置' : '未设置'}`));
        }
      } catch {
        console.log(chalk.white(`  ${name}`));
        console.log(chalk.gray(`    (无法加载详情)`));
      }
    }

    console.log(themeSeparator(40));
    console.log(chalk.gray(`共 ${templates.length} 个配置`));

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
  const templateStore = new TemplateStore();
  const templateService = new TemplateService(templateStore, readConfig, writeConfig);

  try {
    const templates = await templateService.listTemplates();

    if (templates.length === 0) {
      console.log(formatters.warning('没有可用的配置。'));
      return;
    }

    console.log(chalk.cyan('\n删除配置'));
    console.log(themeSeparator(40));

    const templateName = await selectTemplate(templates, '选择要删除的配置');
    if (!templateName) return; // Cancelled

    const confirmed = await confirmWithDetails(
      '删除配置',
      `将永久删除配置 "${templateName}"`,
      true // Dangerous
    );

    if (!confirmed) {
      console.log(chalk.gray('已取消。'));
      return;
    }

    await templateService.deleteTemplate(templateName);
    console.log(formatters.success(`配置 "${templateName}" 已删除`));

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