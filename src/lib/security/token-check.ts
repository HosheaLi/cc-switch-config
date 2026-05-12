/**
 * Token Security Checks
 *
 * Prevents API tokens from leaking to git repositories.
 * Checks git tracking status and validates token file security.
 *
 * Key security guarantees:
 * - Tokens never appear in git-tracked files (S1)
 * - settings.local.json should be in .gitignore
 * - Token values are masked in display (show only last 4 chars)
 */

import fs from 'fs-extra';
import path from 'path';
import { execFileSync } from 'child_process';

/**
 * Token file name constant.
 * settings.local.json is the standard file for storing sensitive tokens.
 */
const TOKEN_FILE = 'settings.local.json';

/**
 * Gitignore file name constant.
 */
const GITIGNORE = '.gitignore';

/**
 * Check if a file is a token file (settings.local.json).
 *
 * @param filepath - File path to check (can be full path or just filename)
 * @returns true if file is settings.local.json, false otherwise
 */
export function isTokenFile(filepath: string): boolean {
  const filename = path.basename(filepath);
  return filename === TOKEN_FILE;
}

/**
 * Mask a token for safe display.
 *
 * Shows only the last 4 characters, replacing the rest with dots.
 * For short tokens (< 4 chars), returns '****'.
 *
 * @param token - Token string to mask
 * @returns Masked token string
 *
 * @example
 * maskToken('sk-ant-abc123xyz') // returns '...xyz'
 * maskToken('abc') // returns '****'
 */
export function maskToken(token: string): string {
  if (!token || token.length < 4) {
    return '****';
  }
  return `...${token.slice(-4)}`;
}

/**
 * Check if a file is ignored by git.
 *
 * Reads .gitignore from the project directory and checks if the file
 * matches any ignore pattern. Returns true if the file is ignored (safe),
 * false if it may be tracked by git.
 *
 * Note: This is a simple pattern check. For more robust checking,
 * use 'git check-ignore' command which handles complex patterns.
 *
 * @param projectDir - Project directory containing .gitignore
 * @param filepath - File path to check (relative to projectDir or full path)
 * @returns true if file is ignored (safe), false if potentially tracked
 */
export async function checkGitTracking(
  projectDir: string,
  filepath: string
): Promise<boolean> {
  const filename = path.basename(filepath);

  // Prefer git check-ignore for accurate pattern matching
  try {
    execFileSync('git', ['check-ignore', '-q', filename], { cwd: projectDir, stdio: 'pipe' });
    return true;
  } catch {
    // git command failed or file not ignored — fall through to regex matching
  }

  const gitignorePath = path.join(projectDir, GITIGNORE);
  try {
    const gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
    const patterns = gitignoreContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));

    // Check exact match
    if (patterns.includes(filename)) {
      return true;
    }

    // Check wildcard patterns (*.local.json, *.json, etc.)
    for (const pattern of patterns) {
      // Handle simple wildcard patterns
      if (pattern.startsWith('*')) {
        const suffix = pattern.slice(1);
        if (filename.endsWith(suffix)) {
          return true;
        }
      }
      if (pattern.endsWith('*')) {
        const prefix = pattern.slice(0, -1);
        if (filename.startsWith(prefix)) {
          return true;
        }
      }
      // Handle patterns like *.ext
      if (pattern.includes('*')) {
        const regex = new RegExp(
          '^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$'
        );
        if (regex.test(filename)) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    // .gitignore doesn't exist - file may be tracked
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

/**
 * Validate token file security.
 *
 * Checks:
 * 1. Is the file a token file (settings.local.json)?
 * 2. Is it tracked by git? (warns if yes)
 * 3. Are file permissions secure (600)? (warns if not)
 *
 * @param projectDir - Project directory
 * @param filepath - File path to validate
 * @returns Security validation result with safe status and warnings
 */
export async function validateTokenSecurity(
  projectDir: string,
  filepath: string
): Promise<{ safe: boolean; warnings: string[] }> {
  const warnings: string[] = [];

  // If not a token file, it's safe
  if (!isTokenFile(filepath)) {
    return { safe: true, warnings: [] };
  }

  // Check git tracking
  const isIgnored = await checkGitTracking(projectDir, filepath);
  if (!isIgnored) {
    warnings.push('Token file may be tracked by git. Add settings.local.json to .gitignore.');
  }

  // Check file permissions if file exists
  const fullPath = path.isAbsolute(filepath)
    ? filepath
    : path.join(projectDir, filepath);

  try {
    const stat = await fs.stat(fullPath);
    const mode = stat.mode & 0o777;

    // Recommended permissions: 600 (owner read/write only)
    if (mode !== 0o600) {
      warnings.push(
        `Token file has permissions ${mode.toString(8).padStart(3, '0')}. Recommended: 600 (owner read/write only).`
      );
    }
  } catch {
    // File doesn't exist - skip permission check
  }

  // Safe from git tracking = safe overall
  const safe = isIgnored;

  return { safe, warnings };
}