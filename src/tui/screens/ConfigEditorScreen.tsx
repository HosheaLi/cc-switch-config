/**
 * ConfigEditorScreen Component
 *
 * Per F3: Configuration Preview (show what will change).
 * Per D-04: Preview panel shows template details.
 * Per U4: Escape to Cancel.
 *
 * Shows template preview before applying to project.
 * Displays provider details and environment variables.
 * Supports Enter for confirm and Esc for cancel.
 *
 * Usage:
 * ```tsx
 * <ConfigEditorScreen
 *   project={selectedProject}
 *   template={selectedTemplate}
 *   onConfirm={() => applyTemplate()}
 *   onBack={() => navigate.pop()}
 * />
 * ```
 */
import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { useKeyInput } from '../hooks/useKeyInput.js';
import { PreviewPanel } from '../components/PreviewPanel.js';
import { StatusBar } from '../components/StatusBar.js';
import { LoadingIndicator } from '../components/LoadingIndicator.js';
import type { ProjectEntry } from '../../lib/store/project.js';
import type { TemplateConfig } from '../../lib/types/provider.js';

/**
 * Props for ConfigEditorScreen component.
 */
interface ConfigEditorScreenProps {
  /** Project to apply template to */
  project: ProjectEntry;
  /** Template configuration to preview and apply */
  template: TemplateConfig;
  /** Callback when user confirms application */
  onConfirm: () => void;
  /** Callback when user cancels (Escape) */
  onBack: () => void;
}

/**
 * Configuration editor screen for template preview and application.
 *
 * Displays:
 * - Project information
 * - Template details (name, description, provider)
 * - Provider configuration (baseUrl, authType)
 * - Environment variables preview (with masking for sensitive keys)
 * - PreviewPanel component
 * - LoadingIndicator during application
 * - StatusBar for success/error messages
 * - Help text with keyboard shortcuts
 *
 * Keyboard navigation:
 * - Enter: Confirm and apply template
 * - Escape: Cancel and go back (U4)
 *
 * @param props - Component props
 * @returns ConfigEditorScreen component
 */
export const ConfigEditorScreen: React.FC<ConfigEditorScreenProps> = ({
  project,
  template,
  onConfirm,
  onBack,
}) => {
  // State for loading and status
  const [isApplying, setIsApplying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'error' | 'success' | 'info' | 'warning' | 'none'>('none');

  // Extract project name from path
  const projectName = project.path.split('/').pop() ?? project.path;

  // Keyboard input handling
  useKeyInput({
    onSelect: () => {
      setIsApplying(true);
      setStatusMessage(null);
      // Actual apply happens in parent via onConfirm
      onConfirm();
    },
    onEscape: () => onBack(),
    isActive: !isApplying,
  });

  // Prepare env preview with masking for sensitive keys
  const envPreview = template.provider.env ?? {};
  const envKeys = Object.keys(envPreview);

  /**
   * Mask sensitive environment variable values.
   * Keys containing TOKEN or KEY are masked for security.
   */
  const maskIfNeeded = (key: string, value: string): string => {
    if (key.includes('TOKEN') || key.includes('KEY')) {
      return '(masked)';
    }
    return value;
  };

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Text bold color="cyan">
        Apply Template to Project
      </Text>

      {/* Project Info */}
      <Box flexDirection="column" marginTop={1}>
        <Text bold>Project: {projectName}</Text>
        <Text dimColor>Path: {project.path}</Text>
      </Box>

      {/* Template Info */}
      <Box flexDirection="column" marginTop={1} borderStyle="single" borderColor="yellow" padding={1}>
        <Text bold color="yellow">Template: {template.name}</Text>
        {template.description && <Text dimColor>{template.description}</Text>}

        {/* Provider Details */}
        <Box flexDirection="column" marginTop={1}>
          <Text bold>Provider:</Text>
          <Text>  Name: {template.provider.name}</Text>
          <Text>  URL: {template.provider.baseUrl}</Text>
          <Text>  Auth: {template.provider.authType}</Text>
        </Box>

        {/* Env Preview */}
        {envKeys.length > 0 && (
          <Box flexDirection="column" marginTop={1}>
            <Text bold color="green">Environment Variables to Apply:</Text>
            {envKeys.map(key => (
              <Text key={key} dimColor>
                {'  '}{key}: {maskIfNeeded(key, envPreview[key])}
              </Text>
            ))}
          </Box>
        )}
      </Box>

      {/* Preview Panel */}
      <PreviewPanel visible={true} project={project} template={template} />

      {/* Loading Indicator */}
      <LoadingIndicator isLoading={isApplying} message="Applying template..." />

      {/* Status Bar */}
      <StatusBar message={statusMessage} type={statusType} />

      {/* Help */}
      {!isApplying && (
        <Box marginTop={1}>
          <Text dimColor>
            Enter: confirm  Esc: cancel
          </Text>
        </Box>
      )}
    </Box>
  );
};