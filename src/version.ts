/**
 * 共享版本号 - 运行时通过 createRequire 从 package.json 读取
 */
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

export const VERSION: string = pkg.version;
