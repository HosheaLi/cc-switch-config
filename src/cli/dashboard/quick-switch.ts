/**
 * 快速切换 - cc-config <config-name>
 *
 * 直接切换当前目录项目到指定配置。
 * 参考 switch-model skill 的 `model-switch <name>` 模式。
 */

import path from 'path';
import fs from 'fs-extra';
import { createServices } from '../utils/service-factory.js';
import { ConfigService } from '../../lib/services/config-service.js';
import { readConfig, writeConfig } from '../../lib/store/config.js';
import { maskApiKeyInConfig } from '../utils/mask-config.js';
import { replaceEnvModel } from '../../lib/types/replacement.js';
import { generateUnifiedDiff } from '../utils/diff.js';
import { renderDiff } from '../utils/diff-render.js';
import { confirmAction } from '../prompts/components/confirm-action.js';
import { colors, formatters } from '../theme/index.js';

export async function runQuickSwitch(configName: string): Promise<void> {
  const svc = createServices();
  const configService = new ConfigService(readConfig, writeConfig);

  const cwd = process.cwd();

  // 验证配置存在
  const allConfigs = await svc.apiConfigStore.getAll();
  const apiConfig = allConfigs[configName];
  if (!apiConfig) {
    console.log(formatters.error(`配置 "${configName}" 不存在。`));
    console.log(colors.muted('可用配置列表: cc-config config list'));
    process.exit(1);
  }

  // 查找或注册当前目录项目
  let project = await svc.projectIndex.getByPath(cwd);
  let autoRegistered = false;

  if (!project) {
    const claudeDir = path.join(cwd, '.claude');
    const hasClaude = await fs.pathExists(path.join(claudeDir, 'settings.json')) ||
                      await fs.pathExists(path.join(claudeDir, 'settings.local.json'));
    if (hasClaude) {
      project = await svc.projectService.registerProject(cwd);
      autoRegistered = true;
    } else {
      console.log(formatters.error('当前目录不是 Claude Code 项目目录。'));
      console.log(colors.muted('请先运行 cc-config 进行交互式设置。'));
      process.exit(1);
    }
  }

  // 读取现有配置生成 diff
  const existingConfig = await configService.readProjectConfig(cwd);
  const newConfig = replaceEnvModel(existingConfig ?? {}, apiConfig);

  // 脱敏后显示 diff
  const maskedPreview = maskApiKeyInConfig(newConfig);
  const diffLines = generateUnifiedDiff(existingConfig ?? {}, maskedPreview);

  console.log();
  console.log(colors.accent('配置变更预览：'));
  if (autoRegistered) {
    console.log(colors.success(`自动注册项目: ${project.name}`));
  }
  console.log(colors.muted(`项目: ${project.name}`));
  console.log(colors.muted(`配置: ${configName}`));
  console.log();
  renderDiff(diffLines);

  console.log();
  const confirmed = await confirmAction('确认应用以上变更？', false);
  if (!confirmed) {
    console.log(colors.warning('操作已取消，未修改配置'));
    process.exit(0);
  }

  // 应用配置
  await configService.applyApiConfig(cwd, apiConfig);
  await svc.projectIndex.update(project.id, { activeConfig: configName });

  console.log(formatters.success(`已切换: ${project.name} → ${configName}`));
}
