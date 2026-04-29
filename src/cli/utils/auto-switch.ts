/**
 * Auto-Switch Utility - Directory-based Project Switching
 *
 * Per D-01: Shell hook like direnv, detect project directory and apply config.
 * Per D-02: Silent output, only message on actual switch.
 * Per D-03: Prompt to register new project when .claude detected.
 *
 * This module provides the core logic for the auto-check shell hook:
 * - detectAutoSwitch: Determine if a switch should occur
 * - applyAutoSwitch: Apply the switch to app state
 * - formatSwitchMessage: Format output message (silent unless switch)
 */

import path from 'path';
import fs from 'fs-extra';
import type { ProjectIndex } from '../../lib/store/project.js';
import type { AppState } from '../../lib/store/state.js';

/**
 * Result of auto-switch detection.
 * Contains all information needed to apply the switch and format output.
 */
export interface AutoSwitchResult {
  /** Whether a project switch occurred */
  switched: boolean;
  /** Project UUID if registered project found */
  projectId: string | null;
  /** Project name (derived from path basename) if found */
  projectName: string | null;
  /** Active template name if project has one configured */
  templateName: string | null;
  /** D-03: Found .claude directory but project not registered */
  unregisteredDir: boolean;
}

/**
 * Detect if auto-switch should occur based on current directory.
 * Per D-01: Check registered projects and .claude directories.
 * Per D-02: Return switched=true only on actual change.
 *
 * @param cwd - Current working directory to check
 * @param projectIndex - Project index for registered project lookup
 * @param appState - App state for active project tracking
 * @returns AutoSwitchResult with switch decision and metadata
 */
export async function detectAutoSwitch(
  cwd: string,
  projectIndex: ProjectIndex,
  appState: AppState
): Promise<AutoSwitchResult> {
  // Try to find registered project by path
  const project = await projectIndex.getByPath(cwd);

  if (project) {
    // Found registered project
    const currentActiveId = appState.getActiveProject();

    // D-02: Only switch if different from current
    const switched = currentActiveId !== project.id;

    // Derive project name from path basename
    const projectName = path.basename(project.path);

    return {
      switched,
      projectId: project.id,
      projectName,
      templateName: project.activeConfig,
      unregisteredDir: false,
    };
  }

  // Not registered - check for .claude directory (D-03)
  const claudeDir = path.join(cwd, '.claude');
  const settingsPath = path.join(claudeDir, 'settings.json');
  const localSettingsPath = path.join(claudeDir, 'settings.local.json');
  const hasClaudeDir = await fs.pathExists(settingsPath) || await fs.pathExists(localSettingsPath);

  if (hasClaudeDir) {
    // D-03: Found .claude but not registered
    return {
      switched: false,
      projectId: null,
      projectName: null,
      templateName: null,
      unregisteredDir: true,
    };
  }

  // No project found, no .claude directory
  return {
    switched: false,
    projectId: null,
    projectName: null,
    templateName: null,
    unregisteredDir: false,
  };
}

/**
 * Apply auto-switch to app state.
 * Updates active project if switch detected.
 *
 * @param result - AutoSwitchResult from detectAutoSwitch
 * @param appState - App state to update
 */
export function applyAutoSwitch(result: AutoSwitchResult, appState: AppState): void {
  if (result.projectId) {
    appState.setActiveProject(result.projectId);
  }
  // No file writes - just state update
}

/**
 * Format switch message for output.
 * Per D-02: Return null if no switch (silent mode).
 *
 * @param result - AutoSwitchResult from detectAutoSwitch
 * @returns Message string or null for silent output
 */
export function formatSwitchMessage(result: AutoSwitchResult): string | null {
  // D-02: Silent unless actual switch
  if (!result.switched && !result.unregisteredDir) {
    return null;
  }

  // D-03: Prompt for unregistered .claude directories
  if (result.unregisteredDir) {
    return 'Found .claude directory. Register with: cc-config register <path>';
  }

  // D-02: Message on actual switch
  if (result.switched && result.projectName) {
    const lines: string[] = [`Switched to project: ${result.projectName}`];

    if (result.templateName) {
      lines.push(`Template: ${result.templateName}`);
    }

    return lines.join('\n');
  }

  return null;
}