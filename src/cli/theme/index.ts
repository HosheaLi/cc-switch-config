/**
 * Theme 模块 Barrel Export
 *
 * Terminal-Native 设计系统统一入口。
 *
 * Per D-01~11: 统一 ANSI 颜色格式化、终端能力检测、
 * 边框字符和文本格式化函数。
 *
 * 用法:
 *   import { colors, formatters, getBorders } from '../theme/index.js';
 *
 *   console.log(formatters.success('Configuration applied'));
 *   console.log(formatters.error('Validation failed'));
 *
 * 安全提示 (T-14-05): 消费者必须对用户输入去除 ANSI 转义码后再传入 formatters，
 * 以防止终端转义注入。
 */

// 颜色定义
export { colors, OPENCODE_PALETTE, createColors } from './colors.js';
export type { ColorSupport } from './detection.js';

// 终端能力检测
export { detectColorSupport, colorSupport } from './detection.js';

// 边框字符
export { BORDERS, getBorders } from './borders.js';

// 文本格式化函数 (namespace export for grouped access)
export * as formatters from './formatters.js';

// 也导出个别格式化函数，方便直接使用
export { message, hint, error, success, warning, separator, cancel } from './formatters.js';
