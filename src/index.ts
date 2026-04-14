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
 * - Handle top-level errors with handleCLIError
 */

import { runCLI } from './cli/index.js';
import { handleCLIError } from './cli/output/error.js';

// Launch CLI application
runCLI().catch(handleCLIError);