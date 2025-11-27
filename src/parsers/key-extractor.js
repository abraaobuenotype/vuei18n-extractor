import fs from "fs-extra";
import { validateMessageFormat, parseMessage } from "./message-parser.js";

/**
 * Extracts translation calls from source code
 * Supports various patterns:
 * - t("simple")
 * - t("with {variable}")
 * - t("{count, plural, one {# item} other {# items}}")
 */
export class KeyExtractor {
  constructor() {
    // More flexible regex that captures content between quotes
    // Matches: t("...") or t('...')
    this.patterns = {
      // Simple t() calls
      simple: /\bt\(\s*(['"`])(.+?)\1\s*\)/gs,
      // t() with options object: t("key", { ... })
      withOptions: /\bt\(\s*(['"`])(.+?)\1\s*,\s*\{[^}]*\}\s*\)/gs,
    };
  }

  /**
   * Extracts keys from a file
   * @param {string} filePath - Path to the file
   * @returns {import('../types.js').ExtractedKey[]} Extracted keys
   */
  extractFromFile(filePath) {
    const content = fs.readFileSync(filePath, "utf-8");
    return this.extractFromCode(content, filePath);
  }

  /**
   * Extracts keys from code content
   * @param {string} code - Source code
   * @param {string} filePath - Path to the source file
   * @returns {import('../types.js').ExtractedKey[]} Extracted keys
   */
  extractFromCode(code, filePath) {
    const keys = [];
    const seen = new Set();

    // Extract simple t() calls
    const matches = code.matchAll(this.patterns.simple);

    for (const match of matches) {
      const message = match[2];

      // Skip if already seen
      if (seen.has(message)) continue;
      seen.add(message);

      // Skip if message is too short or suspiciously long
      if (message.length < 1 || message.length > 5000) continue;

      try {
        // Validate the message format
        validateMessageFormat(message);

        // Parse message metadata
        const metadata = parseMessage(message);

        // Get line number
        const lineNumber = this.getLineNumber(code, match.index);

        keys.push({
          key: message,
          message: message,
          files: [filePath],
          line: lineNumber,
          variables: metadata.variables,
          hasPlural: metadata.hasPlural,
          hasDate: metadata.hasDate,
        });
      } catch (err) {
        console.warn(
          `Warning: Skipping invalid message in ${filePath}:${this.getLineNumber(code, match.index)}: ${err.message}`
        );
      }
    }

    return keys;
  }

  /**
   * Gets the line number of a match in the code
   * @param {string} code - Source code
   * @param {number} index - Index of the match
   * @returns {number} Line number
   */
  getLineNumber(code, index) {
    return code.substring(0, index).split("\n").length;
  }

  /**
   * Merges keys from multiple extractions
   * Ensures deterministic ordering by sorting file lists
   * @param {import('../types.js').ExtractedKey[]} keys1
   * @param {import('../types.js').ExtractedKey[]} keys2
   * @returns {import('../types.js').ExtractedKey[]} Merged keys
   */
  mergeKeys(keys1, keys2) {
    const keyMap = new Map();

    // Add keys1
    keys1.forEach((key) => {
      keyMap.set(key.key, { ...key, files: [...key.files] });
    });

    // Merge keys2
    keys2.forEach((key) => {
      if (keyMap.has(key.key)) {
        const existing = keyMap.get(key.key);
        // Merge file lists and SORT for deterministic ordering
        const mergedFiles = [...new Set([...existing.files, ...key.files])];
        existing.files = mergedFiles.sort();
      } else {
        keyMap.set(key.key, { ...key, files: [...key.files] });
      }
    });

    // Return sorted by key for deterministic output
    return Array.from(keyMap.values())
      .map((k) => ({ ...k, files: k.files.sort() }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }
}
