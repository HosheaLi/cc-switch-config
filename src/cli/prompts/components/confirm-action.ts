/**
 * Confirm Action Component - TUI-02
 *
 * Per D-05: Enter confirms, Esc cancels
 */

import prompts from 'prompts';
import { promptWithCancel } from '../utils/handle-cancel.js';
import { colors } from '../../theme/index.js';

/**
 * Confirm an action with y/n prompt.
 *
 * @param message - Confirmation message
 * @param defaultChoice - Default choice (true = yes, false = no)
 * @returns true if confirmed, false if rejected, null if cancelled
 */
export async function confirmAction(
  message: string,
  defaultChoice: boolean = false
): Promise<boolean | null> {
  const result = await promptWithCancel<boolean>({
    type: 'confirm',
    name: 'confirm',
    message: `${message} ${colors.muted('[y/N]')}`,
    initial: defaultChoice,
  });

  // If cancelled, return null
  if (result.cancelled) {
    return null;
  }

  return result.value;
}

/**
 * Confirm with detailed action description.
 *
 * @param actionTitle - Action title (e.g., "删除配置")
 * @param actionDescription - Detailed description
 * @param isDangerous - Show danger styling for destructive actions
 * @returns true if confirmed, false if rejected, null if cancelled
 */
export async function confirmWithDetails(
  actionTitle: string,
  actionDescription: string,
  isDangerous: boolean = false
): Promise<boolean | null> {
  // Display details first
  console.log();
  if (isDangerous) {
    console.log(colors.danger(`⚠ ${actionTitle}`));
  } else {
    console.log(colors.accent(actionTitle));
  }
  console.log(colors.muted(actionDescription));
  console.log();

  return confirmAction('确认执行？', false);
}