/**
 * CLI Launch Utility - Terminal-Native Mode
 *
 * Per D-02: No args launches dashboard.
 * Per D-06: switch without argument calls TUI selection.
 *
 * v0.2: 重构为仪表盘驱动，替代线性向导。
 */

import { runDashboard } from '../dashboard/dashboard.js';
import { ProjectService } from '../../lib/services/index.js';
import type { ScanResult } from '../../lib/services/index.js';
import { selectApiConfig } from '../prompts/components/select-api-config.js';
import { createServices } from './service-factory.js';
import { formatters, hint } from '../theme/index.js';

/**
 * Launch the main TUI dashboard.
 */
export async function launchTUI(): Promise<void> {
  await runDashboard();
}

/**
 * Launch CLI for config selection.
 * Now provides real interactive selection via selectApiConfig.
 */
export async function selectConfigInCLI(): Promise<string | null> {
  const { apiService } = createServices();

  try {
    const configs = await apiService.getAllConfigs();

    if (Object.keys(configs).length === 0) {
      console.log(formatters.warning('没有可用的配置。'));
      console.log(hint('创建配置: cc-config config add'));
      return null;
    }

    return await selectApiConfig(configs, '选择要应用的配置');
  } catch (error) {
    if (error instanceof Error) {
      console.log(formatters.error(`列出配置失败: ${error.message}`));
    }
    return null;
  }
}

/**
 * Launch CLI for scan results multi-select.
 */
export async function launchScanTUI(
  results: ScanResult[],
  service: ProjectService
): Promise<void> {
  const newProjects = results.filter(r => r.isNew);

  if (newProjects.length === 0) {
    console.log(formatters.warning('未发现新项目。'));
    console.log(hint('所有发现的项目都已注册。'));
    return;
  }

  console.log(formatters.message('发现新项目:'));
  for (const result of newProjects) {
    const name = result.path.split('/').pop() ?? result.path;
    console.log(`  - ${name} (${result.path})`);
  }

  console.log(hint('\n注册项目: cc-config register <path>'));
  console.log(hint('或使用仪表盘扫描: cc-config'));
}