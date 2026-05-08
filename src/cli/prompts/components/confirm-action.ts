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

/**
 * Confirm template application with preview.
 *
 * @param projectName - Target project name
 * @param templateName - Template/config name
 * @returns true if confirmed, false if rejected, null if cancelled
 */
export async function confirmApplyTemplate(
  projectName: string,
  templateName: string
): Promise<boolean | null> {
  console.log();
  console.log(colors.accent('应用配置'));
  console.log(colors.muted(`项目: ${projectName}`));
  console.log(colors.muted(`配置: ${templateName}`));
  console.log();

  return confirmAction('确认应用？', true);
}

/**
 * Confirm project registration.
 *
 * @param projectPath - Project path to register
 * @returns true if confirmed, false if rejected, null if cancelled
 */
export async function confirmRegisterProject(
  projectPath: string
): Promise<boolean | null> {
  const projectName = projectPath.split('/').pop() || projectPath;
  console.log();
  console.log(colors.accent('注册项目'));
  console.log(colors.muted(`路径: ${projectPath}`));
  console.log();

  return confirmAction(`注册 "${projectName}"？`, true);
}

/**
 * Quick confirm for safe actions (no details shown).
 *
 * @param message - Confirmation message
 * @returns true if confirmed, false if rejected, null if cancelled
 */
export async function quickConfirm(message: string): Promise<boolean | null> {
  return confirmAction(message, false);
}