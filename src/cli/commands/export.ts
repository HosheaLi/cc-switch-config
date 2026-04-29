/**
 * Export Command - Export Project Configuration
 *
 * Per F13: Export current project config to single JSON file.
 * Per D-05: Single project scope - export current or specified project.
 *
 * Options:
 * - --output <path>: Output file path (default: <project-name>-config.json)
 * - --stdout: Output to stdout instead of file
 */

import type { Command } from 'commander';
import fs from 'fs-extra';
import chalk from 'chalk';
import { ExportService } from '../../lib/services/export-service.js';
import { ProjectIndex } from '../../lib/store/project.js';
import { TemplateStore } from '../../lib/store/template.js';
import { ConfigService } from '../../lib/services/config-service.js';
import { readConfig, writeConfig } from '../../lib/store/config.js';
import { AppState } from '../../lib/store/state.js';
import { handleCLIError } from '../output/error.js';

/**
 * Export command options.
 */
interface ExportOptions {
  /** Output file path */
  output?: string;
  /** Output to stdout instead of file */
  stdout?: boolean;
}

/**
 * Register export command with Commander program.
 *
 * Usage:
 * - cc-config export [project-id]        Export specified project
 * - cc-config export                     Export active project
 * - cc-config export --stdout            Output to stdout
 * - cc-config export --output my.json    Custom output path
 */
export function registerExportCommand(program: Command): void {
  program
    .command('export [project-id] [file]')
    .description('Export project configuration to JSON file')
    .option('-o, --output <path>', 'output file path (default: <project-name>-config.json)')
    .option('-s, --stdout', 'output to stdout instead of file')
    .action(async (projectId: string | undefined, file: string | undefined, options: ExportOptions) => {
      try {
        // [file] positional argument acts as --output shortcut
        const mergedOptions: ExportOptions = {
          ...options,
          output: file ?? options.output,
        };
        await exportConfig(projectId, mergedOptions);
      } catch (error) {
        handleCLIError(error);
      }
    });
}

/**
 * Execute export operation.
 *
 * @param projectId - Project UUID (optional, defaults to active project)
 * @param options - Export options (output, stdout)
 */
async function exportConfig(projectId: string | undefined, options: ExportOptions): Promise<void> {
  // Initialize dependencies
  const projectIndex = new ProjectIndex();
  const templateStore = new TemplateStore();
  const configService = new ConfigService(readConfig, writeConfig);
  const appState = new AppState();

  // Get project ID (use active if not specified)
  let targetId = projectId;
  if (!targetId) {
    targetId = appState.getActiveProject();
    if (!targetId) {
      console.error(chalk.yellow('No active project. Specify a project ID or use "switch" first.'));
      process.exit(3); // NOT_FOUND
    }
  }

  // Create export service
  const service = new ExportService(projectIndex, templateStore, configService);

  // Export project
  const payload = await service.exportProject(targetId);

  // Output
  if (options.stdout) {
    // Output to stdout
    console.log(JSON.stringify(payload, null, 2));
  } else {
    // Output to file
    const outputPath = options.output ?? `${payload.project.name}-config.json`;
    await fs.writeJSON(outputPath, payload, { spaces: 2 });
    console.log(chalk.green(`Exported ${payload.project.name} config to ${outputPath}`));
  }
}