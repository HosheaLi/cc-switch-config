/**
 * Types Module - Barrel Export
 *
 * Central export point for all type definitions.
 * Per D-08: src/lib/types/ directory unified management.
 *
 * Import examples:
 * - import { ClaudeSettings, validateConfig } from './lib/types/index.js';
 * - import type { ClaudeSettings } from './lib/types/index.js';
 */

// Core config schemas and types
export * from './config.js';

// Validation utilities
export * from './validation.js';

// Merge algorithms
export * from './merge.js';

// Provider and template types
export * from './provider.js';