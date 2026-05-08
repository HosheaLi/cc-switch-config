/**
 * Main Wizard - Linear onboarding flow
 *
 * Per D-03: First-run wizard flow
 * Per ONB-01: API config → scan directory → scan → select → confirm
 */

import path from 'path';
import chalk from 'chalk';
import { ProjectService, TemplateService } from '../../../lib/services/index.js';
import { ProjectIndex, TemplateStore, AppState, readConfig, writeConfig, type ProjectEntry } from '../../../lib/store/index.js';
import { selectProject, selectFromScanResults } from '../components/select-project.js';
import { selectTemplate } from '../components/select-template.js';
import { confirmAction, confirmApplyTemplate } from '../components/confirm-action.js';
import { inputFullApiConfig } from '../components/input-api-key.js';
import { selectDirectory } from '../components/select-directory.js';
import { formatters, separator as themeSeparator } from '../../theme/index.js';

/**
 * Simple loading indicator
 */
function createSpinner(message: string) {
  let frame = 0;
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

  const interval = setInterval(() => {
    process.stdout.write(`\r${frames[frame]} ${message}`);
    frame = (frame + 1) % frames.length;
  }, 80);

  return {
    succeed: (msg: string) => {
      clearInterval(interval);
      process.stdout.write(`\r${chalk.green('✓')} ${msg}\n`);
    },
    fail: (msg: string) => {
      clearInterval(interval);
      process.stdout.write(`\r${chalk.red('✗')} ${msg}\n`);
    },
    stop: () => {
      clearInterval(interval);
      process.stdout.write('\r' + ' '.repeat(60) + '\r');
    },
  };
}

/**
 * Run the main wizard (full onboarding flow).
 *
 * Flow:
 * 1. API Configuration (if first run/no configs)
 * 2. Scan Directory Selection
 * 3. Execute Scan
 * 4. Select Project
 * 5. Select Configuration
 * 6. Confirm & Apply
 *
 * @returns Promise that resolves when wizard completes
 */
export async function runMainWizard(): Promise<void> {
  // Create services
  const projectIndex = new ProjectIndex();
  const templateStore = new TemplateStore();
  const appState = new AppState();

  const projectService = new ProjectService(projectIndex, appState);
  const templateService = new TemplateService(templateStore, readConfig, writeConfig);

  try {
    console.log(chalk.cyan('\n╔══════════════════════════════════════════╗'));
    console.log(chalk.cyan('║   欢迎使用 cc-config 配置向导             ║'));
    console.log(chalk.cyan('╚══════════════════════════════════════════╝'));
    console.log();

    // Step 1: API Configuration (if needed)
    const templates = await templateService.listTemplates();

    if (templates.length === 0) {
      console.log(chalk.yellow('首次运行 - 需要创建 API 配置'));
      console.log(themeSeparator(40));

      const config = await inputFullApiConfig();
      if (!config) return; // Cancelled

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
      console.log(themeSeparator(40));
    }

    // Step 2: Scan Directory Selection
    let projects = await projectService.listProjects();

    if (projects.length === 0) {
      console.log(chalk.cyan('\n扫描项目'));
      console.log(themeSeparator(40));

      const directory = await selectDirectory([process.cwd()], '扫描目录', true);
      if (!directory) return;

      // Step 3: Execute Scan
      const spinner = createSpinner('扫描中...');
      const results = await projectService.scanProjects(undefined, [directory]);
      spinner.succeed(`扫描完成: ${results.length} 个项目`);

      const newProjects = results.filter(r => r.isNew);
      if (newProjects.length === 0) {
        console.log(formatters.warning('没有发现项目。'));
        return;
      }

      // Step 3.5: Register projects first
      const selectedPaths = await selectFromScanResults(newProjects, '选择要注册的项目');
      if (!selectedPaths || selectedPaths.length === 0) return;

      for (const projectPath of selectedPaths) {
        await projectService.registerProject(projectPath);
      }

      console.log(formatters.success(`已注册 ${selectedPaths.length} 个项目`));

      // Reload projects
      projects = await projectService.listProjects();
    }

    // Step 4: Select Project
    console.log(chalk.cyan('\n选择项目'));
    console.log(themeSeparator(40));

    const projectPath = await selectProject(projects, '选择项目');
    if (!projectPath) return;

    const selectedProject = projects.find(p => p.path === projectPath);
    const projectName = path.basename(projectPath);

    // Step 5: Select Configuration
    const availableTemplates = await templateService.listTemplates();

    const templateName = await selectTemplate(availableTemplates, '选择配置');
    if (!templateName) return;

    // Step 6: Confirm & Apply
    console.log(chalk.cyan('\n应用配置'));
    console.log(themeSeparator(40));
    console.log(chalk.gray(`项目: ${projectName}`));
    console.log(chalk.gray(`配置: ${templateName}`));
    console.log();

    const confirmed = await confirmAction('确认应用此配置？', true);
    if (!confirmed) {
      console.log(chalk.gray('已取消。'));
      return;
    }

    await templateService.applyTemplate(projectPath, templateName);
    console.log(themeSeparator(40));
    console.log(formatters.success(`配置已应用到 "${projectName}"`));
    console.log(chalk.gray('\n提示: 运行 `cc-config list` 查看所有项目'));

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(formatters.error(`操作失败: ${message}`));
  }
}

/**
 * Run main wizard in interactive mode (no args).
 *
 * @returns Promise that resolves when wizard completes
 */
export async function launchPromptsTUI(): Promise<void> {
  await runMainWizard();
}