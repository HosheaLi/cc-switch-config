/**
 * Store Module - Barrel Export
 *
 * Central export point for all data layer modules.
 * Per D-08: src/lib/store/ directory unified management.
 *
 * Import examples:
 * - import { readConfig, writeConfig } from './lib/store/index.js';
 * - import { TemplateStore } from './lib/store/index.js';
 * - import { ProjectIndex } from './lib/store/index.js';
 * - import { AppState } from './lib/store/index.js';
 */

// Config Repository (functions)
export { readConfig, writeConfig, configExists } from './config.js';

// Template Store (class)
export { TemplateStore } from './template.js';
export type { TemplateStoreData } from './template.js';

// API Config Store (class)
export { ApiConfigStore } from './api-config.js';
export type { ApiConfigStoreData } from './api-config.js';

// Project Index (class)
export { ProjectIndex } from './project.js';
export type { ProjectEntry, ProjectIndexData } from './project.js';

// File Watcher (class)
export { FileWatcher } from './watcher.js';
export type { WatcherOptions, WatcherCallback } from './watcher.js';

// App State (class)
export { AppState } from './state.js';
export type { AppStateData } from './state.js';