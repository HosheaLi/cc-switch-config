/**
 * 共享版本号 - 从 package.json 读取，构建时由 tsup 内联
 */
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

export const VERSION: string = pkg.version;
