/**
 * 主仪表盘 - 状态面板 + 操作菜单
 *
 * 参考 switch-model skill 的 showStatus() 设计。
 * 运行 cc-config (无参数) 时展示。
 */

import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { createServices } from '../utils/service-factory.js';
import { createSpinner } from '../utils/spinner.js';
import { selectProject, selectFromScanResults } from '../prompts/components/select-project.js';
import { selectApiConfig } from '../prompts/components/select-api-config.js';
import { selectDirectory } from '../prompts/components/select-directory.js';
import { confirmAction, confirmWithDetails } from '../prompts/components/confirm-action.js';
import { inputFullApiConfig } from '../prompts/components/input-api-key.js';
import { inputImportApiConfig } from '../prompts/components/import-api-config.js';
import { inputEditProject } from '../prompts/components/edit-project.js';
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
import { getProjectConfigPath } from '../../lib/paths/claude.js';
import type { ApiConfig } from '../../lib/types/api-config.js';
import type { ProjectEntry } from '../../lib/store/project.js';

import { VERSION } from '../../version.js';

const HOME_CLAUDE = path.join(os.homedir(), '.claude');
const SEP = '━'.repeat(44);
const PAGE_SIZE = 8;

export async function runDashboard(): Promise<void> {
  const svc = createServices();
  let projectPage = 0;

  while (true) {
    const configs = await svc.apiService.getAllConfigs();
    const projects = await svc.projectService.listProjects();
    const cwd = await fs.realpath(process.cwd());
    const currentProject = projects.find(p => p.path === cwd) ?? null;

    // 比对每个项目的实际配置与 API 配置模板
    const matchedConfigs = new Map<string, MatchResult>();
    for (const p of projects) {
      matchedConfigs.set(p.id, await findMatchingConfig(p.path, configs));
    }

    // 重置越界的页码
    const totalP = Math.max(1, Math.ceil(projects.length / PAGE_SIZE));
    if (projectPage >= totalP) projectPage = totalP - 1;

    // === 渲染状态面板 ===
    console.clear();
    renderHeader();
    await renderCurrentStatus(currentProject, configs, cwd, matchedConfigs);
    renderConfigList(configs, currentProject?.activeConfig);
    renderProjectList(projects, configs, cwd, projectPage, matchedConfigs);
    renderActionMenu();

    // === 操作菜单 ===
    const totalPages = Math.max(1, Math.ceil(projects.length / PAGE_SIZE));
    const menuChoices: Array<{ title: string; value: string; description?: string }> = [
      { title: '切换项目配置', value: 'switch', description: '为项目选择并应用 API 配置' },
      { title: '管理 API 配置', value: 'configs', description: '添加/删除/导入 API 配置模板' },
      { title: '项目管理', value: 'projects', description: '查看/编辑/删除已注册项目' },
      { title: '扫描并注册项目', value: 'scan', description: '扫描目录发现 Claude Code 项目' },
      { title: '导出/导入配置', value: 'export', description: '导出或导入项目配置' },
    ];
    if (totalPages > 1) {
      const pageLabel = `翻页 (第 ${projectPage + 1}/${totalPages} 页)`;
      menuChoices.push({ title: pageLabel, value: 'page' });
    }
    menuChoices.push({ title: '退出', value: 'quit', description: '退出 cc-config' });

    const actionResult = await promptWithCancel<string>(
      {
        type: 'select',
        name: 'action',
        message: '选择操作',
        choices: menuChoices,
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
      case 'page':
        projectPage = (projectPage + 1) % totalPages;
        break;
      case 'configs':
        await handleConfigs(svc);
        break;
      case 'projects':
        await handleProjects(svc);
        break;
      case 'scan':
        await handleScan(svc);
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
  cwd: string,
  matchedConfigs?: Map<string, MatchResult>
): Promise<void> {
  if (currentProject) {
    const isGlobal = currentProject.path === HOME_CLAUDE;
    const projectLabel = isGlobal
      ? `${colors.foreground(currentProject.name)} ${colors.muted('(全局)')}`
      : colors.foreground(currentProject.name);
    console.log(colors.bold('  当前项目: ') + projectLabel);

    // 检查实际配置是否匹配某个 API 配置模板
    const matched = matchedConfigs?.get(currentProject.id);
    if (matched === '__custom__') {
      console.log(colors.bold('  活跃配置: ') + colors.muted('自定义配置（未匹配到 API 配置模板）'));
    } else if (matched) {
      const cfg = configs[matched];
      const desc = cfg ? `${cfg.modelName ?? 'granular'} @ ${cfg.baseUrl}` : matched;
      console.log(colors.bold('  活跃配置: ') + colors.success(matched) + colors.muted(`  (${desc})`) + colors.success('  ✓ 已匹配'));
    } else {
      console.log(colors.bold('  活跃配置: ') + colors.warning('未配置'));
    }
  } else {
    console.log(colors.bold('  当前目录: ') + colors.muted(cwd));
    const hasClaude = await fs.pathExists(path.join(cwd, '.claude', 'settings.json')) ||
      await fs.pathExists(path.join(cwd, '.claude', 'settings.local.json'));
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

function renderProjectList(projects: ProjectEntry[], configs: Record<string, ApiConfig>, cwd: string, page: number, matchedConfigs?: Map<string, MatchResult>): void {
  console.log(colors.accent(SEP));
  console.log(colors.bold(`  已注册项目 (${projects.length})`));
  console.log(colors.accent(SEP));
  if (projects.length === 0) {
    console.log(colors.muted('  暂无注册项目，请先扫描'));
  } else {
    const total = Math.ceil(projects.length / PAGE_SIZE);
    const currentPage = Math.min(page, Math.max(0, total - 1));
    const sorted = [...projects].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
    const start = currentPage * PAGE_SIZE;
    const pageItems = sorted.slice(start, start + PAGE_SIZE);

    for (const p of pageItems) {
      const isCurrent = p.path === cwd;
      const marker = isCurrent ? colors.success('  ▶') : '   ';
      const isGlobal = p.path === HOME_CLAUDE;
      const nameDisplay = isGlobal
        ? `${colors.foreground(p.name)} ${colors.muted('(全局)')}`
        : colors.foreground(p.name.padEnd(20));
      const matched = matchedConfigs?.get(p.id);
      const cfgDisplay = matched === '__custom__'
        ? colors.muted('自定义')
        : matched
          ? `${colors.success('✓')} ${colors.foreground(matched)}`
          : colors.muted('未配置');
      const limit = maxPathLen();
      const truncatedPath = p.path.length > limit ? '...' + p.path.slice(-(limit - 3)) : p.path;
      const pathDisplay = isGlobal ? colors.muted('~/.claude') : colors.muted(truncatedPath);
      console.log(`${marker} ${nameDisplay}  ${cfgDisplay}  ${pathDisplay}`);
    }

    if (total > 1) {
      console.log(colors.muted(`  ── 第 ${currentPage + 1}/${total} 页 (共 ${projects.length} 个项目)`));
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

  if (projects.length === 0) {
    console.log(formatters.warning('没有已注册的项目。请先扫描并注册项目。'));
    await waitForEnter();
    return;
  }

  const projectPath = await selectProject(projects, '选择要切换的项目', matchedConfigs);
  if (!projectPath) return;

  const project = projects.find(p => p.path === projectPath);
  if (!project) return;

  // 非全局项目：检查配置文件是否存在，不存在则询问创建
  if (project.path !== HOME_CLAUDE) {
    const configPath = getProjectConfigPath(project.path);
    if (!await fs.pathExists(configPath)) {
      console.log(formatters.warning('该项目尚未创建项目级配置文件'));
      const create = await confirmAction(`是否创建 .claude 目录和 settings.local.json？`, true);
      if (!create) {
        console.log(colors.warning('已取消切换操作'));
        return;
      }
      await fs.ensureDir(path.join(project.path, '.claude'));
      await fs.writeJSON(configPath, {});
      console.log(formatters.success(`已创建 ${configPath}`));
    }
  }

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
        { title: '导入配置', value: 'import', description: '从 JSON 粘贴导入 API 配置模板' },
        { title: '查看配置', value: 'view', description: '查看所有配置的详细信息' },
        { title: '编辑配置', value: 'edit', description: '修改现有 API 配置' },
        { title: '删除配置', value: 'remove', description: '删除一个 API 配置模板' },
        { title: '返回仪表盘', value: 'back' },
      ],
      initial: 0,
    });

    if (result.cancelled || result.value === null || result.value === 'back') return;

    switch (result.value) {
      case 'add': {
        try {
          const config = await inputFullApiConfig();
          if (!config) break;
          await svc.apiService.createConfig(config.name, {
            name: config.name,
            apiKey: config.apiKey,
            baseUrl: config.baseUrl,
            mode: config.mode,
            modelName: config.mode === 'unified' ? config.modelName : undefined,
            env: config.mode === 'granular' ? config.env : undefined,
          });
          console.log(formatters.success(`配置 "${config.name}" 已创建`));
          await waitForEnter();
        } catch (err) {
          console.log(formatters.error(`创建失败: ${err instanceof Error ? err.message : String(err)}`));
          await waitForEnter();
        }
        break;
      }
      case 'import': {
        try {
          const allConfigs = await svc.apiService.getAllConfigs();
          const existingNames = Object.keys(allConfigs);
          const config = await inputImportApiConfig(existingNames);
          if (!config) break;
          await svc.apiService.createConfig(config.name, {
            name: config.name,
            apiKey: config.apiKey,
            baseUrl: config.baseUrl,
            mode: config.mode,
            modelName: config.mode === 'unified' ? config.modelName : undefined,
            env: config.mode === 'granular' ? config.env : undefined,
          });
          console.log(formatters.success(`配置 "${config.name}" 已通过导入创建`));
          await waitForEnter();
        } catch (err) {
          console.log(formatters.error(`导入失败: ${err instanceof Error ? err.message : String(err)}`));
          await waitForEnter();
        }
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
        console.log(colors.accent('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        for (const [idx, name] of names.entries()) {
          if (idx > 0) {
            console.log(colors.muted('  ─────────────────────────────────'));
          }
          const cfg = allConfigs[name];
          console.log(colors.bold(`  ${name}`));
          console.log(colors.muted(`  URL:     ${cfg.baseUrl}`));
          console.log(colors.muted(`  Key:     ${maskApiKey(cfg.apiKey)}`));
          console.log(colors.muted(`  模式:    ${cfg.mode === 'unified' ? '统一 (unified)' : '独立 (granular)'}`));

          if (cfg.mode === 'unified') {
            console.log(colors.muted(`  模型:    ${cfg.modelName}`));
          } else if (cfg.env) {
            // Group env vars: model vars first, then others
            const modelVarKeys = ['ANTHROPIC_MODEL', 'ANTHROPIC_DEFAULT_SONNET_MODEL', 'ANTHROPIC_DEFAULT_HAIKU_MODEL', 'ANTHROPIC_DEFAULT_OPUS_MODEL', 'ANTHROPIC_REASONING_MODEL', 'CLAUDE_CODE_SUBAGENT_MODEL'];
            const shownKeys = new Set<string>();
            console.log(colors.muted(`  模型变量:`));
            for (const mk of modelVarKeys) {
              if (cfg.env[mk]) {
                console.log(colors.muted(`    ${mk}=${cfg.env[mk]}`));
                shownKeys.add(mk);
              }
            }
            const extraKeys = Object.keys(cfg.env).filter(k => !shownKeys.has(k) && k !== 'ANTHROPIC_AUTH_TOKEN' && k !== 'ANTHROPIC_BASE_URL');
            if (extraKeys.length > 0) {
              console.log(colors.muted(`  其他变量:`));
              for (const ek of extraKeys) {
                console.log(colors.muted(`    ${ek}=${cfg.env[ek]}`));
              }
            }
          }

          if (cfg.createdAt) {
            const created = new Date(cfg.createdAt).toLocaleString('zh-CN');
            console.log(colors.muted(`  创建时间: ${created}`));
          }
          if (cfg.updatedAt) {
            const updated = new Date(cfg.updatedAt).toLocaleString('zh-CN');
            console.log(colors.muted(`  更新时间: ${updated}`));
          }
        }
        console.log(colors.accent('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log();
        await waitForEnter();
        break;
      }
      case 'edit': {
        try {
          const allConfigs = await svc.apiService.getAllConfigs();
          const oldName = await selectApiConfig(allConfigs, '选择要编辑的配置');
          if (!oldName) break;
          const config = await inputFullApiConfig();
          if (!config) break;
          // Handle rename: create with new name first, then delete old entry
          // (creating first prevents data loss if creation fails)
          if (config.name !== oldName) {
            await svc.apiService.createConfig(config.name, {
              name: config.name,
              apiKey: config.apiKey,
              baseUrl: config.baseUrl,
              mode: config.mode,
              modelName: config.mode === 'unified' ? config.modelName : undefined,
              env: config.mode === 'granular' ? config.env : undefined,
            });
            await svc.apiService.deleteConfig(oldName);
          } else {
            await svc.apiService.createConfig(config.name, {
              name: config.name,
              apiKey: config.apiKey,
              baseUrl: config.baseUrl,
              mode: config.mode,
              modelName: config.mode === 'unified' ? config.modelName : undefined,
              env: config.mode === 'granular' ? config.env : undefined,
            });
          }
          const action = config.name !== oldName
            ? `配置 "${oldName}" 已重命名为 "${config.name}"`
            : `配置 "${config.name}" 已更新`;
          console.log(formatters.success(action));
          await waitForEnter();
        } catch (err) {
          console.log(formatters.error(`更新失败: ${err instanceof Error ? err.message : String(err)}`));
          await waitForEnter();
        }
        break;
      }
      case 'remove': {
        try {
          const allConfigs = await svc.apiService.getAllConfigs();
          const name = await selectApiConfig(allConfigs, '选择要删除的配置');
          if (!name) break;
          const confirmed = await confirmWithDetails('删除配置', `将永久删除配置 "${name}"`, true);
          if (!confirmed) break;
          await svc.apiService.deleteConfig(name);
          console.log(formatters.success(`配置 "${name}" 已删除`));
          await waitForEnter();
        } catch (err) {
          console.log(formatters.error(`删除失败: ${err instanceof Error ? err.message : String(err)}`));
          await waitForEnter();
        }
        break;
      }
    }
  }
}

async function handleProjects(svc: ReturnType<typeof createServices>): Promise<void> {
  while (true) {
    console.log();
    const result = await promptWithCancel<string>({
      type: 'select',
      name: 'projAction',
      message: '项目管理',
      choices: [
        { title: '查看项目', value: 'view', description: '查看所有已注册项目的详细信息' },
        { title: '编辑项目', value: 'edit', description: '修改项目名称或路径' },
        { title: '删除项目', value: 'remove', description: '从注册列表中移除项目' },
        { title: '返回仪表盘', value: 'back' },
      ],
      initial: 0,
    });

    if (result.cancelled || result.value === null || result.value === 'back') return;

    switch (result.value) {
      case 'view': {
        const projects = await svc.projectService.listProjects();
        if (projects.length === 0) {
          console.log(formatters.warning('没有已注册的项目。'));
          await waitForEnter();
          break;
        }
        console.log(colors.accent('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        for (const [idx, p] of projects.entries()) {
          if (idx > 0) {
            console.log(colors.muted('  ─────────────────────────────────'));
          }
          console.log(colors.bold(`  ${p.name}`));
          console.log(colors.muted(`  ID:        ${p.id}`));
          console.log(colors.muted(`  路径:      ${p.path}`));
          console.log(colors.muted(`  配置:      ${p.activeConfig ?? colors.muted('未设置')}`));
          const modified = new Date(p.lastModified).toLocaleString('zh-CN');
          console.log(colors.muted(`  更新:      ${modified}`));
        }
        console.log(colors.accent('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log();
        await waitForEnter();
        break;
      }
      case 'edit': {
        try {
          const projects = await svc.projectService.listProjects();
          if (projects.length === 0) {
            console.log(formatters.warning('没有可编辑的项目。'));
            await waitForEnter();
            break;
          }
          const projectPath = await selectProject(projects, '选择要编辑的项目', matchedConfigs);
          if (!projectPath) break;
          const project = projects.find(p => p.path === projectPath);
          if (!project) break;
          const updates = await inputEditProject(project, projects);
          if (!updates) break;
          await svc.projectService.updateProject(project.id, updates);
          console.log(formatters.success(`项目 "${updates.name}" 已更新`));
          await waitForEnter();
        } catch (err) {
          console.log(formatters.error(`编辑失败: ${err instanceof Error ? err.message : String(err)}`));
          await waitForEnter();
        }
        break;
      }
      case 'remove': {
        try {
          const projects = await svc.projectService.listProjects();
          if (projects.length === 0) {
            console.log(formatters.warning('没有可删除的项目。'));
            await waitForEnter();
            break;
          }
          const projectPath = await selectProject(projects, '选择要删除的项目', matchedConfigs);
          if (!projectPath) break;
          const project = projects.find(p => p.path === projectPath);
          if (!project) break;
          const confirmed = await confirmWithDetails('删除项目', `将永久删除项目 "${project.name}"\n路径: ${project.path}`, true);
          if (!confirmed) break;
          await svc.projectService.removeProject(project.id);
          console.log(formatters.success(`项目 "${project.name}" 已删除`));
          await waitForEnter();
        } catch (err) {
          console.log(formatters.error(`删除失败: ${err instanceof Error ? err.message : String(err)}`));
          await waitForEnter();
        }
        break;
      }
    }
  }
}

async function handleScan(svc: ReturnType<typeof createServices>): Promise<void> {
  const directory = await selectDirectory([process.cwd()], '选择扫描目录', true);
  if (!directory) return;

  const spinner = createSpinner('扫描中...');
  let results;
  try {
    results = await svc.projectService.scanProjects(undefined, [directory]);
    spinner.succeed(`扫描完成: ${results.length} 个项目`);
  } catch {
    spinner.fail('扫描失败');
    await waitForEnter();
    return;
  }

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
  const projectPath = await selectProject(projects, '选择要导出的项目', matchedConfigs);
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

/**
 * 匹配结果类型：
 * - string: 匹配到的 API 配置模板名称
 * - '__custom__': 配置文件存在且有 env，但不匹配任何模板
 * - null: 配置文件不存在或没有 env 块
 */
type MatchResult = string | '__custom__' | null;

/**
 * 读取项目实际配置，与 API 配置模板比对。
 * 比对依据：只比对 8 个标准 env key，忽略自定义变量。
 */
async function findMatchingConfig(
  projectPath: string,
  configs: Record<string, ApiConfig>
): Promise<MatchResult> {
  const configPath = getProjectConfigPath(projectPath);
  const raw = await fs.readJSON(configPath).catch(() => null);
  const env: Record<string, string> | undefined = raw?.env;

  if (!env) return null;

  for (const [name, tmpl] of Object.entries(configs)) {
    const expected = replaceEnvModel({}, tmpl);
    if (expected.env && envMatches(expected.env, env)) {
      return name;
    }
  }
  return '__custom__';
}

// 标准 8 个 env key，用于比对过滤
const STANDARD_ENV_KEYS = [
  'ANTHROPIC_MODEL',
  'ANTHROPIC_DEFAULT_SONNET_MODEL',
  'ANTHROPIC_DEFAULT_HAIKU_MODEL',
  'ANTHROPIC_DEFAULT_OPUS_MODEL',
  'ANTHROPIC_REASONING_MODEL',
  'CLAUDE_CODE_SUBAGENT_MODEL',
  'ANTHROPIC_AUTH_TOKEN',
  'ANTHROPIC_BASE_URL',
] as const;

/**
 * 比对实际 env 是否匹配某个 API 配置模板（只比对 8 个标准 key，忽略自定义变量）。
 */
function envMatches(expected: Record<string, string>, actual: Record<string, string>): boolean {
  for (const key of STANDARD_ENV_KEYS) {
    if (expected[key] !== actual[key]) return false;
  }
  return true;
}

async function waitForEnter(): Promise<void> {
  console.log(colors.muted('\n按 Enter 继续...'));
  // prompts 会 pause stdin，需要 resume 后才能接收到 data 事件
  if (process.stdin.isPaused()) {
    process.stdin.resume();
  }
  await new Promise<void>((resolve) => {
    process.stdin.once('data', () => {
      process.stdin.pause();
      resolve();
    });
  });
}
