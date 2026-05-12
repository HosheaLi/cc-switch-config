/**
 * ProjectService - Project Management Service
 *
 * Handles project detection, registration, listing, and management operations.
 * Per D-01: Services as classes + constructor injection.
 * Per D-04: Auto scan user-configured roots + manual confirm.
 * Per D-05: Scan directories stored in AppState.
 * Per F4: ProjectService handles project index and CRUD operations.
 *
 * Key features:
 * - scanProjects: Find .claude directories within configured roots
 * - registerProject: Create project entries via ProjectIndex
 * - listProjects: Return all registered projects
 * - update/remove: CRUD operations on project entries
 * - scanDirectories management via AppState
 */

import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import { DEFAULT_SKIP_DIRS } from '../constants/skip-dirs.js';
import { ServiceError } from './types.js';
import type { ProjectEntry } from '../store/project.js';
import type { AppState } from '../store/state.js';
import type { ProjectIndex } from '../store/project.js';

/**
 * Result of scanning for projects.
 * Indicates whether a found project is new or already registered.
 */
export interface ScanResult {
  /** Absolute path to the project directory */
  path: string;
  /** True if not yet registered in ProjectIndex */
  isNew: boolean;
}

/**
 * ProjectService class for managing projects.
 *
 * Usage:
 * ```typescript
 * const service = new ProjectService(projectIndex, appState);
 * const results = await service.scanProjects();
 * const entry = await service.registerProject('/path/to/project');
 * const all = await service.listProjects();
 * ```
 */
export class ProjectService {
  /** Default maximum depth for directory scanning */
  private defaultMaxDepth: number = 3;
  private logger: { error: (msg: string) => void };

  /**
   * Create ProjectService instance.
   *
   * @param projectIndex - ProjectIndex instance for project persistence
   * @param appState - AppState instance for scan directories configuration
   * @param logger - Optional custom error logger (defaults to console.error)
   */
  constructor(
    private projectIndex: ProjectIndex,
    private appState: AppState,
    logger?: { error: (msg: string) => void }
  ) {
    this.logger = logger ?? console;
  }

  /**
   * Get merged skip directories list.
   * Per D-10: Merge DEFAULT_SKIP_DIRS with user skipDirectories.
   *
   * @returns Array of directory names to skip during scanning
   */
  private getSkipDirectories(): string[] {
    const userSkipDirs = this.appState.get('skipDirectories') ?? [];
    return [...DEFAULT_SKIP_DIRS, ...userSkipDirs];
  }

  /**
   * Scan configured directories for .claude projects.
   * Per D-04: Auto scan user-configured roots with depth limit.
   *
   * @param maxDepth - Optional override for maximum scan depth (default: 3)
   * @returns Array of ScanResult with paths and isNew flags
   */
  async scanProjects(maxDepth?: number, overrideDirs?: string[]): Promise<ScanResult[]> {
    const rootDirs = overrideDirs ?? this.appState.get('scanDirectories');

    const depth = maxDepth ?? this.defaultMaxDepth;
    const found: string[] = [];
    const skipDirs = this.getSkipDirectories();

    // Default to current directory if no scan directories configured and no override
    const dirsToScan = rootDirs.length > 0 ? rootDirs : ['.'];

    // Validate directories exist before scanning
    const validDirs: string[] = [];
    const invalidDirs: string[] = [];
    for (const rootDir of dirsToScan) {
      const expanded = this.expandPath(rootDir);
      if (await fs.pathExists(expanded)) {
        validDirs.push(rootDir);
      } else {
        invalidDirs.push(expanded);
      }
    }

    if (validDirs.length === 0) {
      // 所有目录都不存在，抛出 ServiceError
      const message = invalidDirs.length > 0
        ? `没有有效的扫描目录: ${invalidDirs.join(', ')}`
        : '没有有效的扫描目录';
      throw new ServiceError(message, 'SCAN_DIR_NOT_FOUND');
    }

    // 记录无效目录（非关键错误，继续扫描有效目录）
    if (invalidDirs.length > 0) {
      this.logger.error(`跳过无效目录: ${invalidDirs.join(', ')}`);
    }

    for (const rootDir of validDirs) {
      const expanded = this.expandPath(rootDir);
      await this.walkDirectory(expanded, 0, depth, found, skipDirs);
    }

    // Mark which are new vs already registered
    const results: ScanResult[] = [];
    for (const projectPath of found) {
      const existing = await this.projectIndex.getByPath(projectPath);
      results.push({
        path: projectPath,
        isNew: existing === null
      });
    }

    return results;
  }

  /**
   * Recursively walk a directory to find .claude projects.
   * Per D-05: Uses Promise.all for parallel subdirectory scanning.
   * Per D-06: Independent catch per subdirectory (partial failure continues).
   * Per D-08/D-10: Skips DEFAULT_SKIP_DIRS + user skipDirectories.
   *
   * @param dir - Directory to scan
   * @param depth - Current depth level
   * @param maxDepth - Maximum depth limit
   * @param found - Accumulator for found project paths
   * @param skipDirs - Directory names to skip (merged defaults + user)
   */
  private async walkDirectory(
    dir: string,
    depth: number,
    maxDepth: number,
    found: string[],
    skipDirs: string[]
  ): Promise<void> {
    if (depth > maxDepth) return;

    // Check if this directory has .claude/settings.json or .claude/settings.local.json
    const claudeDir = path.join(dir, '.claude');
    if (await fs.pathExists(path.join(claudeDir, 'settings.json')) ||
        await fs.pathExists(path.join(claudeDir, 'settings.local.json'))) {
      found.push(dir);
    }

    // 当遍历到名为 .claude 的子目录时，如果该目录本身包含
    // settings.local.json，将其作为普通项目注册。例如扫描 ~/.claude 时
    // 额外发现 ~/.claude/.claude/settings.local.json。
    if (path.basename(dir) === '.claude') {
      if (await fs.pathExists(path.join(dir, 'settings.local.json'))) {
        if (!found.includes(dir)) {
          found.push(dir);
        }
      }
    }

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      // Filter directories to scan using skip directories list
      const subdirs = entries
        .filter(e => e.isDirectory())
        .filter(e => !skipDirs.includes(e.name))
        .map(e => path.join(dir, e.name));

      // D-05: Promise.all parallel scan
      // D-06: Independent catch per subdirectory
      await Promise.all(
        subdirs.map(async (subdir) => {
          try {
            await this.walkDirectory(subdir, depth + 1, maxDepth, found, skipDirs);
          } catch (err) {
            // D-07: console.error log, continue others
            if (err instanceof Error) {
              this.logger.error(`Scan skipped directory ${subdir}: ${err.message}`);
            }
          }
        })
      );
    } catch (err) {
      // Permission errors at this level - skip
      if (err instanceof Error) {
        this.logger.error(`Scan skipped directory ${dir}: ${err.message}`);
      }
    }
  }

  /**
   * Expand ~ to home directory in paths.
   *
   * @param p - Path that may start with ~
   * @returns Expanded absolute path
   */
  private expandPath(p: string): string {
    if (p.startsWith('~')) {
      return path.join(os.homedir(), p.slice(1));
    }
    return path.resolve(p);
  }

  /**
   * List all registered projects.
   * Per F4: Return all project entries.
   *
   * @returns Array of all ProjectEntry
   */
  async listProjects(): Promise<ProjectEntry[]> {
    return this.projectIndex.getAll();
  }

  /**
   * Register a new project.
   * Creates entry via ProjectIndex.
   *
   * @param projectPath - Path to project directory
   * @returns Created ProjectEntry
   * @throws ServiceError if registration fails
   */
  async registerProject(projectPath: string): Promise<ProjectEntry> {
    try {
      return await this.projectIndex.register(projectPath);
    } catch (error) {
      if (error instanceof Error) {
        throw new ServiceError(
          `Failed to register project at ${projectPath}: ${error.message}`,
          'PROJECT_REGISTER_FAILED'
        );
      }
      throw error;
    }
  }

  /**
   * Get project by path.
   *
   * @param projectPath - Path to search for
   * @returns ProjectEntry or null if not found
   */
  async getProjectByPath(projectPath: string): Promise<ProjectEntry | null> {
    return this.projectIndex.getByPath(projectPath);
  }

  /**
   * Get project by ID.
   *
   * @param id - Project UUID
   * @returns ProjectEntry or null if not found
   */
  async getProjectById(id: string): Promise<ProjectEntry | null> {
    return this.projectIndex.getById(id);
  }

  /**
   * Update project configuration.
   *
   * @param id - Project UUID
   * @param updates - Fields to update (name, path, activeConfig)
   * @returns true if updated, false if project not found
   */
  async updateProject(
    id: string,
    updates: Partial<Pick<ProjectEntry, 'name' | 'path' | 'activeConfig'>>
  ): Promise<boolean> {
    return this.projectIndex.update(id, updates);
  }

  /**
   * Remove a project from the index.
   *
   * @param id - Project UUID
   * @returns true if removed, false if project not found
   */
  async removeProject(id: string): Promise<boolean> {
    return this.projectIndex.remove(id);
  }

  /**
   * Get configured scan directories.
   * Per D-05: Read from AppState.
   *
   * @returns Array of configured directory paths
   */
  getScanDirectories(): string[] {
    return this.appState.get('scanDirectories');
  }

  /**
   * Add a scan directory.
   * Per D-05: Update AppState.
   *
   * @param dir - Directory path to add
   */
  addScanDirectory(dir: string): void {
    const current = this.appState.get('scanDirectories');
    if (!current.includes(dir)) {
      this.appState.set('scanDirectories', [...current, dir]);
    }
  }

  /**
   * Remove a scan directory.
   * Per D-05: Update AppState.
   *
   * @param dir - Directory path to remove
   */
  removeScanDirectory(dir: string): void {
    const current = this.appState.get('scanDirectories');
    this.appState.set('scanDirectories', current.filter(d => d !== dir));
  }
}