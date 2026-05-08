/**
 * Switch Wizard - Quick project/config switch flow
 *
 * Per D-03: Linear wizard flow
 */

import path from 'path';
import { ProjectService, ApiService } from '../../../lib/services/index.js';
import { ProjectIndex, ApiConfigStore, AppState, readConfig, writeConfig } from '../../../lib/store/index.js';
import { selectProject } from '../components/select-project.js';
import { selectTemplate } from '../components/select-template.js';
import { confirmApplyTemplate } from '../components/confirm-action.js';
import { colors, formatters, separator as themeSeparator } from '../../theme/index.js';

/**
 * Run the quick switch wizard flow.
 *
 * Flow:
 * 1. Select project
 * 2. Select template/config
 * 3. Confirm and apply
 *
 * @returns Promise that resolves when wizard completes
 */
export async function runSwitchWizard(): Promise<void> {
  // Create services (same pattern as Ink TUI)
  const projectIndex = new ProjectIndex();
  const apiConfigStore = new ApiConfigStore();
  const appState = new AppState();

  const projectService = new ProjectService(projectIndex, appState);
  const apiService = new ApiService(apiConfigStore, readConfig, writeConfig);

  try {
    // Step 1: Load and select project
    const projects = await projectService.listProjects();

    if (projects.length === 0) {
      console.log(formatters.warning('没有已注册的项目。'));
      console.log(colors.muted('先扫描项目: cc-config scan'));
      return;
    }

    console.log(colors.accent('\n项目切换'));
    console.log(themeSeparator(40));

    const projectPath = await selectProject(projects, '选择项目');
    if (!projectPath) return; // Cancelled

    const selectedProject = projects.find(p => p.path === projectPath);

    // Step 2: Select template/config
    const configs = await apiService.listConfigs();

    if (configs.length === 0) {
      console.log(formatters.warning('没有可用的配置。'));
      console.log(colors.muted('先创建配置: cc-config config add'));
      return;
    }

    const configName = await selectTemplate(configs, '选择配置');
    if (!configName) return; // Cancelled

    // Step 3: Confirm and apply
    const projectName = path.basename(projectPath);
    const confirmed = await confirmApplyTemplate(projectName, configName);

    if (!confirmed) {
      console.log(colors.muted('已取消。'));
      return;
    }

    // Apply the config
    await apiService.applyConfig(projectPath, configName);
    console.log(formatters.success(`配置 "${configName}" 已应用到 "${projectName}"`));

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(formatters.error(`切换失败: ${message}`));
  }
}

/**
 * Quick switch wizard with pre-selected project.
 *
 * @param projectPath - Pre-selected project path
 * @returns Promise that resolves when wizard completes
 */
export async function runSwitchWizardForProject(projectPath: string): Promise<void> {
  const apiConfigStore = new ApiConfigStore();
  const apiService = new ApiService(apiConfigStore, readConfig, writeConfig);

  try {
    const configs = await apiService.listConfigs();

    if (configs.length === 0) {
      console.log(formatters.warning('没有可用的配置。'));
      return;
    }

    const projectName = path.basename(projectPath);
    console.log(colors.accent(`\n切换: ${projectName}`));

    const configName = await selectTemplate(configs, '选择配置');
    if (!configName) return;

    const confirmed = await confirmApplyTemplate(projectName, configName);
    if (!confirmed) return;

    await apiService.applyConfig(projectPath, configName);
    console.log(formatters.success(`配置已应用`));

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(formatters.error(`切换失败: ${message}`));
  }
}