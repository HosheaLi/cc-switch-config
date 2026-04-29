/**
 * PreviewPanel Component
 *
 * Per D-04: Bottom popup preview for selected item.
 * Per F3: Configuration Preview (show what will change).
 *
 * Shows project and template details when user selects an item.
 *
 * Usage:
 * ```tsx
 * <PreviewPanel
 *   visible={isSelected}
 *   project={selectedProject}
 *   template={selectedTemplate}
 * />
 * ```
 */
import React from 'react';
import { Box, Text } from 'ink';
import type { ProjectEntry } from '../../lib/store/project.js';
import type { TemplateConfig } from '../../lib/types/provider.js';

interface PreviewPanelProps {
  /** Whether the panel is visible */
  visible: boolean;
  /** Selected project to preview */
  project: ProjectEntry | null;
  /** Selected template to preview (optional) */
  template?: TemplateConfig | null;
}

/**
 * Preview panel component showing project and template details.
 *
 * @param props - Component props
 * @returns Preview panel or null if not visible
 */
export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  visible,
  project,
  template,
}) => {
  if (!visible || !project) return null;

  return (
    <Box
      borderStyle="single"
      borderColor="yellow"
      padding={1}
      marginTop={1}
      flexDirection="column"
    >
      <Text bold color="cyan">
        Preview: {project.name}
      </Text>
      <Box flexDirection="column" marginTop={1}>
        <Text dimColor>Path: {project.path}</Text>
        <Text color={project.activeConfig ? 'green' : 'gray'}>
          Config: {project.activeConfig ?? 'none'}
        </Text>
        {template && (
          <Box flexDirection="column" marginTop={1}>
            <Text bold color="yellow">
              Template: {template.name}
            </Text>
            <Text dimColor>
              Provider: {template.provider.name} ({template.provider.baseUrl})
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};