/**
 * Switch Command - Project Configuration Switch
 *
 * Per CFG-05: Switch command for API config switching.
 * Per ONB-06: Diff preview before confirmation.
 *
 * Flow:
 * 1. D-01: Parse <project> (required) and [config] (optional) arguments
 * 2. D-02: Look up project by path or name
 * 3. D-03: If config omitted, trigger selectApiConfig
 * 4. D-04/D-05/D-06: Generate and render diff preview
 * 5. CFG-04: Mask API key in diff output
 * 6. D-07/D-08: Confirm with confirmAction (defaultChoice=false)
 * 7. D-09: Show cancel message on rejection or Ctrl+C
 * 8. Apply config on confirmation
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import { ConfigService } from '../../lib/services/config-service.js';
import { ApiConfigStore } from '../../lib/store/api-config.js';
import { ProjectIndex } from '../../lib/store/project.js';
import { readConfig, writeConfig } from '../../lib/store/config.js';
import { generateUnifiedDiff } from '../utils/diff.js';
import { renderDiff } from '../utils/diff-render.js';
import { selectApiConfig } from '../prompts/components/select-api-config.js';
import { confirmAction } from '../prompts/components/confirm-action.js';
import { handleCLIError, ExitCodes } from '../output/error.js';
import { maskApiKey } from '../../lib/security/api-key.js';
import { replaceEnvModel } from '../../lib/types/replacement.js';
import type { ApiConfig } from '../../lib/types/api-config.js';
import type { ClaudeSettings } from '../../lib/types/config.js';

/**
 * Register switch command with Commander program.
 *
 * Per D-01: cc-config switch <project> [config]
 * Per D-02: project argument required
 * Per D-03: config argument optional (triggers selection if omitted)
 *
 * @param program - Commander program instance
 */
export function registerSwitchCommand(program: Command): void {
  program
    .command('switch')
    .alias('sw') // D-01: short alias
    .description('切换项目配置')
    .argument('<project>', '项目名称或路径') // D-01, D-02: project required
    .argument('[config]', '配置名称') // D-01, D-03: config optional
    .action(async (project: string, config?: string) => {
      try {
        // Initialize stores and services
        const projectIndex = new ProjectIndex();
        const apiConfigStore = new ApiConfigStore();
        const configService = new ConfigService(readConfig, writeConfig);

        // D-02: Project lookup by path or name
        const projectEntry = await findProject(projectIndex, project);
        if (!projectEntry) {
          console.error(chalk.red(`未找到项目 '${project}'。`));
          console.log(chalk.gray('已注册项目列表: cc-config list'));
          process.exit(ExitCodes.NOT_FOUND);
        }

        // D-03: Config optional - trigger selection if omitted
        const allConfigs = await apiConfigStore.getAll();
        if (!config) {
          config = await selectApiConfig(allConfigs, '选择要应用的配置');
          if (!config) {
            console.log(chalk.yellow('未选择配置，操作已取消。'));
            process.exit(ExitCodes.SUCCESS);
          }
        }

        // Validate config exists
        const apiConfig = await apiConfigStore.get(config);
        if (!apiConfig) {
          console.error(chalk.red(`配置 '${config}' 不存在。`));
          console.log(chalk.gray('可用配置列表: cc-config config list'));
          process.exit(ExitCodes.NOT_FOUND);
        }

        // Read existing project config
        const existingConfig = await configService.readProjectConfig(projectEntry.path);

        // D-04: Generate preview config (real config for application)
        const newConfig = replaceEnvModel(existingConfig ?? {}, apiConfig);

        // CFG-04: Mask API key for diff display
        const maskedPreview = maskApiKeyInConfig(newConfig);

        // D-04/D-05/D-06: Generate and render diff
        const diffLines = generateUnifiedDiff(existingConfig ?? {}, maskedPreview);
        console.log();
        console.log(chalk.cyan('配置变更预览：'));
        console.log(chalk.gray(`项目: ${projectEntry.name}`));
        console.log(chalk.gray(`配置: ${config}`));
        console.log();
        renderDiff(diffLines, '.claude/settings.json');

        // D-07/D-08: Confirmation with safe default (false)
        console.log();
        const confirmed = await confirmAction('确认应用以上变更？', false);

        if (confirmed === null || !confirmed) {
          // D-09: Cancelled or rejected
          console.log(chalk.yellow('操作已取消，未修改配置'));
          process.exit(ExitCodes.SUCCESS);
        }

        // Apply config (uses real apiKey, not masked)
        await configService.applyApiConfig(projectEntry.path, apiConfig);

        // Update project metadata
        await projectIndex.update(projectEntry.id, { activeConfig: config });

        // Success message
        console.log(chalk.green(`✓ 已切换配置: ${config}`));
        console.log(chalk.gray(`项目: ${projectEntry.name}`));
        console.log(chalk.gray(`路径: ${projectEntry.path}`));

      } catch (error) {
        handleCLIError(error);
      }
    });
}

/**
 * Find project by path or name.
 *
 * Per D-02: First tries exact path lookup, then searches by name.
 *
 * @param index - ProjectIndex instance
 * @param input - User input (path or name)
 * @returns ProjectEntry if found, null if not found
 */
async function findProject(
  index: ProjectIndex,
  input: string
): Promise<{ id: string; name: string; path: string; activeConfig: string | null; lastModified: string } | null> {
  // Try exact path match first
  const byPath = await index.getByPath(input);
  if (byPath) return byPath;

  // Search by name
  const all = await index.getAll();
  return all.find(p => p.name === input) ?? null;
}

/**
 * Mask API key in config for display.
 *
 * Per CFG-04: API key masked in all display contexts.
 * Masks ANTHROPIC_AUTH_TOKEN in env object before rendering diff.
 *
 * @param config - ClaudeSettings to mask
 * @returns Config with masked API key
 */
function maskApiKeyInConfig(config: ClaudeSettings): ClaudeSettings {
  if (!config.env || typeof config.env !== 'object') return config;

  const env = config.env as Record<string, string>;
  if (env.ANTHROPIC_AUTH_TOKEN) {
    return {
      ...config,
      env: {
        ...env,
        ANTHROPIC_AUTH_TOKEN: maskApiKey(env.ANTHROPIC_AUTH_TOKEN),
      },
    };
  }
  return config;
}