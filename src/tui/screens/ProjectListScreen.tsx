/**
 * ProjectListScreen Component
 *
 * Per D-01: Single-screen list layout with top search, middle list, bottom preview.
 * Per D-05: Dual-mode navigation (arrows + j/k).
 * Per D-06: Instant fuzzy search.
 * Per D-04: Bottom popup preview.
 * Per D-09: Standard Escape behavior.
 * Per D-08: 'S' key triggers scan (ProjectListScreen -> ScanScreen).
 * Per D-07: 'U' key triggers undo for selected project (U2).
 *
 * Per F2: Interactive TUI Selector (arrow-key navigation, fuzzy search).
 * Per F10: Project Directory Scan (S key trigger).
 * Per F14: Fuzzy Search (quick navigation).
 * Per U2: Undo support for config modifications (U key trigger).
 * Per U3: Keyboard Navigation (arrows + j/k).
 * Per U4: Escape to Cancel (always allow cancel).
 *
 * Main interactive project list screen with fuzzy search, navigation, and preview.
 *
 * Usage:
 * ```tsx
 * <ProjectListScreen
 *   projects={projects}
 *   onSelect={(project) => handleSelect(project)}
 *   onExit={() => handleExit()}
 * />
 * ```
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import TextInput from 'ink-text-input';
import path from 'path';
import { useFuzzySearch } from '../hooks/useFuzzySearch.js';
import { useNavigation } from '../hooks/useNavigation.js';
import { PreviewPanel } from '../components/PreviewPanel.js';
import { StatusBar } from '../components/StatusBar.js';
import { UndoService } from '../../lib/services/undo-service.js';
import { ServiceError } from '../../lib/services/types.js';
import type { ProjectEntry } from '../../lib/store/project.js';
import type { SearchableItem } from '../hooks/useFuzzySearch.js';

/**
 * Props for ProjectListScreen component.
 */
interface ProjectListScreenProps {
  /** Array of projects to display */
  projects: ProjectEntry[];
  /** Callback when a project is selected (Enter key) */
  onSelect: (project: ProjectEntry) => void;
  /** Callback when user exits (Escape key when isRoot) */
  onExit: () => void;
  /** Initial search query (optional) */
  initialQuery?: string;
}

/**
 * ProjectListScreen - Main interactive project list with fuzzy search.
 *
 * Features:
 * - Fuzzy search filtering (F14)
 * - Arrow key + vim-style j/k navigation (U3)
 * - Escape to cancel/exit (U4)
 * - Preview panel for selected project (D-04)
 * - Status bar for messages
 *
 * @param props - Component props
 * @returns ProjectListScreen component
 */
export const ProjectListScreen: React.FC<ProjectListScreenProps> = ({
  projects,
  onSelect,
  onExit,
  initialQuery = '',
}) => {
  const { exit } = useApp();
  const { isRoot, pop, push } = useNavigation('list');

  // State for selection and search
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [query, setQuery] = useState(initialQuery);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'error' | 'success' | 'info' | 'warning' | 'none'>('none');

  // Transform projects to searchable items with name field
  const searchableProjects: (ProjectEntry & SearchableItem)[] = useMemo(
    () => projects.map(p => ({
      ...p,
      name: p.path.split('/').pop() ?? p.path,
    })),
    [projects]
  );

  // Fuzzy search filtering (F14, D-06)
  const filteredProjects = useFuzzySearch(searchableProjects, query);

  // Reset selection when filter changes to avoid out-of-bounds index
  useEffect(() => {
    if (selectedIndex >= filteredProjects.length && filteredProjects.length > 0) {
      setSelectedIndex(filteredProjects.length - 1);
    } else if (filteredProjects.length === 0) {
      setSelectedIndex(0);
    }
  }, [filteredProjects.length]);

  // Get selected project
  const selectedProject = filteredProjects[selectedIndex] ?? null;

  // Navigation callbacks for useKeyInput
  const handleUp = () => {
    setSelectedIndex(prev => Math.max(0, prev - 1));
  };

  const handleDown = () => {
    setSelectedIndex(prev => Math.min(filteredProjects.length - 1, prev + 1));
  };

  const handleSelect = () => {
    if (selectedProject) {
      onSelect(selectedProject);
    }
  };

  const handleEscape = () => {
    if (query.length > 0) {
      // Clear search first, then exit on next Esc
      setQuery('');
      return;
    }
    if (isRoot) {
      onExit();
    } else {
      pop();
    }
  };

  /**
   * Handle undo operation for selected project (D-07, U2).
   * Creates UndoService, calls undo, updates status bar with result.
   */
  const handleUndo = async () => {
    if (!selectedProject) return;

    try {
      // Create UndoService with config path resolver
      const undoService = new UndoService((projectPath) =>
        path.join(projectPath, '.claude', 'settings.json')
      );

      // Perform undo operation
      const result = await undoService.undo(selectedProject.path);

      // Calculate time ago in minutes
      const minutesAgo = Math.round((Date.now() - result.backupTime.getTime()) / 60000);

      // Update status bar with success message (per UI-SPEC.md)
      setStatusMessage(`Restored from backup (${minutesAgo} min ago)`);
      setStatusType('success');
    } catch (error) {
      // Handle NO_BACKUP error specifically
      if (error instanceof ServiceError && error.code === 'NO_BACKUP') {
        setStatusMessage('No backup available to undo');
        setStatusType('error');
      } else {
        // Generic undo failure
        setStatusMessage('Undo failed');
        setStatusType('error');
      }
    }
  };

  // Unified keyboard handling — avoids conflict with TextInput during search (P0 bug)
  useInput((input, key) => {
    // When searching (query non-empty), only handle Escape (clear search) and Enter (select)
    if (query.length > 0) {
      if (key.escape) {
        handleEscape();
        return;
      }
      if (key.return) {
        handleSelect();
        return;
      }
      // Let TextInput handle all other keys (typing)
      return;
    }

    // Normal mode: full navigation support
    if (key.upArrow || input === 'k') {
      handleUp();
      return;
    }
    if (key.downArrow || input === 'j') {
      handleDown();
      return;
    }
    if (key.return) {
      handleSelect();
      return;
    }
    if (key.escape) {
      handleEscape();
      return;
    }
    if (input === 'S') {
      push('scan');
      return;
    }
    if (input === 'U' && selectedProject) {
      handleUndo();
      return;
    }
  }, { isActive: true });

  // Helper to format project display
  const formatProjectLine = (project: ProjectEntry & SearchableItem, index: number) => {
    const isSelected = index === selectedIndex;
    // Use name with fallback to path basename for legacy data safety
    const name = project.name ?? project.path.split('/').pop() ?? project.path;
    const config = project.activeConfig ? ` [${project.activeConfig}]` : '';

    return (
      <Text
        key={project.id}
        color={isSelected ? 'green' : 'white'}
        bold={isSelected}
      >
        {isSelected ? '> ' : '  '}
        {name}
        {config}
      </Text>
    );
  };

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Text bold color="cyan">Projects</Text>

      {/* Search Input */}
      <Box marginTop={1}>
        <Text dimColor>Search: </Text>
        <TextInput
          value={query}
          onChange={setQuery}
          placeholder="Type to filter..."
        />
      </Box>

      {/* Project List */}
      <Box flexDirection="column" marginTop={1}>
        {filteredProjects.length === 0 ? (
          <Text dimColor>No projects found</Text>
        ) : (
          filteredProjects.map((project, i) => formatProjectLine(project, i))
        )}
      </Box>

      {/* Preview Panel (D-04) */}
      <PreviewPanel visible={!!selectedProject} project={selectedProject} />

      {/* Status Bar (D-11) */}
      <StatusBar message={statusMessage} type={statusType} />

      {/* Help Text — contextual based on search mode */}
      {query.length > 0 ? (
        <Box marginTop={1} flexDirection="column">
          <Text dimColor>
            Enter: select  Esc: clear search
          </Text>
        </Box>
      ) : (
        <Box marginTop={1} flexDirection="column">
          <Text dimColor>
            ↑/k up  ↓/j down  Enter select  S scan  U undo  Esc exit
          </Text>
          <Text dimColor>
            Type to filter projects
          </Text>
        </Box>
      )}
    </Box>
  );
};