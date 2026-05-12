/**
 * E2E 测试辅助工具
 *
 * 创建临时 HOME 目录、设置测试数据、通过 execa 运行 CLI 进程。
 * env-paths 在 macOS 上使用 ~/Library/Preferences/<app> 路径，
 * 所以通过覆盖 HOME 环境变量实现配置隔离。
 */

import path from 'path';
import fs from 'fs-extra';
import { execa, type ExecaChildProcess, type ExecaReturns } from 'execa';

/** E2E 测试上下文 */
export interface E2EContext {
  /** 临时 HOME 目录 */
  homeDir: string;
  /** 临时 Library/Preferences/cc-config-switch (config dir — api-configs.json) */
  configDir: string;
  /** 临时 Library/Application Support/cc-config-switch (data dir — projects.json) */
  dataDir: string;
  /** 测试项目目录 */
  projectsDir: string;
  /** 清理函数 */
  cleanup: () => Promise<void>;
}

/**
 * 创建 E2E 测试环境：
 * - 临时 HOME 目录
 * - config dir:  ~/Library/Preferences/cc-config-switch (ApiConfigStore 用)
 * - data dir:    ~/Library/Application Support/cc-config-switch (ProjectIndex 用)
 * - 临时项目目录
 */
export async function createE2EContext(): Promise<E2EContext> {
  const tmpRoot = path.resolve(process.env.TEST_TMPDIR || '/tmp', `cc-config-e2e-${Date.now()}`);
  const homeDir = path.join(tmpRoot, 'home');
  const configDir = path.join(homeDir, 'Library', 'Preferences', 'cc-config-switch');
  const dataDir = path.join(homeDir, 'Library', 'Application Support', 'cc-config-switch');
  const projectsDir = path.join(tmpRoot, 'projects');

  await fs.ensureDir(configDir);
  await fs.ensureDir(dataDir);
  await fs.ensureDir(projectsDir);

  return {
    homeDir,
    configDir,
    dataDir,
    projectsDir,
    cleanup: async () => {
      await fs.remove(tmpRoot);
    },
  };
}

/**
 * 创建带 .claude/ 目录的测试项目
 */
export async function createTestProject(projectsDir: string, name: string): Promise<string> {
  const projectDir = path.join(projectsDir, name);
  const claudeDir = path.join(projectDir, '.claude');
  const settingsPath = path.join(claudeDir, 'settings.json');

  await fs.ensureDir(claudeDir);

  // 写入默认 settings.json
  await fs.writeJSON(settingsPath, {
    model: 'claude-sonnet-4-20250514',
    permissions: { allow: ['read', 'write'] },
  });

  return projectDir;
}

/**
 * 通过 execa 运行 CLI 命令。
 * 覆盖 HOME 指向临时目录，避免读取用户真实配置。
 */
export function runCLI(
  ctx: E2EContext,
  args: string[],
): ExecaChildProcess {
  return execa(
    'tsx',
    [path.resolve(__dirname, '../../src/index.ts'), ...args],
    {
      env: {
        // 覆盖 HOME 实现 env-paths 路径隔离（macOS 用 ~/Library/Preferences/）
        HOME: ctx.homeDir,
        USER: process.env.USER || 'test',
        PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
        // 禁用颜色输出以便断言
        NO_COLOR: '1',
        FORCE_COLOR: '0',
        TERM: 'dumb',
        // 避免 prompts 默认值或用户配置泄露
        EDITOR: 'cat',
      },
      reject: false,
      timeout: 15_000,
    },
  );
}

/**
 * 运行 CLI 命令并返回解析后的结果
 */
export async function runCLIAndGet(
  ctx: E2EContext,
  args: string[],
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const result = await runCLI(ctx, args);
  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    exitCode: result.exitCode ?? -1,
  };
}

/**
 * 写入 api-configs.json 到临时配置目录
 */
export async function presetApiConfig(
  ctx: E2EContext,
  configs: Record<string, {
    apiKey: string;
    baseUrl: string;
    mode: 'unified' | 'granular';
    modelName?: string;
    env?: Record<string, string>;
  }>,
): Promise<void> {
  const storeData = {
    version: 1,
    configs: Object.fromEntries(
      Object.entries(configs).map(([name, cfg]) => [name, { name, ...cfg }]),
    ),
  };

  await fs.writeJSON(path.join(ctx.configDir, 'api-configs.json'), storeData);
}

/**
 * 写入 projects.json 到临时配置目录
 */
export async function presetProjectIndex(
  ctx: E2EContext,
  projects: Record<string, { name: string; path: string }>,
): Promise<void> {
  const indexData = {
    version: 1,
    projects: Object.fromEntries(
      Object.entries(projects).map(([id, p]) => [id, {
        id,
        name: p.name,
        path: p.path,
        registeredAt: new Date().toISOString(),
      }]),
    ),
    pathIndex: Object.fromEntries(
      Object.entries(projects).map(([, p]) => [p.path, p.name]),
    ),
  };

  await fs.writeJSON(path.join(ctx.dataDir, 'projects.json'), indexData);
}

/**
 * 运行 CLI 命令并通过 stdin 模拟交互输入
 */
export async function runCLIWithInput(
  ctx: E2EContext,
  args: string[],
  input: string,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const result = await execa(
    'tsx',
    [path.resolve(__dirname, '../../src/index.ts'), ...args],
    {
      input,
      env: {
        HOME: ctx.homeDir,
        USER: process.env.USER || 'test',
        PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
        NO_COLOR: '1',
        FORCE_COLOR: '0',
        TERM: 'dumb',
        EDITOR: 'cat',
      },
      reject: false,
      timeout: 30_000,
    },
  );

  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    exitCode: result.exitCode ?? -1,
  };
}
