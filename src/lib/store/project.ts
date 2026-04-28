/**
 * ProjectIndex - Project Metadata Management
 *
 * Manages registered projects with their paths, active configurations, and timestamps.
 * Projects are stored in XDG data directory (projects.json) with:
 * - UUID for stable reference
 * - Path normalization using realpath
 * - pathIndex for fast path-based lookup
 *
 * Key features:
 * - register: Create new project or return existing
 * - getByPath: Fast lookup via pathIndex
 * - getById: Lookup by UUID
 * - update: Modify activeConfig and lastModified
 * - remove: Delete project entry
 * - getAll: Return all registered projects
 */

import { randomUUID } from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import { readJSON, writeJSON, exists } from '../file-system/json.js';
import { createBackup } from '../file-system/backup.js';
import { getDataDir } from '../paths/xdg.js';

/**
 * Project entry stored in projects.json.
 * Represents a registered project directory.
 */
export interface ProjectEntry {
  /** UUID for stable reference ( survives path changes ) */
  id: string;
  /** Project name (defaults to directory name from path) */
  name: string;
  /** Absolute path to project root ( resolved via realpath ) */
  path: string;
  /** Active configuration template name, or null */
  activeConfig: string | null;
  /** ISO timestamp of last modification */
  lastModified: string;
}

/**
 * Internal data structure for projects.json.
 * Maintains both projects keyed by ID and pathIndex for fast lookup.
 */
export interface ProjectIndexData {
  /** Schema version for future migrations */
  version?: number;
  /** Projects keyed by UUID */
  projects: Record<string, ProjectEntry>;
  /** Path -> ID mapping for fast getByPath lookup */
  pathIndex: Record<string, string>;
}

/**
 * Create default empty data structure.
 * Returns a fresh object each time to avoid shared state between instances.
 */
function createDefaultData(): ProjectIndexData {
  return {
    version: 1,
    projects: {},
    pathIndex: {},
  };
}

/**
 * ProjectIndex class for managing registered projects.
 *
 * Usage:
 * ```typescript
 * const index = new ProjectIndex();
 * const entry = await index.register('/path/to/project');
 * const found = await index.getByPath('/path/to/project');
 * await index.update(entry.id, { activeConfig: 'anthropic-template' });
 * await index.remove(entry.id);
 * ```
 */
export class ProjectIndex {
  private filePath: string;
  private data: ProjectIndexData | null = null;

  /**
   * Create ProjectIndex instance.
   *
   * @param filePath - Optional custom file path (for testing).
   *                   Defaults to getDataDir()/projects.json
   */
  constructor(filePath?: string) {
    this.filePath = filePath ?? path.join(getDataDir(), 'projects.json');
  }

  /**
   * Load data from projects.json.
   * Returns cached data if already loaded, otherwise reads from disk.
   * Performs data migration for legacy entries without name field.
   */
  private async load(): Promise<ProjectIndexData> {
    if (this.data !== null) {
      return this.data;
    }

    const loaded = await readJSON<ProjectIndexData>(this.filePath);
    const data = loaded ?? createDefaultData();

    // Migration: Fill missing name field with path basename for legacy entries
    for (const entry of Object.values(data.projects)) {
      if (!entry.name) {
        entry.name = path.basename(entry.path);
      }
    }

    this.data = data;
    return data;
  }

  /**
   * Save data to projects.json with backup.
   * Creates backup before write if file exists.
   */
  private async save(): Promise<void> {
    const data = await this.load();

    // Create backup if file exists
    if (await exists(this.filePath)) {
      await createBackup(this.filePath);
    }

    await writeJSON(this.filePath, data);
  }

  /**
   * Normalize path using fs.realpath.
   * Resolves symlinks to canonical absolute path.
   */
  private async normalizePath(p: string): Promise<string> {
    // Resolve relative to absolute
    const absolute = path.resolve(p);

    // Use realpath to resolve symlinks
    try {
      const real = await fs.realpath(absolute);
      return real;
    } catch {
      // If realpath fails (path doesn't exist), use resolved absolute path
      return absolute;
    }
  }

  /**
   * Register a project directory.
   *
   * - Normalizes path using realpath
   * - Returns existing entry if already registered
   * - Creates new entry with UUID if not registered
   *
   * @param projectPath - Path to project directory
   * @returns Project entry (existing or newly created)
   */
  async register(projectPath: string): Promise<ProjectEntry> {
    const data = await this.load();
    const normalizedPath = await this.normalizePath(projectPath);

    // Check if already registered via pathIndex
    const existingId = data.pathIndex[normalizedPath];
    if (existingId && data.projects[existingId]) {
      return data.projects[existingId];
    }

    // Create new entry with name derived from path basename
    const id = randomUUID();
    const now = new Date().toISOString();
    const name = path.basename(normalizedPath);
    const entry: ProjectEntry = {
      id,
      name,
      path: normalizedPath,
      activeConfig: null,
      lastModified: now,
    };

    // Add to data
    data.projects[id] = entry;
    data.pathIndex[normalizedPath] = id;

    // Persist
    await this.save();

    return entry;
  }

  /**
   * Get project by normalized path.
   * Uses pathIndex for fast lookup.
   *
   * @param projectPath - Path to project directory
   * @returns Project entry or null if not found
   */
  async getByPath(projectPath: string): Promise<ProjectEntry | null> {
    const data = await this.load();
    const normalizedPath = await this.normalizePath(projectPath);

    const id = data.pathIndex[normalizedPath];
    if (!id) {
      return null;
    }

    return data.projects[id] ?? null;
  }

  /**
   * Get project by UUID.
   *
   * @param id - Project UUID
   * @returns Project entry or null if not found
   */
  async getById(id: string): Promise<ProjectEntry | null> {
    const data = await this.load();
    return data.projects[id] ?? null;
  }

  /**
   * Update project metadata.
   *
   * - Updates activeConfig and/or lastModified
   * - Automatically sets lastModified to now
   * - Creates backup before write
   *
   * @param id - Project UUID
   * @param updates - Fields to update (activeConfig, lastModified)
   * @returns true if updated, false if project not found
   */
  async update(
    id: string,
    updates: Partial<Pick<ProjectEntry, 'activeConfig' | 'lastModified'>>
  ): Promise<boolean> {
    const data = await this.load();
    const entry = data.projects[id];

    if (!entry) {
      return false;
    }

    // Apply updates
    if (updates.activeConfig !== undefined) {
      entry.activeConfig = updates.activeConfig;
    }

    // Always update lastModified timestamp
    entry.lastModified = new Date().toISOString();

    // Persist
    await this.save();

    return true;
  }

  /**
   * Remove a project entry.
   *
   * - Deletes entry from projects map
   * - Removes path -> ID mapping from pathIndex
   * - Creates backup before write
   *
   * @param id - Project UUID
   * @returns true if removed, false if project not found
   */
  async remove(id: string): Promise<boolean> {
    const data = await this.load();
    const entry = data.projects[id];

    if (!entry) {
      return false;
    }

    // Remove from projects map
    delete data.projects[id];

    // Remove from pathIndex
    delete data.pathIndex[entry.path];

    // Persist
    await this.save();

    return true;
  }

  /**
   * Get all registered projects.
   *
   * @returns Array of all project entries
   */
  async getAll(): Promise<ProjectEntry[]> {
    const data = await this.load();
    return Object.values(data.projects);
  }

  /**
   * Clear the internal cache.
   * Forces reload from disk on next operation.
   */
  clearCache(): void {
    this.data = null;
  }
}