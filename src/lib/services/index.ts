/**
 * Services Layer - Barrel Export
 *
 * Per D-07: Unified export from single entry point.
 * Per M4: Services are independent of UI/TUI.
 *
 * Import examples:
 * - import { ConfigService, ServiceError } from './lib/services/index.js';
 * - import { ProjectService, ScanResult } from './lib/services/index.js';
 * - import { ProviderService, ConnectivityResult } from './lib/services/index.js';
 * - import { ExportService } from './lib/services/index.js';
 * - import { UndoService, UndoResult } from './lib/services/index.js';
 * - import { ApiService } from './lib/services/index.js';
 */

// Service classes
export { ConfigService } from './config-service.js';
export { ProjectService } from './project-service.js';
export { ProviderService } from './provider-service.js';
export { ExportService } from './export-service.js';
export { UndoService } from './undo-service.js';
export { ApiService } from './api-service.js';

// Service error handling
export { ServiceError } from './types.js';

// Service-specific types
export type { ConnectivityResult } from './provider-service.js';
export type { ScanResult } from './project-service.js';
export type { ImportStrategy } from './export-service.js';
export type { UndoResult } from './undo-service.js';

// Re-export types that services use (convenience for callers)
export type { ClaudeSettings } from '../types/config.js';
export type { ApiConfig, MaskedApiConfig } from '../types/api-config.js';
export type { ProjectEntry } from '../store/project.js';
export type { ConflictField, ExportPayload, ExportMetadata, ExportPayloadSchema } from '../types/export-schema.js';