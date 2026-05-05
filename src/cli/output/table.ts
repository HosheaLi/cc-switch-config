/**
 * Table Output Formatter
 *
 * Per UI-01~06: 使用统一主题模块 (picocolors) 替代 chalk。
 * Per T-14-06: 用户输入 (project.path) 在显示前需去除 ANSI 转义码。
 */
import Table from 'cli-table3';
import { colors, getBorders } from '../theme/index.js';
import type { ProjectEntry } from '../../lib/store/project.js';

/**
 * 去除字符串中的 ANSI 转义码 (per T-14-06 安全缓解)
 */
const stripAnsi = (str: string): string => str.replace(/\x1b\[[0-9;]*m/g, '');

export function formatProjectTable(projects: ProjectEntry[]): string {
  if (projects.length === 0) {
    return colors.warning('No projects registered.');
  }

  const borders = getBorders();
  const table = new Table({
    head: [
      colors.accent(colors.bold('Project')),
      colors.accent(colors.bold('Path')),
      colors.accent(colors.bold('Config')),
      colors.accent(colors.bold('Status')),
    ],
    colWidths: [20, 40, 15, 10],
    style: { head: [], border: [] },
    chars: {
      top: borders.horizontal,
      bottom: borders.horizontal,
      left: borders.vertical,
      right: borders.vertical,
      'top-left': borders.topLeft,
      'top-right': borders.topRight,
      'bottom-left': borders.bottomLeft,
      'bottom-right': borders.bottomRight,
      middle: borders.horizontal,
      'left-mid': borders.vertical,
      'mid-mid': borders.cross,
      'right-mid': borders.vertical,
    },
  });

  for (const project of projects) {
    // Use name with fallback to path basename for legacy data safety
    const projectName = project.name ?? project.path.split('/').pop() ?? project.path;
    // T-14-06: 去除用户输入中的潜在 ANSI 转义码
    const safePath = stripAnsi(project.path);
    const configName = project.activeConfig ? colors.success(project.activeConfig) : colors.muted('none');
    const statusIcon = project.activeConfig ? colors.success('✓') : colors.warning('○');

    table.push([colors.foreground(projectName), colors.muted(safePath), configName, statusIcon]);
  }

  return table.toString();
}

export function truncatePath(path: string, maxLength: number = 40): string {
  if (path.length <= maxLength) return path;
  return '...' + path.slice(-maxLength + 3);
}
