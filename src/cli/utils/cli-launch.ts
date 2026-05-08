/**
 * CLI Launch Utility - Terminal-Native Mode (Phase 15)
 *
 * Per D-02: No args launches TUI.
 * Per D-06: switch without argument calls TUI selection.
 * Per D-08: scan command with --tui launches ScanScreen.
 *
 * Phase 09: Added prompts-based TUI launch (terminal-native mode).
 * Phase 15: Removed Ink-based TUI, renamed to cli-launch.ts.
 */

import { launchPromptsTUI } from '../prompts/index.js';
import { ApiService, ProjectService } from '../../lib/services/index.js';
import type { ScanResult } from '../../lib/services/index.js';
import { ApiConfigStore } from '../../lib/store/index.js';
import { readConfig, writeConfig } from '../../lib/store/config.js';
import { formatters, hint, separator } from '../theme/index.js';

/**
 * Launch the main TUI application.
 * Per D-02: Called when no CLI arguments provided.
 *
 * Phase 09: Now uses prompts-based TUI (terminal-native mode).
 *
 * @returns Promise that resolves when TUI exits
 */
export async function launchTUI(): Promise<void> {
  // Phase 09: Use prompts-based TUI (terminal-native)
  await launchPromptsTUI();
}

/**
 * Launch CLI for config selection.
 * Per D-06: Called when switch command has no argument.
 *
 * Note: Full config selection would require a ConfigSelectScreen.
 * For now, this provides a fallback that lists available configs
 * and prompts user to specify the config name via CLI.
 *
 * @returns Selected config name or null if cancelled
 */
export async function selectConfigInCLI(): Promise<string | null> {
  // Create API service for listing configs
  const apiConfigStore = new ApiConfigStore();
  const apiService = new ApiService(apiConfigStore, readConfig, writeConfig);

  try {
    const configs = await apiService.listConfigs();

    if (configs.length === 0) {
      console.log(formatters.warning('没有可用的配置。'));
      console.log(hint('创建配置: cc-config config add'));
      return null;
    }

    // List configs and prompt user to use CLI with argument
    console.log(formatters.message('可用配置:'));
    for (const name of configs) {
      console.log(`  - ${name}`);
    }
    console.log(hint('\n请指定配置名: cc-config switch <config-name>'));
    console.log(hint('或在未来版本中使用交互式选择。'));

    return null; // Return null to indicate user should use CLI with argument
  } catch (error) {
    if (error instanceof Error) {
      console.log(formatters.error(`列出配置失败: ${error.message}`));
    }
    return null;
  }
}

/**
 * Launch CLI for scan results multi-select.
 * Per D-08: Called when scan command has --tui flag.
 * Per D-09: ScanScreen displays new projects with checkbox multi-select.
 *
 * Note: Full ScanScreen implementation is in Phase 07-02.
 * This placeholder returns results and prompts CLI usage until ScanScreen is ready.
 *
 * @param results - Scan results from ProjectService.scanProjects()
 * @param service - ProjectService instance for registration
 * @returns Promise that resolves when CLI exits
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

  // For Phase 07-02, list new projects and prompt registration via CLI
  // Full CLI multi-select is implemented in ScanScreen
  console.log(formatters.message('发现新项目:'));
  for (const result of newProjects) {
    const name = result.path.split('/').pop() ?? result.path;
    console.log(`  - ${name} (${result.path})`);
  }

  console.log(hint('\n注册项目: cc-config register <path>'));
  console.log(hint('或使用交互式选择: cc-config scan --tui'));

  // Note: When ScanScreen is fully integrated with CLI,
  // this will launch the actual ScanScreen component
}