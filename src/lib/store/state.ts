/**
 * AppState - Application-wide State Persistence
 *
 * Manages application state using the conf package for persistence.
 * Per DATA-05: AppState stores active project, UI preferences, and recent projects.
 *
 * Key features:
 * - Persisted state across application restarts
 * - Active project tracking
 * - UI preferences (theme, showPreview)
 * - Recent projects list (max 10 entries)
 *
 * Dependencies:
 * - conf package for XDG-compliant config storage
 */

import Conf from 'conf';

/**
 * Application state data structure.
 * Stored in XDG config directory (cc-config-switch.json).
 */
export interface AppStateData {
  /** Currently active project ID (UUID) */
  activeProjectId: string | null;
  /** Last used template name */
  lastUsedTemplate: string | null;
  /** UI display preferences */
  uiPreferences: {
    theme: 'dark' | 'light';
    showPreview: boolean;
  };
  /** Recent projects list (max 10 entries, most recent first) */
  recentProjects: string[];
}

/**
 * Default state values.
 * Applied when state is cleared or first initialized.
 */
const DEFAULT_STATE: AppStateData = {
  activeProjectId: null,
  lastUsedTemplate: null,
  uiPreferences: {
    theme: 'dark',
    showPreview: true,
  },
  recentProjects: [],
};

/**
 * AppState class for managing application-wide persisted state.
 *
 * Usage:
 * ```typescript
 * const state = new AppState();
 * const activeId = state.getActiveProject();
 * state.setActiveProject('project-uuid');
 * state.set('uiPreferences', { theme: 'light', showPreview: false });
 * state.clear(); // Reset to defaults
 * ```
 */
export class AppState {
  /**
   * Conf instance for state persistence.
   * Uses XDG-compliant config directory.
   */
  private conf: Conf<AppStateData>;

  /**
   * Create AppState instance.
   *
   * @param projectName - Optional project name for conf storage.
   *                      Defaults to 'cc-config-switch'.
   *                      Use different name for testing to avoid pollution.
   */
  constructor(projectName: string = 'cc-config-switch') {
    this.conf = new Conf<AppStateData>({
      projectName,
      defaults: DEFAULT_STATE,
    });
  }

  /**
   * Get a state value by key.
   *
   * @param key - State key from AppStateData
   * @returns Current value for the key
   */
  get<K extends keyof AppStateData>(key: K): AppStateData[K] {
    return this.conf.get(key);
  }

  /**
   * Set a state value by key.
   *
   * @param key - State key from AppStateData
   * @param value - Value to set
   */
  set<K extends keyof AppStateData>(key: K, value: AppStateData[K]): void {
    this.conf.set(key, value);
  }

  /**
   * Get the currently active project ID.
   *
   * @returns Active project UUID or null if none set
   */
  getActiveProject(): string | null {
    return this.conf.get('activeProjectId');
  }

  /**
   * Set the active project.
   *
   * Updates activeProjectId and manages recentProjects list:
   * - Adds project to recent list if new
   * - Moves to front if already in list
   * - Caps list at 10 entries
   *
   * @param projectId - Project UUID to set as active
   */
  setActiveProject(projectId: string): void {
    // Update active project ID
    this.conf.set('activeProjectId', projectId);

    // Update recent projects list
    const recentProjects = this.conf.get('recentProjects');

    // Remove if already exists (will be added to front)
    const filtered = recentProjects.filter((id) => id !== projectId);

    // Add to front, cap at 10
    const updated = [projectId, ...filtered].slice(0, 10);

    this.conf.set('recentProjects', updated);
  }

  /**
   * Get the file path where state is persisted.
   *
   * @returns Absolute path to state JSON file
   */
  getFilePath(): string {
    return this.conf.path;
  }

  /**
   * Clear all state and reset to defaults.
   */
  clear(): void {
    this.conf.clear();
  }
}