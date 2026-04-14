/**
 * ScanScreen Component - Multi-select Project Registration Interface
 *
 * Per D-09: ScanScreen with checkbox multi-select.
 * Per UI-SPEC: Header "Scan Results", checkbox toggle (Space), confirm (Enter), cancel (Esc).
 * Per F10: Project Directory Scan TUI interface.
 *
 * Displays scan results with new projects selectable and registered projects shown as gray.
 * Uses checkbox pattern for multi-select registration.
 */
import React, { useState, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { useKeyInput } from '../hooks/useKeyInput.js';
import { useNavigation } from '../hooks/useNavigation.js';
import type { ScanResult } from '../../lib/services/project-service.js';

/**
 * Props for ScanScreen component.
 */
export interface ScanScreenProps {
  /** Scan results from ProjectService.scanProjects() */
  results: ScanResult[];
  /** Callback when user confirms registration */
  onConfirm: (selectedPaths: string[]) => void;
  /** Callback when user cancels */
  onCancel: () => void;
}

/**
 * ScanScreen - Multi-select interface for project registration.
 *
 * Features:
 * - Checkbox toggle via Space (D-09)
 * - Enter confirms selection
 * - Esc cancels and returns to previous screen (U4)
 * - Arrow + j/k navigation (U3)
 * - New projects selectable, registered projects gray/dim (D-09)
 *
 * @param props - Component props
 * @returns ScanScreen component
 */
export const ScanScreen: React.FC<ScanScreenProps> = ({
  results,
  onConfirm,
  onCancel,
}) => {
  const { pop } = useNavigation('scan');

  // Separate new and registered projects
  const newProjects = useMemo(
    () => results.filter(r => r.isNew),
    [results]
  );
  const registeredProjects = useMemo(
    () => results.filter(r => !r.isNew),
    [results]
  );

  // State: focus index (only for new projects), selected paths
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set<string>());

  // Reset selection when new projects change
  useMemo(() => {
    if (selectedIndex >= newProjects.length && newProjects.length > 0) {
      setSelectedIndex(newProjects.length - 1);
    }
  }, [newProjects.length]);

  // Navigation handlers
  const handleUp = () => {
    setSelectedIndex(prev => Math.max(0, prev - 1));
  };

  const handleDown = () => {
    setSelectedIndex(prev => Math.min(newProjects.length - 1, prev + 1));
  };

  // Toggle selection on focused item
  const handleToggle = () => {
    if (newProjects.length === 0) return;

    const focusedProject = newProjects[selectedIndex];
    if (!focusedProject) return;

    setSelectedPaths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(focusedProject.path)) {
        newSet.delete(focusedProject.path);
      } else {
        newSet.add(focusedProject.path);
      }
      return newSet;
    });
  };

  // Confirm registration
  const handleConfirm = () => {
    if (selectedPaths.size === 0) return;
    onConfirm(Array.from(selectedPaths));
  };

  // Cancel and return
  const handleEscape = () => {
    onCancel();
    pop();
  };

  // Keyboard input via useKeyInput for navigation
  useKeyInput({
    onUp: handleUp,
    onDown: handleDown,
    onSelect: handleConfirm, // Enter key
    onEscape: handleEscape,
    isActive: true,
  });

  // Custom useInput for Space toggle
  useInput((input, key) => {
    if (input === ' ' && newProjects.length > 0) {
      handleToggle();
    }
  }, { isActive: true });

  // Get focused project name
  const focusedProject = newProjects[selectedIndex];
  const focusedName = focusedProject?.path.split('/').pop() ?? '';

  // Empty state: no new projects found
  if (newProjects.length === 0) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color="cyan">Scan Results</Text>
        <Box marginTop={1}>
          <Text dimColor>No new projects found</Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>
            All discovered projects are already registered. Press Esc to return.
          </Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Esc: cancel</Text>
        </Box>
      </Box>
    );
  }

  // Render project item
  const renderItem = (project: ScanResult, index: number, isNew: boolean) => {
    const name = project.path.split('/').pop() ?? project.path;

    if (isNew) {
      // New project - selectable with checkbox
      const isSelected = index === selectedIndex;
      const isChecked = selectedPaths.has(project.path);
      const checkbox = isChecked ? '[\u2713]' : '[ ]';

      return (
        <Text
          key={project.path}
          color={isSelected ? 'green' : 'white'}
          bold={isSelected}
        >
          {isSelected ? '> ' : '  '}
          {checkbox} {name}
        </Text>
      );
    } else {
      // Registered project - gray, non-selectable
      return (
        <Text
          key={project.path}
          dimColor
        >
          {'  '}(registered) {name}
        </Text>
      );
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Text bold color="cyan">Scan Results</Text>

      {/* Count summary */}
      <Box marginTop={1}>
        <Text dimColor>
          {newProjects.length} new project(s) found
          {registeredProjects.length > 0 && `, ${registeredProjects.length} already registered`}
        </Text>
      </Box>

      {/* Project list */}
      <Box flexDirection="column" marginTop={1}>
        {/* New projects - selectable */}
        {newProjects.map((project, i) => renderItem(project, i, true))}

        {/* Registered projects - gray, non-selectable */}
        {registeredProjects.map((project) => renderItem(project, -1, false))}
      </Box>

      {/* Selection summary */}
      <Box marginTop={1}>
        <Text color="green">
          {selectedPaths.size} selected
        </Text>
      </Box>

      {/* Help text */}
      <Box marginTop={1}>
        <Text dimColor>
          Space: toggle | Enter: confirm | Esc: cancel
        </Text>
      </Box>
      <Box>
        <Text dimColor>
          Up/k: up | Down/j: down
        </Text>
      </Box>
    </Box>
  );
};