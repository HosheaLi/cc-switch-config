/**
 * JSON Error Enhancement Module
 *
 * Provides enhanced JSON error messages with line numbers, column numbers,
 * and context around error positions. Enables users to quickly locate and
 * fix syntax errors in config files.
 *
 * Key features:
 * - Extracts position from JSON.parse errors
 * - Calculates accurate line and column numbers
 * - Shows the problematic line with caret pointing to error
 * - Works with raw JSON content (not file-based)
 */

/**
 * Structured context for a JSON parse error.
 */
export interface JSONErrorContext {
  /** File path where the error occurred (optional) */
  filepath?: string;
  /** Line number where the error occurred (1-based) */
  line: number;
  /** Column number where the error occurred (1-based) */
  column: number;
  /** Original error message */
  message: string;
  /** The content of the line with the error */
  content: string;
  /** Character position in the entire content (0-based) */
  position: number;
}

/**
 * Custom error class for enhanced JSON errors.
 */
export class EnhancedJSONError extends Error {
  public readonly context: JSONErrorContext;

  constructor(context: JSONErrorContext) {
    super(createEnhancedErrorMessage(context));
    this.name = 'EnhancedJSONError';
    this.context = context;
  }
}

/**
 * Get line and column from a character position in content.
 *
 * @param content - The full JSON content
 * @param position - Character position (0-based)
 * @returns Line number, column number, and line content
 */
function getPositionContext(
  content: string,
  position: number
): { line: number; column: number; lineContent: string } {
  const lines = content.split('\n');
  let currentPos = 0;

  for (let i = 0; i < lines.length; i++) {
    const lineLength = lines[i].length;
    // Position is within this line if currentPos + lineLength >= position
    if (currentPos + lineLength >= position) {
      const column = position - currentPos + 1;
      return {
        line: i + 1,
        column,
        lineContent: lines[i],
      };
    }
    // Move past this line and its newline character
    currentPos += lineLength + 1;
  }

  // Fallback: position exceeds content length
  // Return last line
  const lastLineIndex = lines.length - 1;
  return {
    line: lastLineIndex + 1,
    column: 1,
    lineContent: lines[lastLineIndex] || '',
  };
}

/**
 * Create a caret pointer string for a given column position.
 *
 * @param column - Column number (1-based)
 * @returns String with spaces and caret
 */
function createCaretPointer(column: number): string {
  // column is 1-based, so we need column-1 spaces before the caret
  return ' '.repeat(Math.max(0, column - 1)) + '^';
}

/**
 * Parse JSON content with enhanced error messages.
 *
 * Attempts to parse JSON and throws an EnhancedJSONError with
 * line number, column, and context for syntax errors.
 *
 * @param content - JSON string to parse
 * @param filepath - Optional file path for error messages
 * @returns Parsed JSON object
 * @throws EnhancedJSONError for syntax errors
 */
export function parseJSONWithErrorContext(
  content: string,
  filepath?: string
): unknown {
  try {
    return JSON.parse(content);
  } catch (error) {
    if (error instanceof SyntaxError) {
      const context = formatJSONError(error, content, filepath);
      throw new EnhancedJSONError(context);
    }
    throw error;
  }
}

/**
 * Format a JSON SyntaxError into structured error context.
 *
 * Extracts position information from the error message and
 * calculates line/column numbers.
 *
 * @param error - The SyntaxError from JSON.parse
 * @param content - The JSON content that failed to parse
 * @param filepath - Optional file path for error messages
 * @returns Structured error context
 */
export function formatJSONError(
  error: SyntaxError,
  content: string,
  filepath?: string
): JSONErrorContext {
  let position = 0;

  // Try to extract position from various error message formats

  // Format 1: "at position N"
  const posMatch = error.message.match(/position\s+(\d+)/i);
  if (posMatch) {
    position = parseInt(posMatch[1], 10);
  }

  // Format 2: "at line N column M"
  const lineColMatch = error.message.match(/line\s+(\d+)\s+column\s+(\d+)/i);
  if (lineColMatch) {
    const lineNum = parseInt(lineColMatch[1], 10);
    const colNum = parseInt(lineColMatch[2], 10);
    // Calculate position from line and column
    const lines = content.split('\n');
    let currentPos = 0;
    for (let i = 0; i < lineNum - 1 && i < lines.length; i++) {
      currentPos += lines[i].length + 1;
    }
    position = currentPos + colNum - 1;
  }

  // Format 3: "Unexpected token 'X'"
  // Try to find the unexpected token in content
  if (position === 0) {
    const tokenMatch = error.message.match(/Unexpected token\s+['"](.+?)['"]/i);
    if (tokenMatch) {
      const token = tokenMatch[1];
      const tokenIndex = content.indexOf(token);
      if (tokenIndex !== -1) {
        position = tokenIndex;
      }
    }
  }

  // Format 4: "Unexpected end of JSON input"
  if (position === 0 && error.message.includes('Unexpected end')) {
    position = content.length;
  }

  // Get line context from position
  const { line, column, lineContent } = getPositionContext(content, position);

  return {
    filepath,
    line,
    column,
    message: error.message,
    content: lineContent,
    position,
  };
}

/**
 * Create an enhanced error message from structured context.
 *
 * Format:
 * JSON syntax error in {filepath}
 * Line {line}, column {column}
 *   {content}
 *   {caret}
 *
 * @param context - Structured error context
 * @returns Formatted error message string
 */
export function createEnhancedErrorMessage(context: JSONErrorContext): string {
  const parts: string[] = [];

  // Header with filepath
  if (context.filepath) {
    parts.push(`JSON syntax error in ${context.filepath}`);
  } else {
    parts.push('JSON syntax error');
  }

  // Line and column
  parts.push(`Line ${context.line}, column ${context.column}`);

  // Show the line with error
  parts.push(`  ${context.content}`);

  // Show caret pointing to error
  parts.push(`  ${createCaretPointer(context.column)}`);

  // Include original error message for additional context
  parts.push(`Error: ${context.message}`);

  return parts.join('\n');
}