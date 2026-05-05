/**
 * 文本格式化函数模块
 *
 * Per UI-SPEC.md Copywriting Contract:
 * - Message: accent (blue) 用于交互提示、主要操作
 * - Hint: muted (gray) 用于辅助信息、描述
 * - Error: danger (red) + ✗ 符号
 * - Success: success (green) + ✓ 符号
 * - Warning: warning (yellow) + ⚠ 符号
 * - Separator: 水平分隔线 (Unicode 或 ASCII)
 *
 * 安全提示 (T-14-05): 消费者必须对用户输入去除 ANSI 转义码后再传入 formatters，
 * 以防止终端转义注入。
 */

import { colors } from './colors.js';
import { getBorders } from './borders.js';

/**
 * 使用 accent 颜色格式化提示消息
 * Per UI-SPEC: 交互提示、主要操作
 *
 * @param text - 消息文本
 * @returns 格式化后的消息
 */
export function message(text: string): string {
  return colors.accent(text);
}

/**
 * 使用 muted 颜色格式化辅助信息
 * Per UI-SPEC: 辅助信息、引导说明
 *
 * @param text - 提示文本
 * @returns 格式化后的提示
 */
export function hint(text: string): string {
  return colors.muted(text);
}

/**
 * 使用 danger 颜色 + ✗ 符号格式化错误消息
 * Per UI-SPEC: "✗ [Validation error message]"
 *
 * @param text - 错误文本
 * @returns 带符号的格式化错误消息
 */
export function error(text: string): string {
  return colors.danger(`✗ ${text}`);
}

/**
 * 使用 success 颜色 + ✓ 符号格式化成功消息
 * Per UI-SPEC: "✓ Configuration applied successfully"
 *
 * @param text - 成功文本
 * @returns 带符号的格式化成功消息
 */
export function success(text: string): string {
  return colors.success(`✓ ${text}`);
}

/**
 * 使用 warning 颜色 + ⚠ 符号格式化警告消息
 * Per UI-SPEC: "⚠ API key will be replaced"
 *
 * @param text - 警告文本
 * @returns 带符号的格式化警告消息
 */
export function warning(text: string): string {
  return colors.warning(`⚠ ${text}`);
}

/**
 * 创建水平分隔线用于视觉分组
 * Per UI-SPEC: 默认 40 字符宽度
 *
 * @param width - 线宽 (默认: 40)
 * @returns 水平分隔线
 */
export function separator(width: number = 40): string {
  const borders = getBorders();
  return colors.muted(borders.horizontal.repeat(width));
}

/**
 * 使用 danger 颜色格式化取消选项
 * Per UI-SPEC: 用于提示中的 "取消" 选项
 *
 * @param text - 取消文本 (默认: "取消")
 * @returns 格式化后的取消选项
 */
export function cancel(text: string = '取消'): string {
  return colors.danger(text);
}
