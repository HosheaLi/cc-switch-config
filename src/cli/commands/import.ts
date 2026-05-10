/**
 * Import Command - Import Project Configuration
 *
 * Per F13: Import config from JSON file with conflict handling.
 * Per D-07: Interactive conflict handling - detect conflicts and show resolution options.
 *
 * Options:
 * - --strategy <merge|overwrite|skip>: Non-interactive mode (default: interactive)
 * - --target <path>: Override target project path (default: from export file project.path)
 */

import type { Command } from 'commander';
import fs from 'fs-extra';
import { ExportService, type ImportStrategy } from '../../lib/services/export-service.js';
import { ConfigService } from '../../lib/services/config-service.js';
import { readConfig, writeConfig } from '../../lib/store/config.js';
import { handleCLIError, ExitCodes } from '../output/error.js';
import { createServices } from '../utils/service-factory.js';
import { migrateExportPayload } from '../../lib/types/export-schema.js';
import type { ConflictField } from '../../lib/types/export-schema.js';
import type { ExportPayload } from '../../lib/types/export-schema.js';
import { colors } from '../theme/index.js';
import { promptWithCancel } from '../prompts/utils/handle-cancel.js';
import type { Choice } from 'prompts';

/**
 * Import command options.
 */
interface ImportOptions {
  /** Non-interactive strategy (merge, overwrite, skip) */
  strategy?: ImportStrategy;
  /** Override target project path */
  target?: string;
}

/**
 * Register import command with Commander program.
 *
 * Usage:
 * - cc-config import <file>              Interactive mode (detect conflicts)
 * - cc-config import <file> --strategy merge    Non-interactive mode
 * - cc-config import <file> --target /path      Override target path
 */
export function registerImportCommand(program: Command): void {
  program
    .command('import <file>')
    .description('Import project configuration from JSON file')
    .option('-s, --strategy <merge|overwrite|skip>', 'import strategy (non-interactive mode)')
    .option('-m, --merge', 'merge with existing config (alias for --strategy merge)')
    .option('-t, --target <path>', 'override target project path')
    .action(async (file: string, options: ImportOptions & { merge?: boolean }) => {
      try {
        // --merge is alias for --strategy merge
        const normalizedOptions: ImportOptions = {
          ...options,
          strategy: options.merge ? 'merge' : options.strategy,
        };
        await importConfig(file, normalizedOptions);
      } catch (error) {
        handleCLIError(error);
      }
    });
}

/**
 * Execute import operation.
 *
 * @param file - Path to export JSON file
 * @param options - Import options (strategy, target)
 */
async function importConfig(file: string, options: ImportOptions): Promise<void> {
  // Check file exists first
  if (!await fs.pathExists(file)) {
    console.error(colors.danger(`Import file not found: ${file}`));
    process.exit(ExitCodes.NOT_FOUND);
  }

  // Read file content
  const payloadRaw: unknown = await fs.readJSON(file);

  // Per CFG-06: Migrate legacy format (template → config)
  const payload = migrateExportPayload(payloadRaw);

  // Validate basic structure to get project path
  if (typeof payload !== 'object' || payload === null) {
    console.error(colors.danger('Invalid export file: not a JSON object'));
    process.exit(ExitCodes.CONFIG_ERROR);
  }

  const basicPayload = payload as Record<string, unknown>;
  const projectObj = basicPayload.project as Record<string, unknown> | undefined;
  if (typeof projectObj?.path !== 'string') {
    console.error(colors.danger('Invalid export file: missing project path'));
    process.exit(ExitCodes.CONFIG_ERROR);
  }

  // Determine target path
  const targetPath = options.target ?? payload.project.path;

  const { projectIndex, apiConfigStore } = createServices();
  const configService = new ConfigService(readConfig, writeConfig);
  const service = new ExportService(projectIndex, apiConfigStore, configService);

  // Determine strategy
  let strategy: ImportStrategy | undefined;
  const VALID_STRATEGIES: ImportStrategy[] = ['merge', 'overwrite', 'skip'];

  if (options.strategy) {
    // Non-interactive mode: use specified strategy
    if (!VALID_STRATEGIES.includes(options.strategy)) {
      console.error(colors.danger(`Invalid strategy: "${options.strategy}". Valid values: merge, overwrite, skip`));
      process.exit(ExitCodes.MISUSE);
    }
    strategy = options.strategy;
  } else {
    // Interactive mode: detect conflicts and decide
    const importedSettings = payload.settings ?? {};
    const existingSettings = await configService.readProjectConfig(targetPath) ?? {};

    const conflicts = ExportService.detectConflicts(importedSettings, existingSettings);

    if (conflicts.length === 0) {
      // No conflicts: proceed with merge (default)
      strategy = 'merge';
      console.log(colors.muted('No conflicts detected. Importing with merge strategy.'));
    } else {
      // Conflicts detected: launch TUI for resolution
      console.log(colors.warning(`Found ${conflicts.length} conflicting fields.`));
      const selectedStrategy = await launchImportConflictTUI(conflicts);

      if (!selectedStrategy) {
        // User cancelled
        console.log(colors.muted('Import cancelled.'));
        return;
      }
      strategy = selectedStrategy;
    }
  }

  // Import with strategy
  await service.importProject(payload, targetPath, strategy);

  // Success message
  console.log(colors.success(`Imported config to ${targetPath}`));
}

/**
 * Launch TUI for conflict resolution.
 *
 * Per D-07: Interactive conflict handling with merge/overwrite/skip options.
 *
 * @param conflicts - Array of conflicting fields
 * @returns Selected strategy or null if cancelled
 */
async function launchImportConflictTUI(conflicts: ConflictField[]): Promise<ImportStrategy | null> {
  // Display conflicts summary
  console.log(colors.bold(colors.accent('Import Conflicts Detected')));
  console.log(colors.muted(`${conflicts.length} conflicting fields found`));
  console.log();

  // Show conflict details
  for (const conflict of conflicts) {
    console.log(colors.bold(colors.foreground(`  ${conflict.key}`)));
    console.log(colors.accent(`    Imported: ${JSON.stringify(conflict.imported)}`));
    console.log(colors.warning(`    Existing: ${JSON.stringify(conflict.existing)}`));
    console.log();
  }

  // Build strategy choices
  const choices: Choice[] = [
    {
      title: 'Merge all',
      description: 'preserve existing values, add new fields',
      value: 'merge',
    },
    {
      title: 'Overwrite all',
      description: 'replace with imported values',
      value: 'overwrite',
    },
    {
      title: 'Skip all',
      description: 'keep existing, discard imported',
      value: 'skip',
    },
  ];

  // Interactive selection
  const result = await promptWithCancel<ImportStrategy>({
    type: 'select',
    name: 'strategy',
    message: '选择冲突解决策略',
    choices,
    initial: 0,
  });

  if (result.cancelled || result.value === null) {
    console.log(colors.muted('Import cancelled.'));
    return null;
  }

  return result.value;
}