/**
 * 边框字符模块
 *
 * Per D-06: 扁平深度系统，仅边框提升层次
 * Per D-07: 单线边框，无渐变/浮雕效果
 * Per D-11: Windows CMD 使用 ASCII 回退
 */

/**
 * 边框字符定义
 *
 * Unicode: 现代终端 (Windows Terminal, iTerm2, VSCode, truecolor 终端)
 * ASCII: Windows CMD 和基本终端
 */
export const BORDERS = {
  /** Unicode 制表符 (U+2500 区段) */
  unicode: {
    horizontal: '─',  // U+2500
    vertical: '│',    // U+2502
    topLeft: '┌',     // U+250C
    topRight: '┐',    // U+2510
    bottomLeft: '└',  // U+2514
    bottomRight: '┘', // U+2518
    cross: '┼',       // U+253C
  },

  /** ASCII 回退 (per D-11: Windows CMD 兼容) */
  ascii: {
    horizontal: '-',
    vertical: '|',
    topLeft: '+',
    topRight: '+',
    bottomLeft: '+',
    bottomRight: '+',
    cross: '+',
  },
};

/**
 * 根据终端能力获取合适的边框字符
 *
 * 选择逻辑 (per UI-SPEC.md):
 * - Unicode: Windows Terminal, iTerm2, VSCode, COLORTERM=truecolor
 * - ASCII: Windows CMD (win32 无 WT_SESSION)
 *
 * @returns 边框字符集
 */
export function getBorders() {
  const env = process.env;

  // Windows Terminal: 支持 Unicode
  if (env.WT_SESSION) {
    return BORDERS.unicode;
  }

  // 支持 truecolor 的现代终端: 支持 Unicode
  if (env.COLORTERM === 'truecolor' || env.COLORTERM === '24bit') {
    return BORDERS.unicode;
  }

  // macOS 终端: 支持 Unicode
  if (env.TERM_PROGRAM === 'iTerm.app' || env.TERM_PROGRAM === 'vscode') {
    return BORDERS.unicode;
  }

  // Windows CMD (per D-11): ASCII 回退
  if (process.platform === 'win32' && !env.WT_SESSION) {
    return BORDERS.ascii;
  }

  // 默认: Unicode (假定现代终端)
  return BORDERS.unicode;
}
