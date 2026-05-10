/**
 * 简化首次运行向导 - 3步替代6步
 *
 * 流程: 创建 API 配置 → 扫描目录注册项目 → 完成提示
 */

import { createServices } from '../../utils/service-factory.js';
import { createSpinner } from '../../utils/spinner.js';
import { selectFromScanResults } from '../components/select-project.js';
import { selectDirectory } from '../components/select-directory.js';
import { inputFullApiConfig } from '../components/input-api-key.js';
import { colors, formatters } from '../../theme/index.js';

const SEP = '━'.repeat(44);

export async function runOnboardingWizard(): Promise<void> {
  const svc = createServices();

  try {
    console.log(colors.accent('\n╔══════════════════════════════════════════╗'));
    console.log(colors.accent('║       欢迎使用 cc-config                  ║'));
    console.log(colors.accent('╚══════════════════════════════════════════╝'));
    console.log();

    // Step 1: 创建 API 配置
    console.log(colors.bold('步骤 1/3: 创建 API 配置'));
    console.log(colors.muted(SEP));

    const config = await inputFullApiConfig();
    if (!config) {
      console.log(colors.muted('\n已取消。下次运行 cc-config 继续设置。'));
      return;
    }

    await svc.apiService.createConfig(config.name, {
      name: config.name,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      mode: 'unified',
      modelName: config.modelName,
    });

    console.log(formatters.success(`配置 "${config.name}" 已创建`));

    // Step 2: 扫描目录注册项目
    console.log(colors.bold('\n步骤 2/3: 扫描并注册项目'));
    console.log(colors.muted(SEP));

    const directory = await selectDirectory([process.cwd()], '选择要扫描的目录', true);
    if (!directory) {
      console.log(colors.muted('\n已跳过扫描。运行 cc-config scan 随时扫描。'));
      console.log(formatters.success('设置完成！运行 cc-config 打开仪表盘。'));
      return;
    }

    const spinner = createSpinner('扫描中...');
    let results;
    try {
      results = await svc.projectService.scanProjects(undefined, [directory]);
      spinner.succeed(`扫描完成: ${results.length} 个项目`);
    } catch (error) {
      spinner.fail('扫描失败');
      throw error;
    }

    const newProjects = results.filter(r => r.isNew);
    console.log(colors.muted(`发现 ${results.length} 个项目 (${newProjects.length} 新)`));

    if (newProjects.length === 0) {
      console.log(formatters.success('所有项目都已注册。'));
    } else {
      const selectedPaths = await selectFromScanResults(newProjects, '选择要注册的项目 (空格选择, 回车确认)');
      if (selectedPaths && selectedPaths.length > 0) {
        for (const projectPath of selectedPaths) {
          await svc.projectService.registerProject(projectPath);
        }
        console.log(formatters.success(`已注册 ${selectedPaths.length} 个项目`));
      }
    }

    // Step 3: 完成
    console.log(colors.bold('\n步骤 3/3: 完成'));
    console.log(colors.muted(SEP));
    console.log(formatters.success('设置完成！'));
    console.log(colors.muted('运行 cc-config 打开仪表盘，进行配置切换。'));
    console.log(colors.muted('或直接: cc-config <配置名>  快速切换当前项目'));
    console.log();

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(formatters.error(`设置失败: ${message}`));
  }
}
