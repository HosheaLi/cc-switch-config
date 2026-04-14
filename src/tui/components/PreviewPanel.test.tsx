/**
 * PreviewPanel Component Tests
 *
 * Tests bottom popup preview per D-04.
 * Tests config preview display per F3.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { PreviewPanel } from './PreviewPanel.js';
import type { ProjectEntry } from '../../lib/store/project.js';
import type { TemplateConfig } from '../../lib/types/provider.js';

// Mock ink components since they require terminal environment
vi.mock('ink', () => ({
  Box: ({ children, borderStyle, borderColor, padding, marginTop, flexDirection }: {
    children: React.ReactNode;
    borderStyle?: string;
    borderColor?: string;
    padding?: number;
    marginTop?: number;
    flexDirection?: string;
  }) => React.createElement('div', {
    'data-border-style': borderStyle,
    'data-border-color': borderColor,
    'data-padding': padding,
    'data-margin-top': marginTop,
    'data-flex-direction': flexDirection,
  }, children),
  Text: ({ children, color, bold, dimColor }: {
    children: React.ReactNode;
    color?: string;
    bold?: boolean;
    dimColor?: boolean;
  }) => React.createElement('span', {
    'data-color': color,
    'data-bold': bold,
    'data-dim': dimColor,
  }, children),
}));

describe('PreviewPanel', () => {
  const mockProject: ProjectEntry = {
    id: 'test-id',
    path: '/Users/test/project',
    activeConfig: 'anthropic-config',
    lastModified: '2026-04-14T10:00:00Z',
  };

  const mockProjectNoConfig: ProjectEntry = {
    id: 'test-id-2',
    path: '/Users/test/another-project',
    activeConfig: null,
    lastModified: '2026-04-14T10:00:00Z',
  };

  const mockTemplate: TemplateConfig = {
    name: 'anthropic-config',
    description: 'Anthropic API configuration',
    provider: {
      name: 'Anthropic',
      baseUrl: 'https://api.anthropic.com',
      authType: 'token',
    },
  };

  describe('visibility', () => {
    it('visible=false renders nothing', () => {
      const { container } = render(
        <PreviewPanel visible={false} project={mockProject} />
      );
      expect(container.innerHTML).toBe('');
    });

    it('visible=true with null project renders nothing', () => {
      const { container } = render(
        <PreviewPanel visible={true} project={null} />
      );
      expect(container.innerHTML).toBe('');
    });

    it('visible=true with project renders content', () => {
      const { container } = render(
        <PreviewPanel visible={true} project={mockProject} />
      );
      expect(container.textContent).toContain('project');
    });
  });

  describe('project display', () => {
    it('project path is displayed', () => {
      const { container } = render(
        <PreviewPanel visible={true} project={mockProject} />
      );
      expect(container.textContent).toContain('/Users/test/project');
    });

    it('activeConfig is displayed in green when set', () => {
      const { container } = render(
        <PreviewPanel visible={true} project={mockProject} />
      );
      const greenText = container.querySelector('[data-color="green"]');
      expect(greenText).not.toBeNull();
      expect(greenText?.textContent).toContain('anthropic-config');
    });

    it('activeConfig shows "none" in gray when null', () => {
      const { container } = render(
        <PreviewPanel visible={true} project={mockProjectNoConfig} />
      );
      const grayText = container.querySelector('[data-color="gray"]');
      expect(grayText).not.toBeNull();
      expect(grayText?.textContent).toContain('none');
    });

    it('project name (last path segment) shown in preview header', () => {
      const { container } = render(
        <PreviewPanel visible={true} project={mockProject} />
      );
      // Should show "project" as the name (last segment of path)
      expect(container.textContent).toContain('Preview: project');
    });
  });

  describe('template preview', () => {
    it('template preview shows template name', () => {
      const { container } = render(
        <PreviewPanel visible={true} project={mockProject} template={mockTemplate} />
      );
      const yellowText = container.querySelector('[data-color="yellow"]');
      expect(yellowText).not.toBeNull();
      expect(yellowText?.textContent).toContain('anthropic-config');
    });

    it('template preview shows provider name', () => {
      const { container } = render(
        <PreviewPanel visible={true} project={mockProject} template={mockTemplate} />
      );
      expect(container.textContent).toContain('Anthropic');
    });

    it('template preview shows provider baseUrl', () => {
      const { container } = render(
        <PreviewPanel visible={true} project={mockProject} template={mockTemplate} />
      );
      expect(container.textContent).toContain('https://api.anthropic.com');
    });

    it('no template section when template is null', () => {
      const { container } = render(
        <PreviewPanel visible={true} project={mockProject} template={null} />
      );
      // Should not show template-related content
      expect(container.textContent).not.toContain('Template:');
    });
  });

  describe('container styling', () => {
    it('panel has borderStyle="single"', () => {
      const { container } = render(
        <PreviewPanel visible={true} project={mockProject} />
      );
      const boxElement = container.querySelector('[data-border-style="single"]');
      expect(boxElement).not.toBeNull();
    });

    it('panel has borderColor="yellow"', () => {
      const { container } = render(
        <PreviewPanel visible={true} project={mockProject} />
      );
      const boxElement = container.querySelector('[data-border-color="yellow"]');
      expect(boxElement).not.toBeNull();
    });

    it('panel has padding={1}', () => {
      const { container } = render(
        <PreviewPanel visible={true} project={mockProject} />
      );
      const boxElement = container.querySelector('[data-padding="1"]');
      expect(boxElement).not.toBeNull();
    });

    it('panel has marginTop={1}', () => {
      const { container } = render(
        <PreviewPanel visible={true} project={mockProject} />
      );
      const boxElement = container.querySelector('[data-margin-top="1"]');
      expect(boxElement).not.toBeNull();
    });

    it('panel has flexDirection="column"', () => {
      const { container } = render(
        <PreviewPanel visible={true} project={mockProject} />
      );
      const boxElement = container.querySelector('[data-flex-direction="column"]');
      expect(boxElement).not.toBeNull();
    });
  });
});