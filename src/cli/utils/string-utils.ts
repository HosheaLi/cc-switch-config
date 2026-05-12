/**
 * 字符串工具函数
 *
 * 集中管理 ANSI 转义码清理和路径截断等字符串处理函数。
 */

/**
 * 去除字符串中的 ANSI 转义码
 *
 * Per T-14-06, T-14-07: 用户输入在显示前需去除 ANSI 转义码以防注入。
 *
 * @param str - 待处理的字符串
 * @returns 无 ANSI 转义码的字符串
 */
// Match all CSI (Control Sequence Introducer) sequences, not just SGR color codes.
// Pattern: ESC [ followed by parameter bytes (0-9, ;, space) ending with a final byte (A-Z, a-z).
export const stripAnsi = (str: string): string => str.replace(/\x1b\[[\d;]*[A-Za-z]/g, '');

/**
 * 截断路径字符串以适应表格显示
 *
 * @param path - 完整路径
 * @param maxLength - 最大长度（默认 40）
 * @returns 截断后的路径（以 ... 开头）
 */
export function truncatePath(path: string, maxLength: number = 40): string {
  if (path.length <= maxLength) return path;
  return '...' + path.slice(-maxLength + 3);
}