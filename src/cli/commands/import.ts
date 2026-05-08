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
import { ExportService, detectConflicts, type ImportStrategy } from '../../lib/services/export-service.js';
import { ProjectIndex } from '../../lib/store/project.js';
import { ApiConfigStore } from '../../lib/store/api-config.js';
import { ConfigService } from '../../lib/services/config-service.js';
import { readConfig, writeConfig } from '../../lib/store/config.js';
import { handleCLIError } from '../output/error.js';
import { migrateExportPayload } from '../../lib/types/export-schema.js';
import type { ConflictField } from '../../lib/types/export-schema.js';
import type { ExportPayload } from '../../lib/types/export-schema.js';
import { colors } from '../theme/index.js';

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
  // Read file content
  const payloadRaw: unknown = await fs.readJSON(file);

  // Per CFG-06: Migrate legacy format (template → config)
  const payload = migrateExportPayload(payloadRaw);

  // Validate basic structure to get project path
  if (typeof payload !== 'object' || payload === null) {
    console.error(colors.danger('Invalid export file: not a JSON object'));
    process.exit(4); // CONFIG_ERROR
  }

  const basicPayload = payload as Record<string, unknown>;
  const projectObj = basicPayload.project as Record<string, unknown> | undefined;
  if (typeof projectObj?.path !== 'string') {
    console.error(colors.danger('Invalid export file: missing project path'));
    process.exit(4); // CONFIG_ERROR
  }

  // Determine target path
  const targetPath = options.target ?? payload.project.path;

  // Initialize dependencies
  const projectIndex = new ProjectIndex();
  const apiConfigStore = new ApiConfigStore();
  const configService = new ConfigService(readConfig, writeConfig);
  const service = new ExportService(projectIndex, apiConfigStore, configService);

  // Determine strategy
  let strategy: ImportStrategy | undefined;

  if (options.strategy) {
    // Non-interactive mode: use specified strategy
    strategy = options.strategy;
  } else {
    // Interactive mode: detect conflicts and decide
    const importedSettings = payload.settings ?? {};
    const existingSettings = await configService.readProjectConfig(targetPath) ?? {};

    const conflicts = detectConflicts(importedSettings, existingSettings);

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
  // TODO: Implement true interactive TUI (ImportConflictScreen) for conflict resolution.
  // This placeholder always returns 'merge' as the safest default.
  // When implementing, use Ink's ImportConflictScreen with keyboard input (1/2/3/Esc).

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

  console.log(colors.foreground('Resolution options:'));
  console.log(colors.foreground('  [1] Merge all - preserve existing values, add new fields'));
  console.log(colors.foreground('  [2] Overwrite all - replace with imported values'));
  console.log(colors.foreground('  [3] Skip all - keep existing, discard imported'));
  console.log(colors.muted('  [Esc] Cancel import'));
  console.log();

  console.log(colors.muted('Proceeding with merge strategy (default).'));
  return 'merge';
}