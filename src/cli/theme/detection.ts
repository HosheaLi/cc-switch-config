/**
 * 终端能力检测模块
 *
 * Per D-08, D-09: NO_COLOR 完全禁用所有 ANSI 颜色
 * Per D-10: TERM_PROGRAM 用于 macOS 终端，WT_SESSION 用于 Windows Terminal
 * Per D-11: Windows CMD 有 ANSI 支持 (Win 10+) 但无 truecolor
 */

export interface ColorSupport {
  /** 是否支持 ANSI 颜色 */
  enabled: boolean;
  /** 是否支持 24-bit truecolor (RGB) */
  truecolor: boolean;
  /** 检测原因 (调试用) */
  reason: string;
}

/**
 * 检测终端颜色支持能力
 *
 * 检测顺序 (per RESEARCH.md):
 * 1. NO_COLOR → 禁用所有颜色 (D-08, D-09)
 * 2. FORCE_COLOR → 覆盖检测，启用颜色
 * 3. WT_SESSION → Windows Terminal，支持 truecolor (D-10)
 * 4. COLORTERM → truecolor 指示器
 * 5. TERM_PROGRAM → macOS 终端 (iTerm2, Apple Terminal)
 * 6. Windows platform → ANSI 支持，无 truecolor (D-11)
 * 7. 默认 → 基本 ANSI，无 truecolor
 */
export function detectColorSupport(): ColorSupport {
  const env = process.env;

  // D-08, D-09: NO_COLOR 完全禁用颜色
  if (env.NO_COLOR && env.NO_COLOR !== '') {
    return { enabled: false, truecolor: false, reason: 'NO_COLOR set' };
  }

  // FORCE_COLOR 覆盖检测
  if (env.FORCE_COLOR) {
    return { enabled: true, truecolor: false, reason: 'FORCE_COLOR set' };
  }

  // D-10: Windows Terminal (WT_SESSION)
  if (env.WT_SESSION) {
    return { enabled: true, truecolor: true, reason: 'Windows Terminal' };
  }

  // COLORTERM 表示 truecolor 支持
  if (env.COLORTERM === 'truecolor' || env.COLORTERM === '24bit') {
    return { enabled: true, truecolor: true, reason: 'COLORTERM=truecolor' };
  }

  // D-10: macOS 终端 (TERM_PROGRAM)
  if (env.TERM_PROGRAM === 'iTerm.app') {
    return { enabled: true, truecolor: true, reason: 'iTerm2' };
  }
  if (env.TERM_PROGRAM === 'Apple_Terminal') {
    return { enabled: true, truecolor: false, reason: 'macOS Terminal' };
  }
  if (env.TERM_PROGRAM === 'vscode') {
    return { enabled: true, truecolor: true, reason: 'VSCode terminal' };
  }

  // D-11: Windows CMD (ANSI 支持，无 truecolor)
  if (process.platform === 'win32') {
    return { enabled: true, truecolor: false, reason: 'Windows ANSI' };
  }

  // 默认: 基本 ANSI 支持
  return { enabled: true, truecolor: false, reason: 'default' };
}

/**
 * 单例颜色支持检测结果
 * 模块加载时计算一次，确保行为一致
 */
export const colorSupport = detectColorSupport();
