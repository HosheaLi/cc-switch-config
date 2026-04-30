/**
 * Default Skip Directories
 *
 * Per D-08: Hardcoded list of common build/dependency directories.
 * Per ONB-04: node_modules/.git/dist/build/target/.venv/__pycache__
 *
 * These directories are skipped during walkDirectory traversal
 * to avoid scanning dependency caches and build outputs.
 */

/**
 * Default directories to skip during project scanning.
 * Immutable array using `as const` for type inference.
 */
export const DEFAULT_SKIP_DIRS = [
  'node_modules',   // npm dependencies
  '.git',           // git repository metadata
  'dist',           // JS build output
  'build',          // JS build output
  'target',         // Rust/Java build output
  '.venv',          // Python virtual environment
  '__pycache__',    // Python bytecode cache
] as const;

/**
 * Type for DEFAULT_SKIP_DIRS array items.
 * Enables type inference when merged with user skipDirectories.
 */
export type SkipDirName = typeof DEFAULT_SKIP_DIRS[number];