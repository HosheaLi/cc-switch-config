/**
 * Auto-Check Command - Shell Hook Integration
 *
 * Per D-01: Shell hook integration, called by PROMPT_COMMAND/chpwd_functions.
 * Per D-02: --silent flag for quiet mode (default true).
 *
 * This command is designed for shell hook integration:
 * - Called automatically when user changes directory
 * - Detects registered project and auto-switches config
 * - Outputs message only on actual switch (silent otherwise)
 *
 * Shell Hook Setup:
 *
 * ## Bash: Add to ~/.bashrc
 *
 * ```bash
 * _cc_config_chpwd_hook() {
 *   local output
 *   output=$(cc-config auto-check --silent 2>&1)
 *   if [[ -n "$output" ]]; then
 *     echo "$output"
 *   fi
 * }
 *
 * # Option 1: PROMPT_COMMAND integration
 * PROMPT_COMMAND="_cc_config_chpwd_hook${PROMPT_COMMAND:+; $PROMPT_COMMAND}"
 *
 * # Option 2: Using trap (alternative)
 * trap '_cc_config_chpwd_hook' DEBUG
 * ```
 *
 * ## Zsh: Add to ~/.zshrc
 *
 * ```zsh
 * _cc_config_chpwd_hook() {
 *   local output
 *   output=$(cc-config auto-check --silent 2>&1)
 *   if [[ -n "$output" ]]; then
 *     echo "$output"
 *   fi
 * }
 *
 * # Add to chpwd_functions array
 * chpwd_functions=(${chpwd_functions[@]} _cc_config_chpwd_hook)
 * ```
 */

import type { Command } from 'commander';
import { ProjectIndex } from '../../lib/store/project.js';
import { AppState } from '../../lib/store/state.js';
import { detectAutoSwitch, applyAutoSwitch, formatSwitchMessage } from '../utils/auto-switch.js';
import { handleCLIError } from '../output/error.js';

/**
 * Register auto-check command with Commander program.
 * Per D-02: --silent flag with default true.
 *
 * @param program - Commander program instance
 */
export function registerAutoCheckCommand(program: Command): void {
  program
    .command('auto-check')
    .description('Auto-switch project config based on current directory (shell hook)')
    .option('--silent', 'suppress output unless switch occurs (default: true)', true)
    .option('--no-silent', 'show all output including no-switch status')
    .option('--root <path>', 'override scan directory instead of cwd')
    .action(async (options) => {
      try {
        await autoCheck({
          silent: options.silent,
          root: options.root,
        });
      } catch (error) {
        handleCLIError(error);
      }
    });
}

/**
 * Execute auto-check logic.
 * Per D-01: Detect project and apply switch.
 * Per D-02: Silent output unless actual switch.
 *
 * @param options - Command options
 * @param options.silent - Suppress output unless switch occurs (default: true)
 * @param options.root - Override scan directory (default: process.cwd())
 */
export async function autoCheck(options: { silent: boolean; root?: string }): Promise<void> {
  // Create instances
  const projectIndex = new ProjectIndex();
  const appState = new AppState();

  // Get target directory
  const cwd = options.root ?? process.cwd();

  // Detect auto-switch
  const result = await detectAutoSwitch(cwd, projectIndex, appState);

  // Apply switch if detected
  if (result.switched && result.projectId) {
    applyAutoSwitch(result, appState);
  }

  // Format and output message
  const message = formatSwitchMessage(result);

  // Per D-02: Silent mode only outputs on actual switch
  if (!options.silent || message !== null) {
    if (message !== null) {
      console.log(message);
    }
  }
}