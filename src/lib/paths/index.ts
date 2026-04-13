/**
 * Cross-Platform Path Resolution
 *
 * Exports all path functions from submodules for unified access.
 */

export {
  getConfigDir,
  getDataDir,
  getCacheDir,
} from './xdg.js';

export {
  getClaudeSettingsPath,
  getClaudeSettingsFilePath,
  getClaudeLocalSettingsFilePath,
} from './claude.js';