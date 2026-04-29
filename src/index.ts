#!/usr/bin/env node
/**
 * CLI Entry Point - Shebang + CLI Import
 *
 * Per D-08: src/cli/index.ts contains CLI logic, src/index.ts is shebang entry.
 * This file is the package.json bin entry (./dist/index.js).
 *
 * Responsibility:
 * - Shebang for executable Node.js script
 * - Import and call CLI runCLI function
 * - Handle top-level errors (including Commander version/help display)
 */

import { runCLI } from './cli/index.js';
import { handleCLIError } from './cli/output/error.js';
import { CommanderError } from 'commander';

// Launch CLI application
runCLI().catch((error: unknown) => {
  // Commander throws CommanderError after displaying version/help when exitOverride() is set
  // These are not actual errors - just exit silently with success code
  if (error instanceof CommanderError) {
    process.exit(0);
  }
  handleCLIError(error);
});