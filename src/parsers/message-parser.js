import { isValidVariableName } from "../utils/security.js";

/**
 * Extracts variables from an interpolated string
 * Example: "Hello {name}, you have {count} messages" -> ["name", "count"]
 * @param {string} text - Text to extract variables from
 * @returns {string[]} Array of variable names
 */
export function extractVariables(text) {
  const variables = [];
  // Match {variableName} pattern
  const regex = /\{([a-zA-Z_$][a-zA-Z0-9_$]*)\}/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const varName = match[1];
    if (isValidVariableName(varName) && !variables.includes(varName)) {
      variables.push(varName);
    }
  }

  return variables;
}

/**
 * Detects if a message uses pluralization
 * Lingui-style: {count, plural, one {# item} other {# items}}
 * @param {string} text - Text to check for pluralization
 * @returns {boolean} Whether the text contains plural syntax
 */
export function hasPluralization(text) {
  // ICU MessageFormat plural pattern
  return /\{\s*\w+\s*,\s*plural\s*,/.test(text);
}

/**
 * Detects if a message uses date formatting
 * Example: {date, date, short}
 * @param {string} text - Text to check for date formatting
 * @returns {boolean} Whether the text contains date syntax
 */
export function hasDateFormatting(text) {
  // ICU MessageFormat date pattern
  return /\{\s*\w+\s*,\s*(date|time)\s*,/.test(text);
}

/**
 * Parses a translation message to extract metadata
 * @param {string} message - The translation message
 * @returns {Object} Metadata about the message
 */
export function parseMessage(message) {
  return {
    variables: extractVariables(message),
    hasPlural: hasPluralization(message),
    hasDate: hasDateFormatting(message),
    length: message.length,
  };
}

/**
 * Validates an ICU MessageFormat string for safety
 * @param {string} message - Message to validate
 * @throws {Error} If message contains unsafe patterns
 */
export function validateMessageFormat(message) {
  if (typeof message !== "string") {
    throw new Error("Message must be a string");
  }

  if (message.length > 5000) {
    throw new Error("Message too long (max 5000 characters)");
  }

  // Check for balanced braces
  let braceCount = 0;
  for (const char of message) {
    if (char === "{") braceCount++;
    if (char === "}") braceCount--;
    if (braceCount < 0) {
      throw new Error("Unbalanced braces in message");
    }
  }

  if (braceCount !== 0) {
    throw new Error("Unbalanced braces in message");
  }

  // Validate variable names
  const variables = extractVariables(message);
  variables.forEach((varName) => {
    if (!isValidVariableName(varName)) {
      throw new Error(`Invalid variable name: ${varName}`);
    }
  });
}
