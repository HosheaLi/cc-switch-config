/**
 * Scan Command - Project Directory Discovery
 *
 * Per D-08: Two trigger modes - TUI 'S' key + CLI command.
 * Per F10: Project Directory Scan for discovering existing projects.
 *
 * Provides CLI interface for scanning directories to find .claude projects.
 * Outputs table, JSON, or launches TUI multi-select interface.
 */

import type { Command } from 'commander';
import Table from 'cli-table3';
import { ProjectService } from '../../lib/services/index.js';
import type { ScanResult } from '../../lib/services/index.js';
import { handleCLIError } from '../output/error.js';
import { launchScanTUI } from '../utils/cli-launch.js';
import { createServices } from '../utils/service-factory.js';
import { colors } from '../theme/index.js';
import { truncatePath } from '../utils/string-utils.js';

/**
 * Options for scan command.
 */
export interface ScanOptions {
  /** Override scan directory (default: from AppState.scanDirectories) */
  root?: string;
  /** Max scan depth (default: 3) - passed as string by Commander */
  depth?: string;
  /** Launch TUI interface for multi-select */
  tui?: boolean;
  /** JSON output format */
  json?: boolean;
  /** Automatically register found projects */
  register?: boolean;
}

/**
 * Register scan command with Commander program.
 * Per D-08: 'scan' command for CLI trigger.
 */
export function registerScanCommand(program: Command): void {
  program
    .command('scan [directory]')
    .description('Scan directories for .claude projects')
    .option('-r, --root <dir>', 'override scan directory')
    .option('-d, --depth <number>', 'max scan depth (default: 3)', '3')
    .option('-t, --tui', 'launch TUI multi-select interface')
    .option('-j, --json', 'output as JSON format')
    .option('--register', 'automatically register found projects')
    .action(async (directory: string | undefined, options: ScanOptions) => {
      try {
        // [directory] positional argument acts as --root shortcut
        const mergedOptions: ScanOptions = {
          ...options,
          root: directory ?? options.root,
        };
        await scanProjectsCLI(mergedOptions);
      } catch (error) {
        handleCLIError(error);
      }
    });
}

/**
 * Execute scan operation from CLI.
 *
 * Per D-08: Handles three output modes:
 * - TUI: Launch ScanScreen for multi-select registration
 * - JSON: Output ScanResult[] array to stdout
 * - Table: Formatted table with Path and Status columns
 * - Register: Auto-register all found projects
 *
 * @param options - Scan options from CLI
 */
export async function scanProjectsCLI(options: ScanOptions): Promise<void> {
  const { projectService } = createServices();

  // Parse depth option
  let depth = options.depth !== undefined ? parseInt(options.depth, 10) : 3;
  if (isNaN(depth) || depth < 1) {
    console.error(colors.danger('Invalid depth value. Using default depth of 3.'));
    depth = 3;
  }

  // Use --root as temporary override without persisting to appState
  const overrideDirs = options.root ? [options.root] : undefined;

  // Execute scan
  const results = await projectService.scanProjects(depth, overrideDirs);

  // Handle auto-register mode
  if (options.register) {
    const newProjects = results.filter(r => r.isNew);
    if (newProjects.length === 0) {
      console.log(colors.muted('No new projects to register.'));
      return;
    }
    for (const result of newProjects) {
      try {
        await projectService.registerProject(result.path);
        console.log(colors.success(`✓ Registered: ${result.path}`));
      } catch (err) {
        console.error(colors.danger(`✗ Failed to register ${result.path}: ${err instanceof Error ? err.message : String(err)}`));
      }
    }
    console.log(colors.muted(`\nRegistered ${newProjects.length} project(s).`));
    return;
  }

  // Handle TUI mode
  if (options.tui) {
    await launchScanTUI(results, projectService);
    return;
  }

  // Handle JSON mode
  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  // Handle table output
  outputScanTable(results);
}

/**
 * Output scan results as formatted table.
 *
 * Columns: Path, Status (new/registered)
 *
 * @param results - Scan results from ProjectService
 */
function outputScanTable(results: ScanResult[]): void {
  if (results.length === 0) {
    console.log(colors.warning('No projects found in configured directories.'));
    console.log(colors.muted('Scan a specific directory: cc-config scan --root <path>'));
    return;
  }

  const table = new Table({
    head: [
      colors.bold(colors.accent('Path')),
      colors.bold(colors.accent('Status')),
    ],
    colWidths: [50, 15],
    style: { head: [], border: ['gray'] },
  });

  // Separate new and registered for summary
  const newProjects = results.filter(r => r.isNew);
  const registeredProjects = results.filter(r => !r.isNew);

  for (const result of results) {
    const pathDisplay = truncatePath(result.path, 48);
    const statusDisplay = result.isNew
      ? colors.success('new')
      : colors.muted('registered');

    table.push([colors.foreground(pathDisplay), statusDisplay]);
  }

  console.log(table.toString());

  // Summary
  console.log(colors.muted(`\n${results.length} project(s) found.`));
  console.log(colors.success(`${newProjects.length} new`));
  console.log(colors.muted(`${registeredProjects.length} already registered`));

  if (newProjects.length > 0) {
    console.log(colors.muted('\nRegister new projects: cc-config register <path>'));
    console.log(colors.muted('Register all from list: cc-config scan --tui'));
  }
}