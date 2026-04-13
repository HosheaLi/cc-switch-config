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

import path from 'path';
import fs from 'fs-extra';
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

  /**
   * Create ProjectService instance.
   *
   * @param projectIndex - ProjectIndex instance for project persistence
   * @param appState - AppState instance for scan directories configuration
   */
  constructor(
    private projectIndex: ProjectIndex,
    private appState: AppState
  ) {}

  /**
   * Scan configured directories for .claude projects.
   * Per D-04: Auto scan user-configured roots with depth limit.
   *
   * @param maxDepth - Optional override for maximum scan depth (default: 3)
   * @returns Array of ScanResult with paths and isNew flags
   */
  async scanProjects(maxDepth?: number): Promise<ScanResult[]> {
    const rootDirs = this.appState.get('scanDirectories');
    if (rootDirs.length === 0) {
      return [];
    }

    const depth = maxDepth ?? this.defaultMaxDepth;
    const found: string[] = [];

    for (const rootDir of rootDirs) {
      const expanded = this.expandPath(rootDir);
      await this.walkDirectory(expanded, 0, depth, found);
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
   * Skips hidden directories and node_modules.
   *
   * @param dir - Directory to scan
   * @param depth - Current depth level
   * @param maxDepth - Maximum depth limit
   * @param found - Accumulator for found project paths
   */
  private async walkDirectory(
    dir: string,
    depth: number,
    maxDepth: number,
    found: string[]
  ): Promise<void> {
    if (depth > maxDepth) return;

    // Check if this directory has .claude/settings.json
    const claudePath = path.join(dir, '.claude', 'settings.json');
    if (await fs.pathExists(claudePath)) {
      found.push(dir);
    }

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        // Skip hidden dirs and node_modules
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await this.walkDirectory(path.join(dir, entry.name), depth + 1, maxDepth, found);
        }
      }
    } catch {
      // Permission errors or other issues - skip this directory
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
      return path.join(process.env.HOME ?? '', p.slice(1));
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
   * @param updates - Fields to update (activeConfig)
   * @returns true if updated, false if project not found
   */
  async updateProject(
    id: string,
    updates: Partial<Pick<ProjectEntry, 'activeConfig'>>
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