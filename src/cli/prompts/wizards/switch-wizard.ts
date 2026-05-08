/**
 * Switch Wizard - Quick project/config switch flow
 *
 * Per D-03: Linear wizard flow
 */

import path from 'path';
import chalk from 'chalk';
import { ProjectService, TemplateService } from '../../../lib/services/index.js';
import { ProjectIndex, TemplateStore, AppState, readConfig, writeConfig } from '../../../lib/store/index.js';
import { selectProject } from '../components/select-project.js';
import { selectTemplate } from '../components/select-template.js';
import { confirmApplyTemplate } from '../components/confirm-action.js';
import { formatters } from '../../theme/index.js';

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
  const templateStore = new TemplateStore();
  const appState = new AppState();

  const projectService = new ProjectService(projectIndex, appState);
  const templateService = new TemplateService(templateStore, readConfig, writeConfig);

  try {
    // Step 1: Load and select project
    const projects = await projectService.listProjects();

    if (projects.length === 0) {
      console.log(formatters.warning('没有已注册的项目。'));
      console.log(chalk.gray('先扫描项目: cc-config scan'));
      return;
    }

    console.log(chalk.cyan('\n项目切换'));
    console.log(chalk.gray('━'.repeat(40)));

    const projectPath = await selectProject(projects, '选择项目');
    if (!projectPath) return; // Cancelled

    const selectedProject = projects.find(p => p.path === projectPath);

    // Step 2: Select template/config
    const templates = await templateService.listTemplates();

    if (templates.length === 0) {
      console.log(formatters.warning('没有可用的配置。'));
      console.log(chalk.gray('先创建配置: cc-config config add'));
      return;
    }

    const templateName = await selectTemplate(templates, '选择配置');
    if (!templateName) return; // Cancelled

    // Step 3: Confirm and apply
    const projectName = path.basename(projectPath);
    const confirmed = await confirmApplyTemplate(projectName, templateName);

    if (!confirmed) {
      console.log(chalk.gray('已取消。'));
      return;
    }

    // Apply the template
    await templateService.applyTemplate(projectPath, templateName);
    console.log(formatters.success(`配置 "${templateName}" 已应用到 "${projectName}"`));

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
  const templateStore = new TemplateStore();
  const templateService = new TemplateService(templateStore, readConfig, writeConfig);

  try {
    const templates = await templateService.listTemplates();

    if (templates.length === 0) {
      console.log(formatters.warning('没有可用的配置。'));
      return;
    }

    const projectName = path.basename(projectPath);
    console.log(chalk.cyan(`\n切换: ${projectName}`));

    const templateName = await selectTemplate(templates, '选择配置');
    if (!templateName) return;

    const confirmed = await confirmApplyTemplate(projectName, templateName);
    if (!confirmed) return;

    await templateService.applyTemplate(projectPath, templateName);
    console.log(formatters.success(`配置已应用`));

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(formatters.error(`切换失败: ${message}`));
  }
}