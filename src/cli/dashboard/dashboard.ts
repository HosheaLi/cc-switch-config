/**
 * 主仪表盘 - 状态面板 + 操作菜单
 *
 * 参考 switch-model skill 的 showStatus() 设计。
 * 运行 cc-config (无参数) 时展示。
 */

import path from 'path';
import fs from 'fs-extra';
import { createServices } from '../utils/service-factory.js';
import { createSpinner } from '../utils/spinner.js';
import { selectProject, selectFromScanResults } from '../prompts/components/select-project.js';
import { selectApiConfig } from '../prompts/components/select-api-config.js';
import { selectDirectory } from '../prompts/components/select-directory.js';
import { confirmAction, confirmWithDetails } from '../prompts/components/confirm-action.js';
import { inputFullApiConfig } from '../prompts/components/input-api-key.js';
import { promptWithCancel, defaultOnCancel } from '../prompts/utils/handle-cancel.js';
import { maskApiKey } from '../../lib/security/api-key.js';
import { maskApiKeyInConfig } from '../utils/mask-config.js';
import { ConfigService } from '../../lib/services/config-service.js';
import { ExportService } from '../../lib/services/export-service.js';
import { readConfig, writeConfig } from '../../lib/store/config.js';
import { replaceEnvModel } from '../../lib/types/replacement.js';
import { generateUnifiedDiff } from '../utils/diff.js';
import { renderDiff } from '../utils/diff-render.js';
import { formatProjectTable } from '../output/table.js';
import { colors, formatters } from '../theme/index.js';
import type { ApiConfig } from '../../lib/types/api-config.js';
import type { ProjectEntry } from '../../lib/store/project.js';

import { VERSION } from '../../version.js';

const SEP = '━'.repeat(44);

export async function runDashboard(): Promise<void> {
  const svc = createServices();

  while (true) {
    const configs = await svc.apiService.getAllConfigs();
    const projects = await svc.projectService.listProjects();
    const cwd = process.cwd();
    const currentProject = projects.find(p => p.path === cwd) ?? null;

    // === 渲染状态面板 ===
    console.clear();
    renderHeader();
    await renderCurrentStatus(currentProject, configs, cwd);
    renderConfigList(configs, currentProject?.activeConfig);
    renderProjectList(projects, cwd);
    renderActionMenu();

    // === 操作菜单 ===
    const actionResult = await promptWithCancel<string>(
      {
        type: 'select',
        name: 'action',
        message: '选择操作',
        choices: [
          { title: '切换项目配置', value: 'switch', description: '为项目选择并应用 API 配置' },
          { title: '管理 API 配置', value: 'configs', description: '添加/删除 API 配置模板' },
          { title: '扫描并注册项目', value: 'scan', description: '扫描目录发现 Claude Code 项目' },
          { title: '查看全部项目', value: 'list', description: '以详细表格展示所有已注册项目' },
          { title: '导出/导入配置', value: 'export', description: '导出或导入项目配置' },
          { title: '退出', value: 'quit', description: '退出 cc-config' },
        ],
        initial: 0,
      },
      defaultOnCancel
    );

    if (actionResult.cancelled || actionResult.value === null || actionResult.value === 'quit') {
      console.log(colors.muted('\n再见！'));
      process.exit(0);
    }

    switch (actionResult.value) {
      case 'switch':
        await handleSwitch(svc, projects, configs);
        break;
      case 'configs':
        await handleConfigs(svc);
        break;
      case 'scan':
        await handleScan(svc);
        break;
      case 'list':
        await handleList(svc.projectService);
        break;
      case 'export':
        await handleExport(svc);
        break;
    }
  }
}

function maxPathLen(): number {
  const cols = process.stdout.columns ?? 80;
  return Math.max(20, cols - 45);
}

// === 渲染函数 ===

function renderHeader(): void {
  console.log(colors.accent(SEP));
  console.log(colors.bold(colors.accent(`  cc-config v${VERSION}`)));
  console.log(colors.accent(SEP));
  console.log();
}

async function renderCurrentStatus(
  currentProject: ProjectEntry | null,
  configs: Record<string, ApiConfig>,
  cwd: string
): Promise<void> {
  if (currentProject) {
    const activeConfig = currentProject.activeConfig;
    console.log(colors.bold('  当前项目: ') + colors.foreground(currentProject.name));
    if (activeConfig) {
      const cfg = configs[activeConfig];
      const desc = cfg ? `${cfg.modelName ?? 'granular'} @ ${cfg.baseUrl}` : activeConfig;
      console.log(colors.bold('  活跃配置: ') + colors.success(activeConfig) + colors.muted(`  (${desc})`));
    } else {
      console.log(colors.bold('  活跃配置: ') + colors.warning('未设置'));
    }
  } else {
    console.log(colors.bold('  当前目录: ') + colors.muted(cwd));
    const claudeDir = path.join(cwd, '.claude');
    const hasClaude = await fs.pathExists(path.join(claudeDir, 'settings.json')) ||
      await fs.pathExists(path.join(claudeDir, 'settings.local.json'));
    if (hasClaude) {
      console.log(colors.muted('  检测到 .claude/ 配置目录，尚未注册'));
    } else {
      console.log(colors.muted('  非 Claude Code 项目目录'));
    }
  }
  console.log();
}

function renderConfigList(configs: Record<string, ApiConfig>, activeConfig?: string | null): void {
  const names = Object.keys(configs);
  console.log(colors.accent(SEP));
  console.log(colors.bold(`  API 配置 (${names.length})`));
  console.log(colors.accent(SEP));
  if (names.length === 0) {
    console.log(colors.muted('  暂无配置，请先创建'));
  } else {
    for (const name of names) {
      const cfg = configs[name];
      const isActive = activeConfig === name;
      const marker = isActive ? colors.success('  ✓') : '   ';
      const maskedKey = maskApiKey(cfg.apiKey);
      const model = cfg.modelName ?? 'granular';
      console.log(`${marker} ${colors.foreground(name.padEnd(18))} ${colors.muted(model.padEnd(14))} ${colors.muted(maskedKey)}`);
    }
  }
  console.log();
}

function renderProjectList(projects: ProjectEntry[], cwd: string): void {
  console.log(colors.accent(SEP));
  console.log(colors.bold(`  已注册项目 (${projects.length})`));
  console.log(colors.accent(SEP));
  if (projects.length === 0) {
    console.log(colors.muted('  暂无注册项目，请先扫描'));
  } else {
    const displayProjects = projects.slice(0, 10);
    for (const p of displayProjects) {
      const isCurrent = p.path === cwd;
      const marker = isCurrent ? colors.success('  ▶') : '   ';
      const cfgName = p.activeConfig ?? colors.muted('-');
      const limit = maxPathLen();
      const truncatedPath = p.path.length > limit ? '...' + p.path.slice(-(limit - 3)) : p.path;
      console.log(`${marker} ${colors.foreground(p.name.padEnd(20))} ${cfgName.toString().padEnd(18)} ${colors.muted(truncatedPath)}`);
    }
    if (projects.length > 10) {
      console.log(colors.muted(`  ... 还有 ${projects.length - 10} 个项目`));
    }
  }
  console.log();
}

function renderActionMenu(): void {
  console.log(colors.accent(SEP));
  console.log();
}

// === 子流程处理 ===

async function handleSwitch(
  svc: ReturnType<typeof createServices>,
  projects: ProjectEntry[],
  configs: Record<string, ApiConfig>
): Promise<void> {
  const configNames = Object.keys(configs);
  if (configNames.length === 0) {
    console.log(formatters.warning('没有可用的 API 配置。请先创建配置。'));
    await waitForEnter();
    return;
  }

  const projectPath = await selectProject(projects, '选择要切换的项目');
  if (!projectPath) return;

  const project = projects.find(p => p.path === projectPath);
  if (!project) return;

  const configName = await selectApiConfig(configs, '选择要应用的配置');
  if (!configName) return;

  const apiConfig = configs[configName];
  if (!apiConfig) return;

  const configService = new ConfigService(readConfig, writeConfig);
  const existingConfig = await configService.readProjectConfig(projectPath);
  const newConfig = replaceEnvModel(existingConfig ?? {}, apiConfig);

  const maskedPreview = maskApiKeyInConfig(newConfig);
  const diffLines = generateUnifiedDiff(existingConfig ?? {}, maskedPreview);
  console.log();
  console.log(colors.accent('配置变更预览：'));
  console.log(colors.muted(`项目: ${project.name}`));
  console.log(colors.muted(`配置: ${configName}`));
  console.log();
  renderDiff(diffLines);

  console.log();
  const confirmed = await confirmAction('确认应用以上变更？', false);
  if (!confirmed) {
    console.log(colors.warning('操作已取消，未修改配置'));
    return;
  }

  await configService.applyApiConfig(projectPath, apiConfig);
  await svc.projectIndex.update(project.id, { activeConfig: configName });

  console.log(formatters.success(`已切换: ${project.name} → ${configName}`));
  await waitForEnter();
}

async function handleConfigs(svc: ReturnType<typeof createServices>): Promise<void> {
  while (true) {
    console.log();
    const result = await promptWithCancel<string>({
      type: 'select',
      name: 'cfgAction',
      message: 'API 配置管理',
      choices: [
        { title: '添加配置', value: 'add', description: '创建新的 API 配置模板' },
        { title: '查看配置', value: 'view', description: '查看所有配置的详细信息' },
        { title: '删除配置', value: 'remove', description: '删除一个 API 配置模板' },
        { title: '返回仪表盘', value: 'back' },
      ],
      initial: 0,
    });

    if (result.cancelled || result.value === null || result.value === 'back') return;

    switch (result.value) {
      case 'add': {
        const config = await inputFullApiConfig();
        if (!config) break;
        await svc.apiService.createConfig(config.name, {
          name: config.name,
          apiKey: config.apiKey,
          baseUrl: config.baseUrl,
          mode: 'unified',
          modelName: config.modelName,
        });
        console.log(formatters.success(`配置 "${config.name}" 已创建`));
        await waitForEnter();
        break;
      }
      case 'view': {
        const allConfigs = await svc.apiService.getAllConfigs();
        const names = Object.keys(allConfigs);
        if (names.length === 0) {
          console.log(formatters.warning('没有可用的配置。'));
          await waitForEnter();
          break;
        }
        console.log(colors.accent('\n━━ API 配置详情 ━━'));
        for (const name of names) {
          const cfg = allConfigs[name];
          console.log(colors.bold(`\n  ${name}`));
          console.log(colors.muted(`    模型: ${cfg.modelName ?? 'granular'}`));
          console.log(colors.muted(`    URL:  ${cfg.baseUrl}`));
          console.log(colors.muted(`    Key:  ${maskApiKey(cfg.apiKey)}`));
        }
        console.log();
        await waitForEnter();
        break;
      }
      case 'remove': {
        const allConfigs = await svc.apiService.getAllConfigs();
        const name = await selectApiConfig(allConfigs, '选择要删除的配置');
        if (!name) break;
        const confirmed = await confirmWithDetails('删除配置', `将永久删除配置 "${name}"`, true);
        if (!confirmed) break;
        await svc.apiService.deleteConfig(name);
        console.log(formatters.success(`配置 "${name}" 已删除`));
        await waitForEnter();
        break;
      }
    }
  }
}

async function handleScan(svc: ReturnType<typeof createServices>): Promise<void> {
  const directory = await selectDirectory([process.cwd()], '选择扫描目录', true);
  if (!directory) return;

  const spinner = createSpinner('扫描中...');
  const results = await svc.projectService.scanProjects(undefined, [directory]);
  spinner.stop();

  const newProjects = results.filter(r => r.isNew);
  console.log(colors.muted(`发现 ${results.length} 个项目 (${newProjects.length} 新, ${results.length - newProjects.length} 已注册)`));

  if (newProjects.length === 0) {
    console.log(formatters.success('所有项目都已注册。'));
    await waitForEnter();
    return;
  }

  const selectedPaths = await selectFromScanResults(newProjects, '选择要注册的项目 (空格选择, 回车确认)');
  if (!selectedPaths || selectedPaths.length === 0) return;

  let registered = 0;
  for (const projectPath of selectedPaths) {
    try {
      await svc.projectService.registerProject(projectPath);
      console.log(formatters.success(`✓ 已注册: ${path.basename(projectPath)}`));
      registered++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(formatters.error(`✗ 注册失败 ${path.basename(projectPath)}: ${msg}`));
    }
  }

  console.log(formatters.success(`\n已注册 ${registered} 个项目`));
  await waitForEnter();
}

async function handleList(projectService: ReturnType<typeof createServices>['projectService']): Promise<void> {
  const projects = await projectService.listProjects();
  if (projects.length === 0) {
    console.log(formatters.warning('没有已注册的项目。'));
  } else {
    console.log();
    console.log(formatProjectTable(projects));
  }
  console.log();
  await waitForEnter();
}

async function handleExport(svc: ReturnType<typeof createServices>): Promise<void> {
  const result = await promptWithCancel<string>({
    type: 'select',
    name: 'expAction',
    message: '导出/导入',
    choices: [
      { title: '导出项目配置', value: 'export', description: '将项目配置导出为 JSON 文件' },
      { title: '导入项目配置', value: 'import', description: '从 JSON 文件导入项目配置' },
      { title: '返回仪表盘', value: 'back' },
    ],
    initial: 0,
  });

  if (result.cancelled || result.value === null || result.value === 'back') return;

  if (result.value === 'import') {
    console.log(colors.muted('请使用 CLI 命令导入: cc-config import <file>'));
    await waitForEnter();
    return;
  }

  // 导出
  const projects = await svc.projectService.listProjects();
  if (projects.length === 0) {
    console.log(formatters.warning('没有可导出的项目。'));
    await waitForEnter();
    return;
  }
  const projectPath = await selectProject(projects, '选择要导出的项目');
  if (!projectPath) return;

  const project = projects.find(p => p.path === projectPath);
  if (!project) return;

  const exportService = new ExportService(
    svc.projectIndex,
    svc.apiConfigStore,
    new ConfigService(readConfig, writeConfig)
  );

  try {
    const payload = await exportService.exportProject(project.id);
    const outputPath = `${project.name}-config.json`;
    await fs.writeJSON(outputPath, payload, { spaces: 2 });
    console.log(formatters.success(`已导出到 ${outputPath}`));
  } catch (err) {
    console.log(formatters.error(`导出失败: ${err instanceof Error ? err.message : String(err)}`));
  }
  await waitForEnter();
}

// === 工具函数 ===

async function waitForEnter(): Promise<void> {
  console.log(colors.muted('\n按 Enter 继续...'));
  await new Promise<void>((resolve) => {
    const onData = () => {
      process.stdin.removeListener('data', onData);
      resolve();
    };
    process.stdin.once('data', onData);
  });
}
