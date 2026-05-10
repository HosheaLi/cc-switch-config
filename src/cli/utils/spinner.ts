/**
 * 共享加载动画工具
 *
 * 从 main-wizard 和 scan-wizard 提取的重复 createSpinner 实现。
 */

import { colors } from '../theme/index.js';

export interface Spinner {
  succeed: (msg: string) => void;
  fail: (msg: string) => void;
  stop: () => void;
}

export function createSpinner(message: string): Spinner {
  let frame = 0;
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let cleared = false;

  const interval = setInterval(() => {
    process.stdout.write(`\r${frames[frame]} ${message}`);
    frame = (frame + 1) % frames.length;
  }, 80);

  const clear = () => {
    if (!cleared) {
      clearInterval(interval);
      process.stdout.write('\r' + ' '.repeat(60) + '\r');
      cleared = true;
    }
  };

  return {
    succeed: (msg: string) => {
      clear();
      process.stdout.write(`\r${colors.success('✓')} ${msg}\n`);
    },
    fail: (msg: string) => {
      clear();
      process.stdout.write(`\r${colors.danger('✗')} ${msg}\n`);
    },
    stop: clear,
  };
}
