/**
 * FileWatcher - Configuration File Monitoring
 *
 * Monitors global and project configuration files for changes using chokidar.
 * Provides debounced event handling to prevent rapid-fire triggers from
 * file editor saves.
 *
 * Key features:
 * - Debounced change detection (awaitWriteFinish)
 * - Graceful handling of file deletion (unlink events)
 * - Dynamic path management (add/remove paths)
 * - Separate callbacks for global vs project config changes
 *
 * Usage:
 * ```typescript
 * const watcher = new FileWatcher({
 *   debounceMs: 200,
 *   onGlobalChange: (filepath) => console.log('Global changed:', filepath),
 *   onProjectChange: (filepath, projectId) => console.log('Project changed:', filepath),
 *   onDelete: (filepath) => console.log('File deleted:', filepath),
 * });
 *
 * await watcher.start(['~/.claude/settings.json', '/project/.claude/settings.json']);
 * // Later...
 * await watcher.stop();
 * ```
 */

import chokidar, { type FSWatcher } from 'chokidar';
import path from 'path';
import os from 'os';
import { getClaudeSettingsFilePath } from '../paths/claude.js';

/**
 * Event types emitted by the watcher.
 */
export type WatcherEvent = 'add' | 'change' | 'unlink';

/**
 * Callback function signature for file change events.
 *
 * @param filepath - Absolute path to the changed file
 * @param event - Type of event that occurred
 */
export type WatcherCallback = (filepath: string, event: WatcherEvent) => void;

/**
 * Options for configuring the FileWatcher.
 */
export interface WatcherOptions {
  /**
   * Debounce time in milliseconds.
   * Prevents rapid-fire events from file editor saves.
   * @default 200
   */
  debounceMs?: number;

  /**
   * Callback for global config file changes.
   * Called when ~/.claude/settings.json changes.
   */
  onGlobalChange?: WatcherCallback;

  /**
   * Callback for project config file changes.
   * Called when a project's .claude/settings.json changes.
   * The projectId can be extracted from the filepath.
   */
  onProjectChange?: WatcherCallback;

  /**
   * Callback for file deletion events.
   * Called when any watched file is deleted (unlink event).
   */
  onDelete?: WatcherCallback;

  /**
   * Callback for file addition events.
   * Called when a new file appears in watched paths.
   */
  onAdd?: WatcherCallback;
}

/**
 * FileWatcher class for monitoring configuration files.
 *
 * Uses chokidar for cross-platform file watching with:
 * - awaitWriteFinish for debouncing
 * - ignoreInitial to skip initial scan events
 * - Graceful ENOENT handling
 */
export class FileWatcher {
  private watcher: FSWatcher | null = null;
  private options: Required<WatcherOptions>;
  private watchedPaths: Set<string> = new Set();

  /**
   * Default debounce threshold (200ms).
   * Based on typical file editor save patterns.
   */
  private static readonly DEFAULT_DEBOUNCE_MS = 200;

  /**
   * Poll interval for awaitWriteFinish (50ms).
   * How often to check if file has stabilized.
   */
  private static readonly POLL_INTERVAL_MS = 50;

  /**
   * Create a FileWatcher instance.
   *
   * @param options - Watcher configuration options
   */
  constructor(options: WatcherOptions = {}) {
    this.options = {
      debounceMs: options.debounceMs ?? FileWatcher.DEFAULT_DEBOUNCE_MS,
      onGlobalChange: options.onGlobalChange ?? (() => {}),
      onProjectChange: options.onProjectChange ?? (() => {}),
      onDelete: options.onDelete ?? (() => {}),
      onAdd: options.onAdd ?? (() => {}),
    };
  }

  /**
   * Get the global config file path (~/.claude/settings.json).
   *
   * @returns Absolute path to global Claude settings file
   */
  static getGlobalConfigPath(): string {
    return getClaudeSettingsFilePath();
  }

  /**
   * Get the project config file path for a given project directory.
   *
   * @param projectPath - Absolute path to project root
   * @returns Absolute path to project's .claude/settings.json
   */
  static getProjectConfigPath(projectPath: string): string {
    return path.join(projectPath, '.claude', 'settings.json');
  }

  /**
   * Check if a filepath is the global config file.
   *
   * @param filepath - Path to check
   * @returns true if filepath is the global config file
   */
  private isGlobalConfig(filepath: string): boolean {
    const globalPath = FileWatcher.getGlobalConfigPath();
    // Normalize both paths for comparison
    const normalizedFilepath = path.resolve(filepath);
    const normalizedGlobal = path.resolve(globalPath);
    return normalizedFilepath === normalizedGlobal;
  }

  /**
   * Determine the event type and call appropriate callback.
   *
   * @param filepath - Path to the changed file
   * @param event - Type of event ('add', 'change', 'unlink')
   */
  private handleEvent(filepath: string, event: WatcherEvent): void {
    // Handle deletion events separately
    if (event === 'unlink') {
      this.options.onDelete(filepath, event);
      this.watchedPaths.delete(filepath);
      return;
    }

    // Handle add events
    if (event === 'add') {
      this.options.onAdd(filepath, event);
      this.watchedPaths.add(filepath);
      return;
    }

    // Handle change events - determine if global or project
    if (this.isGlobalConfig(filepath)) {
      this.options.onGlobalChange(filepath, event);
    } else {
      this.options.onProjectChange(filepath, event);
    }
  }

  /**
   * Start watching the specified paths.
   *
   * - Sets up chokidar watcher with debouncing
   * - Ignores initial scan events
   * - Waits for 'ready' event before resolving
   *
   * @param paths - Array of file paths to watch
   * @throws Error if watcher fails to initialize
   */
  async start(paths: string[]): Promise<void> {
    // Normalize paths
    const normalizedPaths = paths.map(p => {
      // Handle ~ expansion
      if (p.startsWith('~')) {
        return path.join(os.homedir(), p.slice(1));
      }
      return path.resolve(p);
    });

    // Create watcher with debouncing options
    this.watcher = chokidar.watch(normalizedPaths, {
      // Don't fire events on initial scan
      ignoreInitial: true,

      // Debounce rapid file changes
      awaitWriteFinish: {
        stabilityThreshold: this.options.debounceMs,
        pollInterval: FileWatcher.POLL_INTERVAL_MS,
      },

      // Use polling on systems where fsevents isn't available
      usePolling: false,

      // Interval for polling (if usePolling is true)
      interval: 100,
    });

    // Set up event handlers
    this.watcher.on('add', (filepath: string) => {
      this.handleEvent(filepath, 'add');
    });

    this.watcher.on('change', (filepath: string) => {
      this.handleEvent(filepath, 'change');
    });

    this.watcher.on('unlink', (filepath: string) => {
      this.handleEvent(filepath, 'unlink');
    });

    // Handle errors gracefully
    this.watcher.on('error', (err: unknown) => {
      // Log error but don't throw - keep watcher running
      const message = err instanceof Error ? err.message : String(err);
      console.error(`FileWatcher error: ${message}`);
    });

    // Wait for watcher to be ready
    await new Promise<void>((resolve, reject) => {
      if (!this.watcher) {
        reject(new Error('Watcher not initialized'));
        return;
      }

      this.watcher.on('ready', () => {
        // Track watched paths
        normalizedPaths.forEach(p => this.watchedPaths.add(p));
        resolve();
      });

      // Timeout for safety (watcher should be ready quickly)
      const timeout = setTimeout(() => {
        reject(new Error('Watcher ready timeout'));
      }, 5000);

      // Clear timeout when ready
      this.watcher.on('ready', () => {
        clearTimeout(timeout);
      });

      // Reject on error during initialization to prevent 5-second hang
      this.watcher.once('error', (err: unknown) => {
        clearTimeout(timeout);
        reject(err instanceof Error ? err : new Error(String(err)));
      });
    });
  }

  /**
   * Stop watching and close the watcher.
   *
   * - Closes chokidar watcher
   * - Clears tracked paths
   * - Safe to call multiple times
   */
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
    this.watchedPaths.clear();
  }

  /**
   * Add a new path to watch.
   *
   * - Dynamically adds path to existing watcher
   * - If watcher not started, throws error
   *
   * @param filepath - Path to add
   * @throws Error if watcher not started
   */
  addPath(filepath: string): void {
    if (!this.watcher) {
      throw new Error('Watcher not started. Call start() first.');
    }

    // Normalize path
    let normalized = filepath;
    if (filepath.startsWith('~')) {
      normalized = path.join(os.homedir(), filepath.slice(1));
    } else {
      normalized = path.resolve(filepath);
    }

    this.watcher.add(normalized);
    this.watchedPaths.add(normalized);
  }

  /**
   * Remove a path from watching.
   *
   * - Dynamically removes path from watcher
   * - Safe to call even if path not being watched
   *
   * @param filepath - Path to remove
   * @throws Error if watcher not started
   */
  removePath(filepath: string): void {
    if (!this.watcher) {
      throw new Error('Watcher not started. Call start() first.');
    }

    // Normalize path
    let normalized = filepath;
    if (filepath.startsWith('~')) {
      normalized = path.join(os.homedir(), filepath.slice(1));
    } else {
      normalized = path.resolve(filepath);
    }

    this.watcher.unwatch(normalized);
    this.watchedPaths.delete(normalized);
  }

  /**
   * Get the list of currently watched paths.
   *
   * @returns Array of normalized absolute paths being watched
   */
  getWatchedPaths(): string[] {
    return Array.from(this.watchedPaths);
  }

  /**
   * Check if a path is being watched.
   *
   * @param filepath - Path to check
   * @returns true if path is being watched
   */
  isWatching(filepath: string): boolean {
    // Normalize path for comparison
    let normalized = filepath;
    if (filepath.startsWith('~')) {
      normalized = path.join(os.homedir(), filepath.slice(1));
    } else {
      normalized = path.resolve(filepath);
    }

    return this.watchedPaths.has(normalized);
  }

  /**
   * Check if the watcher is currently active.
   *
   * @returns true if watcher is running
   */
  isActive(): boolean {
    return this.watcher !== null;
  }
}