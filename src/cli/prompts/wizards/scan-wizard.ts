/**
 * Scan Wizard - Project discovery and registration flow
 *
 * Per ONB-03: Parallel scan traversal
 * Per ONB-04: Skip node_modules/.git/etc
 */

import path from 'path';
import chalk from 'chalk';
import { ProjectService } from '../../../lib/services/index.js';
import { ProjectIndex, AppState } from '../../../lib/store/index.js';
import { selectFromScanResults } from '../components/select-project.js';
import { confirmAction } from '../components/confirm-action.js';
import { selectDirectory } from '../components/select-directory.js';
import { styleSuccess, styleError, styleWarning, separator } from '../utils/theme.js';
// Note: ora is not installed, using simple spinner fallback

/**
 * Simple loading indicator fallback
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
 * Run the scan wizard flow.
 *
 * Flow:
 * 1. Select scan directory
 * 2. Execute scan (progress indicator)
 * 3. Select new projects to register
 * 4. Confirm registration
 *
 * @returns Promise that resolves when wizard completes
 */
export async function runScanWizard(): Promise<void> {
  const projectIndex = new ProjectIndex();
  const appState = new AppState();
  const projectService = new ProjectService(projectIndex, appState);

  try {
    console.log(chalk.cyan('\n项目扫描'));
    console.log(separator(40));

    // Step 1: Select scan directory
    const directory = await selectDirectory(
      [process.cwd()],
      '扫描目录',
      true
    );

    if (!directory) return; // Cancelled

    // Step 2: Execute scan
    const spinner = createSpinner('扫描中...');
    const results = await projectService.scanProjects(undefined, [directory]);
    spinner.stop();

    const newProjects = results.filter(r => r.isNew);
    const existingCount = results.length - newProjects.length;

    console.log(chalk.gray(`发现 ${results.length} 个项目 (${newProjects.length} 新, ${existingCount} 已注册)`));

    if (newProjects.length === 0) {
      console.log(styleSuccess('所有项目都已注册。'));
      return;
    }

    // Step 3: Select new projects to register
    const selectedPaths = await selectFromScanResults(newProjects, '选择要注册的项目');
    if (!selectedPaths || selectedPaths.length === 0) return;

    // Step 4: Register selected projects
    console.log(chalk.gray(`\n注册 ${selectedPaths.length} 个项目...`));

    const registered: string[] = [];
    const failed: string[] = [];

    for (const projectPath of selectedPaths) {
      try {
        await projectService.registerProject(projectPath);
        registered.push(path.basename(projectPath));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(styleError(`注册失败 ${path.basename(projectPath)}: ${msg}`));
        failed.push(projectPath);
      }
    }

    // Summary
    console.log(separator(40));
    if (registered.length > 0) {
      console.log(styleSuccess(`已注册 ${registered.length} 个项目`));
      for (const name of registered) {
        console.log(chalk.gray(`  - ${name}`));
      }
    }
    if (failed.length > 0) {
      console.log(styleError(`${failed.length} 个项目注册失败`));
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(styleError(`扫描失败: ${message}`));
  }
}

/**
 * Quick scan for a specific directory.
 *
 * @param directory - Directory to scan
 * @returns Promise that resolves with scan results
 */
export async function quickScanWizard(directory: string): Promise<void> {
  const projectIndex = new ProjectIndex();
  const appState = new AppState();
  const projectService = new ProjectService(projectIndex, appState);

  try {
    const spinner = createSpinner(`扫描 ${path.basename(directory)}...`);
    const results = await projectService.scanProjects(undefined, [directory]);
    spinner.succeed(`扫描完成: ${results.length} 个项目`);

    const newProjects = results.filter(r => r.isNew);
    if (newProjects.length === 0) {
      console.log(chalk.gray('没有新项目发现。'));
      return;
    }

    // Auto-prompt for registration
    const selectedPaths = await selectFromScanResults(newProjects);
    if (!selectedPaths) return;

    for (const projectPath of selectedPaths) {
      await projectService.registerProject(projectPath);
      console.log(styleSuccess(`已注册: ${path.basename(projectPath)}`));
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(styleError(`扫描失败: ${message}`));
  }
}