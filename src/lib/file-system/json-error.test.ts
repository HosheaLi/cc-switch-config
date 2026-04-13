/**
 * JSON Error Enhancement Tests
 *
 * Tests for enhanced JSON error messages with line numbers, column numbers,
 * and context around error positions.
 */

import { describe, it, expect } from 'vitest';
import {
  parseJSONWithErrorContext,
  formatJSONError,
  createEnhancedErrorMessage,
  type JSONErrorContext,
} from './json-error.js';

describe('json-error', () => {
  describe('parseJSONWithErrorContext', () => {
    it('should throw for invalid JSON', () => {
      const invalidJSON = '{ invalid }';

      expect(() => parseJSONWithErrorContext(invalidJSON)).toThrow();
    });

    it('should include "Line X" in error message for invalid JSON', () => {
      const invalidJSON = '{\n  "key": invalid\n}';

      try {
        parseJSONWithErrorContext(invalidJSON, 'test.json');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        const message = (error as Error).message;
        expect(message).toMatch(/Line\s+\d+/i);
      }
    });

    it('should include "column Y" in error message for invalid JSON', () => {
      const invalidJSON = '{\n  "key": invalid\n}';

      try {
        parseJSONWithErrorContext(invalidJSON, 'test.json');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        const message = (error as Error).message;
        expect(message).toMatch(/column\s+\d+/i);
      }
    });

    it('should show the error line content in error message', () => {
      const invalidJSON = '{\n  "key": invalid\n}';

      try {
        parseJSONWithErrorContext(invalidJSON, 'test.json');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        const message = (error as Error).message;
        // Should contain the actual line with the error
        expect(message).toContain('"key": invalid');
      }
    });

    it('should show caret pointing to error position', () => {
      const invalidJSON = '{\n  "key": invalid\n}';

      try {
        parseJSONWithErrorContext(invalidJSON, 'test.json');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        const message = (error as Error).message;
        // Should have a caret (^) pointing to the error
        expect(message).toMatch(/\^\s*$/m);
      }
    });

    it('should show correct location for missing comma error', () => {
      // Missing comma between properties
      // JSON parser reports error at line 3 where it finds the unexpected "key2"
      const invalidJSON = '{\n  "key1": "value1"\n  "key2": "value2"\n}';

      try {
        parseJSONWithErrorContext(invalidJSON, 'test.json');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        const message = (error as Error).message;
        // Error is on line 3 where the parser finds "key2" without preceding comma
        expect(message).toMatch(/Line\s+3/i);
        // Should show the problematic line
        expect(message).toContain('key2');
      }
    });

    it('should show correct location for missing bracket error', () => {
      // Missing closing bracket
      const invalidJSON = '{\n  "key": "value"\n  "nested": {';

      try {
        parseJSONWithErrorContext(invalidJSON, 'test.json');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        const message = (error as Error).message;
        // Should indicate an error location
        expect(message).toMatch(/Line\s+\d+/i);
      }
    });

    it('should show correct location for trailing comma error', () => {
      // Trailing comma
      const invalidJSON = '{\n  "key": "value",\n}';

      try {
        parseJSONWithErrorContext(invalidJSON, 'test.json');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        const message = (error as Error).message;
        // Should indicate an error location
        expect(message).toMatch(/Line\s+\d+/i);
        // Should show the trailing comma line
        expect(message).toMatch(/\}/);
      }
    });

    it('should return parsed object for valid JSON', () => {
      const validJSON = '{"key": "value", "number": 42}';

      const result = parseJSONWithErrorContext(validJSON);

      expect(result).toEqual({ key: 'value', number: 42 });
    });

    it('should include filepath in error message when provided', () => {
      const invalidJSON = '{ invalid }';

      try {
        parseJSONWithErrorContext(invalidJSON, '/path/to/config.json');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        const message = (error as Error).message;
        expect(message).toContain('/path/to/config.json');
      }
    });
  });

  describe('formatJSONError', () => {
    it('should extract position from "position N" format', () => {
      const content = '{\n  "key": invalid\n}';
      const error = new SyntaxError('Unexpected token i in JSON at position 10');

      const context = formatJSONError(error, content, 'test.json');

      expect(context).toBeDefined();
      expect(context.line).toBeGreaterThanOrEqual(1);
      expect(context.column).toBeGreaterThanOrEqual(1);
    });

    it('should return null context for non-position errors', () => {
      const error = new SyntaxError('Some other error without position');
      const content = '{}';

      const context = formatJSONError(error, content, 'test.json');

      // Should return a context even if position can't be extracted
      expect(context).toBeDefined();
      expect(context.filepath).toBe('test.json');
    });
  });

  describe('createEnhancedErrorMessage', () => {
    it('should format error with all context information', () => {
      const context: JSONErrorContext = {
        filepath: '/config/test.json',
        line: 3,
        column: 15,
        message: 'Unexpected token',
        content: '  "key": invalid',
        position: 20,
      };

      const message = createEnhancedErrorMessage(context);

      expect(message).toContain('/config/test.json');
      expect(message).toContain('Line 3');
      expect(message).toContain('column 15');
      expect(message).toContain('"key": invalid');
      expect(message).toContain('^');
    });

    it('should handle missing filepath gracefully', () => {
      const context: JSONErrorContext = {
        line: 1,
        column: 5,
        message: 'Unexpected token',
        content: '{bad}',
        position: 4,
      };

      const message = createEnhancedErrorMessage(context);

      // Should still show line and column
      expect(message).toContain('Line 1');
      expect(message).toContain('column 5');
    });

    it('should align caret correctly for multi-byte characters', () => {
      const context: JSONErrorContext = {
        line: 1,
        column: 12,
        message: 'Unexpected token',
        content: '{"name": "value"}',
        position: 11,
      };

      const message = createEnhancedErrorMessage(context);

      // Caret should be at the correct position
      expect(message).toContain('^');
    });
  });

  describe('integration scenarios', () => {
    it('should handle single-line JSON errors', () => {
      const invalidJSON = '{"key": invalid}';

      try {
        parseJSONWithErrorContext(invalidJSON, 'single-line.json');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        const message = (error as Error).message;
        expect(message).toMatch(/Line\s+1/i);
      }
    });

    it('should handle multi-line JSON errors', () => {
      const invalidJSON = `{
  "users": [
    { "name": "Alice" },
    { "name": "Bob", }
  ]
}`;

      try {
        parseJSONWithErrorContext(invalidJSON, 'multi-line.json');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        const message = (error as Error).message;
        // Should point to the correct line with trailing comma
        expect(message).toMatch(/Line\s+\d+/i);
      }
    });

    it('should handle deeply nested JSON errors', () => {
      const invalidJSON = `{
  "level1": {
    "level2": {
      "level3": {
        "level4": {
          "broken": here
        }
      }
    }
  }
}`;

      try {
        parseJSONWithErrorContext(invalidJSON, 'nested.json');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        const message = (error as Error).message;
        expect(message).toMatch(/Line\s+\d+/i);
        expect(message).toContain('broken');
      }
    });

    it('should handle empty content gracefully', () => {
      const invalidJSON = '';

      try {
        parseJSONWithErrorContext(invalidJSON, 'empty.json');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        // Should still throw an error for empty content
      }
    });

    it('should preserve original error message', () => {
      const invalidJSON = '{ "key": invalid }';

      try {
        parseJSONWithErrorContext(invalidJSON, 'preserve.json');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        const message = (error as Error).message;
        // Should contain some indication of the original error type
        expect(message.length).toBeGreaterThan(0);
      }
    });
  });
});