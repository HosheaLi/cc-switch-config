/**
 * TUI Launch Utility - Real Implementation (Phase 06)
 *
 * Per D-02: No args launches TUI.
 * Per D-06: switch without argument calls TUI selection.
 * Per D-08: scan command with --tui launches ScanScreen.
 *
 * This module connects CLI to the Ink-based TUI screens.
 */

import { runTUI } from '../../tui/index.js';
import { TemplateService, ProjectService } from '../../lib/services/index.js';
import type { ScanResult } from '../../lib/services/index.js';
import { TemplateStore } from '../../lib/store/index.js';
import { readConfig, writeConfig } from '../../lib/store/config.js';
import chalk from 'chalk';

/**
 * Launch the main TUI application.
 * Per D-02: Called when no CLI arguments provided.
 *
 * @returns Promise that resolves when TUI exits
 */
export async function launchTUI(): Promise<void> {
  await runTUI();
}

/**
 * Launch TUI for template selection.
 * Per D-06: Called when switch command has no argument.
 *
 * Note: Full template selection TUI would require a TemplateSelectScreen.
 * For Phase 06, this provides a fallback that lists available templates
 * and prompts user to specify the template name via CLI.
 *
 * Future enhancement (Phase 07): Add interactive template selection screen.
 *
 * @returns Selected template name or null if cancelled
 */
export async function selectTemplateInTUI(): Promise<string | null> {
  // Create template service for listing templates
  const templateStore = new TemplateStore();
  const templateService = new TemplateService(templateStore, readConfig, writeConfig);

  try {
    const templates = await templateService.listTemplates();

    if (templates.length === 0) {
      console.log(chalk.yellow('No templates available.'));
      console.log(chalk.gray('Create a template first: cc-config template create <name>'));
      return null;
    }

    // For Phase 06, list templates and prompt user to use CLI with argument
    // This is a simplified approach - full TUI selection is Phase 07
    console.log(chalk.cyan('Available templates:'));
    for (const name of templates) {
      console.log(chalk.white(`  - ${name}`));
    }
    console.log(chalk.gray('\nPlease specify template name: cc-config switch <template-name>'));
    console.log(chalk.gray('Or use interactive selection in future versions.'));

    return null; // Return null to indicate user should use CLI with argument
  } catch (error) {
    if (error instanceof Error) {
      console.log(chalk.red(`Error listing templates: ${error.message}`));
    }
    return null;
  }
}

/**
 * Launch TUI for scan results multi-select.
 * Per D-08: Called when scan command has --tui flag.
 * Per D-09: ScanScreen displays new projects with checkbox multi-select.
 *
 * Note: Full ScanScreen implementation is in Phase 07-02.
 * This placeholder returns results and prompts CLI usage until ScanScreen is ready.
 *
 * @param results - Scan results from ProjectService.scanProjects()
 * @param service - ProjectService instance for registration
 * @returns Promise that resolves when TUI exits
 */
export async function launchScanTUI(
  results: ScanResult[],
  service: ProjectService
): Promise<void> {
  const newProjects = results.filter(r => r.isNew);

  if (newProjects.length === 0) {
    console.log(chalk.yellow('No new projects found.'));
    console.log(chalk.gray('All discovered projects are already registered.'));
    return;
  }

  // For Phase 07-02, list new projects and prompt registration via CLI
  // Full TUI multi-select is implemented in ScanScreen.tsx
  console.log(chalk.cyan('New projects found:'));
  for (const result of newProjects) {
    const name = result.path.split('/').pop() ?? result.path;
    console.log(chalk.white(`  - ${name} (${result.path})`));
  }

  console.log(chalk.gray('\nRegister projects: cc-config register <path>'));
  console.log(chalk.gray('Or use interactive selection: cc-config scan --tui'));

  // Note: When ScanScreen is fully integrated with TuiApp (Wave 4),
  // this will launch the actual Ink-based ScanScreen component
}