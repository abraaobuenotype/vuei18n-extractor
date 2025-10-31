import path from "path";

/**
 * Validates and sanitizes a file path to prevent path traversal attacks
 * @param {string} filePath - The path to validate
 * @param {string} baseDir - The base directory that the path should be within
 * @returns {string} The validated absolute path
 * @throws {Error} If path traversal is detected
 */
export function validatePath(filePath, baseDir = process.cwd()) {
  const resolvedPath = path.resolve(baseDir, filePath);
  const normalizedBase = path.normalize(baseDir);

  // Ensure the resolved path is within the base directory
  if (!resolvedPath.startsWith(normalizedBase)) {
    throw new Error(
      `Security: Path traversal detected. Path "${filePath}" is outside project directory.`
    );
  }

  return resolvedPath;
}

/**
 * Escapes special characters in a string to prevent injection
 * @param {string} str - String to escape
 * @returns {string} Escaped string safe for use in generated code
 */
export function escapeString(str) {
  if (typeof str !== "string") return "";

  return (
    str
      .replace(/\\/g, "\\\\") // Escape backslashes
      .replace(/"/g, '\\"') // Escape double quotes
      .replace(/'/g, "\\'") // Escape single quotes
      .replace(/\n/g, "\\n") // Escape newlines
      .replace(/\r/g, "\\r") // Escape carriage returns
      .replace(/\t/g, "\\t") // Escape tabs
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x1F\x7F]/g, "")
  ); // Remove control characters
}

/**
 * Validates a variable name to ensure it's safe
 * @param {string} varName - Variable name to validate
 * @returns {boolean} Whether the variable name is safe
 */
export function isValidVariableName(varName) {
  // Only allow alphanumeric, underscore, and dollar sign
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(varName);
}

/**
 * Sanitizes a variable name by removing invalid characters
 * @param {string} varName - Variable name to sanitize
 * @returns {string} Sanitized variable name
 */
export function sanitizeVariableName(varName) {
  if (!varName || typeof varName !== "string") return "";

  // Remove invalid characters
  const sanitized = varName.replace(/[^a-zA-Z0-9_$]/g, "_");

  // Ensure it doesn't start with a number
  if (/^[0-9]/.test(sanitized)) {
    return `_${sanitized}`;
  }

  return sanitized;
}
