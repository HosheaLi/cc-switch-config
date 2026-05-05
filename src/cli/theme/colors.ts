/**
 * 颜色定义模块
 *
 * Per D-01: 使用 picocolors 作为标准 ANSI 颜色库
 * Per D-02: OpenCode 温暖色调通过自定义 truecolor ANSI 码实现
 * Per D-03: Apple HIG 语义色 (blue/red/green/yellow)
 */

import pc from 'picocolors';
import { colorSupport } from './detection.js';
import type { ColorSupport } from './detection.js';

/**
 * OpenCode 温暖色调 ANSI 码 (per D-02)
 *
 * #201d1d → RGB(32, 29, 29) → 深色背景
 * #fdfcfc → RGB(253, 252, 252) → 浅色前景
 * #9a9898 → RGB(154, 152, 152) → 柔和文本
 */
export const OPENCODE_PALETTE = {
  /** 背景: #201d1d */
  darkBg: '\x1b[48;2;32;29;29m',
  /** 前景: #fdfcfc */
  lightFg: '\x1b[38;2;253;252;252m',
  /** 柔和: #9a9898 */
  muted: '\x1b[38;2;154;152;152m',
  /** 重置所有 ANSI 码 */
  reset: '\x1b[0m',
};

/**
 * 根据终端能力创建颜色函数
 *
 * @param support - 颜色支持检测结果
 * @returns 颜色函数对象
 */
export function createColors(support: ColorSupport) {
  // truecolor 格式化: 返回 (text) => 带颜色文本 或 纯文本
  const truecolorFg = (code: string) =>
    support.enabled && support.truecolor
      ? (text: string) => `${code}${text}\x1b[39m`
      : (text: string) => text;

  // 非 truecolor 终端，用 picocolors gray 作为 muted 的回退
  const mutedFormatter = support.truecolor
    ? truecolorFg(OPENCODE_PALETTE.muted)
    : support.enabled ? pc.gray : (s: string) => s;

  return {
    // 语义色 (per D-03) - picocolors 标准
    accent: support.enabled ? pc.blue : (s: string) => s,
    danger: support.enabled ? pc.red : (s: string) => s,
    success: support.enabled ? pc.green : (s: string) => s,
    warning: support.enabled ? pc.yellow : (s: string) => s,

    // OpenCode 调色板 (per D-02) - 自定义 truecolor
    background: support.enabled && support.truecolor
      ? (text: string) => `${OPENCODE_PALETTE.darkBg}${text}${OPENCODE_PALETTE.reset}`
      : (text: string) => text,
    foreground: truecolorFg(OPENCODE_PALETTE.lightFg),
    muted: mutedFormatter,

    // 修饰符 - picocolors
    bold: support.enabled ? pc.bold : (s: string) => s,
    dim: support.enabled ? pc.dim : (s: string) => s,
    italic: support.enabled ? pc.italic : (s: string) => s,
    underline: support.enabled ? pc.underline : (s: string) => s,

    // 能力标志
    isColorSupported: support.enabled,
    isTruecolor: support.truecolor,
  };
}

/**
 * 单例颜色对象，使用检测到的终端能力
 */
export const colors = createColors(colorSupport);
