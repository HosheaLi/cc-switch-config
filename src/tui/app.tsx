/**
 * TUI App Container
 *
 * Per D-02: Layer-level navigation with stack.
 * Per D-01: Single-screen layout with screen routing.
 * Per Clean Architecture: TUI calls Services, not Repositories.
 *
 * Main Ink application that manages screen routing and data loading.
 * Provides entry point (runTUI) for CLI integration.
 */
import path from 'path';
import React, { useState, useEffect } from 'react';
import { render, Box, Text, useApp } from 'ink';
import { ProjectService, TemplateService, ConfigService } from '../lib/services/index.js';
import { ProjectIndex, TemplateStore, AppState, readConfig, writeConfig } from '../lib/store/index.js';
import type { ProjectEntry } from '../lib/store/project.js';
import type { TemplateConfig } from '../lib/types/provider.js';
import type { ScanResult } from '../lib/services/project-service.js';
import type { ConflictField } from '../lib/types/export-schema.js';
import { useNavigation } from './hooks/useNavigation.js';
import { LoadingIndicator } from './components/LoadingIndicator.js';
import { ProjectListScreen } from './screens/ProjectListScreen.js';
import { ConfigEditorScreen } from './screens/ConfigEditorScreen.js';
import { ConfirmScreen } from './screens/ConfirmScreen.js';
import { ScanScreen } from './screens/ScanScreen.js';
import { ImportConflictScreen } from './screens/ImportConflictScreen.js';

/**
 * Props for TuiApp component.
 */
interface TuiAppProps {
  /** ProjectService instance for project operations */
  projectService: ProjectService;
  /** TemplateService instance for template operations */
  templateService: TemplateService;
  /** ConfigService instance for config operations */
  configService: ConfigService;
}

/**
 * Selected project and template state.
 */
interface SelectedState {
  /** Currently selected project */
  project: ProjectEntry | null;
  /** Template for selected project */
  template: TemplateConfig | null;
}

/**
 * TuiApp - Main TUI container with screen routing.
 *
 * Features:
 * - Screen navigation via useNavigation hook (D-02)
 * - Data loading from Services (Clean Architecture)
 * - Project selection and template preview
 * - Loading indicator during data fetch
 *
 * @param props - Component props with injected Services
 * @returns TuiApp component
 */
export const TuiApp: React.FC<TuiAppProps> = ({
  projectService,
  templateService,
  configService,
}) => {
  const { exit } = useApp();
  const navigation = useNavigation('list');
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [selected, setSelected] = useState<SelectedState>({ project: null, template: null });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scan screen state (F10, D-08)
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  // Import-conflict screen state (F13, D-07)
  const [importConflicts, setImportConflicts] = useState<ConflictField[]>([]);

  // Prevent render-phase state updates: auto-return to list when editor has no selection
  useEffect(() => {
    if (navigation.current === 'editor' && !selected.project) {
      navigation.pop();
    }
  }, [navigation.current, selected.project]);

  // Load projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const list = await projectService.listProjects();
        setProjects(list);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        }
      }
      setIsLoading(false);
    };
    loadProjects();
  }, [projectService]);

  // Handle project selection from list
  const handleProjectSelect = async (project: ProjectEntry) => {
    setSelected({ project, template: null });

    // Load template if project has activeConfig
    if (project.activeConfig) {
      try {
        const template = await templateService.getTemplate(project.activeConfig);
        if (template) {
          setSelected({ project, template });
        }
      } catch {
        // Template not found - continue without template
      }
    }

    navigation.push('editor');
  };

  // Handle template application
  const handleApplyTemplate = async () => {
    if (!selected.project || !selected.template) return;

    try {
      await templateService.applyTemplate(selected.project.path, selected.template.name);
      // Update project's activeConfig in state
      setProjects(prev =>
        prev.map(p =>
          p.id === selected.project!.id
            ? { ...p, activeConfig: selected.template!.name }
            : p
        )
      );
      // Return to list after successful apply
      navigation.reset();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  // Handle exit
  const handleExit = () => {
    exit();
  };

  // Handle scan trigger (F10, D-08)
  const handleTriggerScan = async () => {
    setIsScanning(true);
    try {
      const results = await projectService.scanProjects();
      setScanResults(results);
      navigation.push('scan');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
    setIsScanning(false);
  };

  // Handle scan confirmation - register selected projects (D-09)
  const handleScanConfirm = async (selectedPaths: string[]) => {
    for (const projectPath of selectedPaths) {
      try {
        await projectService.registerProject(projectPath);
      } catch (err) {
        // Continue with other projects even if one fails
        if (err instanceof Error) {
          console.error(`Failed to register ${projectPath}: ${err.message}`);
        }
      }
    }
    // Reload projects list
    const updatedList = await projectService.listProjects();
    setProjects(updatedList);
    navigation.pop();
  };

  // Handle import-conflict resolution (F13, D-07)
  const handleImportResolve = async (strategy: 'merge' | 'overwrite' | 'skip') => {
    // Note: Import-conflict screen is typically launched from CLI import command
    // This handler provides TUI integration for future use
    // For now, just pop back to previous screen
    navigation.pop();
  };

  // Render current screen
  const renderScreen = () => {
    // Loading state
    if (isLoading) {
      return (
        <Box flexDirection="column" justifyContent="center" alignItems="center" padding={2}>
          <LoadingIndicator isLoading={true} message="Loading projects..." />
        </Box>
      );
    }

    // Error state — show on any screen so async errors in editor are visible
    if (error) {
      return (
        <Box flexDirection="column" padding={2}>
          <Text bold color="red">Error: {error}</Text>
          <Box marginTop={1}>
            <Text dimColor>Press Esc to exit</Text>
          </Box>
        </Box>
      );
    }

    // Screen routing
    switch (navigation.current) {
      case 'list':
        return (
          <ProjectListScreen
            projects={projects}
            onSelect={handleProjectSelect}
            onExit={handleExit}
          />
        );

      case 'editor':
        if (!selected.project) {
          return null;
        }

        // If no template, show template selection prompt
        if (!selected.template) {
          return (
            <Box flexDirection="column" padding={2}>
              <Text bold color="yellow">No template configured</Text>
              <Text dimColor>Project: {path.basename(selected.project.path)}</Text>
              <Box marginTop={1}>
                <Text dimColor>Use CLI to apply a template to this project:</Text>
              </Box>
              <Box>
                <Text dimColor>  cd {selected.project.path} && cc-config switch &lt;template-name&gt;</Text>
              </Box>
              <Box marginTop={1}>
                <Text dimColor>Press Esc to go back</Text>
              </Box>
            </Box>
          );
        }

        return (
          <ConfigEditorScreen
            project={selected.project}
            template={selected.template}
            onConfirm={handleApplyTemplate}
            onBack={() => navigation.pop()}
          />
        );

      case 'confirm':
        return (
          <ConfirmScreen
            message="Delete this template?"
            actionDescription={`Template: ${selected.template?.name ?? 'unknown'}`}
            onConfirm={() => {
              // Delete action would be handled by parent
              // For now, just pop back
              navigation.pop();
            }}
            onCancel={() => navigation.pop()}
          />
        );

      case 'template-select':
        // Future: Template selection screen
        return (
          <Box flexDirection="column" padding={2}>
            <Text bold color="cyan">Template Selection</Text>
            <Text dimColor>(Not implemented - use CLI for template selection)</Text>
            <Box marginTop={1}>
              <Text dimColor>Press Esc to go back</Text>
            </Box>
          </Box>
        );

      case 'scan':
        // Scan screen for project discovery (F10, D-09)
        return (
          <ScanScreen
            results={scanResults}
            onConfirm={handleScanConfirm}
            onCancel={() => navigation.pop()}
          />
        );

      case 'import-conflict':
        // Import conflict resolution screen (F13, D-07)
        return (
          <ImportConflictScreen
            conflicts={importConflicts}
            onResolve={handleImportResolve}
            onCancel={() => navigation.pop()}
          />
        );

      default:
        return <Text>Unknown screen</Text>;
    }
  };

  return (
    <Box flexDirection="column">
      {renderScreen()}
    </Box>
  );
};

/**
 * Factory function to create and run TUI.
 *
 * Per Clean Architecture: Creates Service instances with store injection.
 * Per D-02: Entry point for CLI when no args provided.
 *
 * Creates store instances, service instances, renders app, waits for exit.
 *
 * @returns Promise that resolves when TUI exits
 */
export async function runTUI(): Promise<void> {
  // Create store instances
  const projectIndex = new ProjectIndex();
  const templateStore = new TemplateStore();
  const appState = new AppState();

  // Create service instances with constructor injection (D-01)
  const projectService = new ProjectService(projectIndex, appState);
  const templateService = new TemplateService(templateStore, readConfig, writeConfig);
  const configService = new ConfigService(readConfig, writeConfig);

  // Render app
  const { waitUntilExit } = render(
    <TuiApp
      projectService={projectService}
      templateService={templateService}
      configService={configService}
    />
  );

  await waitUntilExit();
}