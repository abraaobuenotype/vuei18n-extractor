/**
 * Validates configuration object for security and correctness
 * @param {any} config - Configuration to validate
 * @throws {Error} If configuration is invalid or unsafe
 */
export function validateConfig(config) {
  if (!config || typeof config !== "object") {
    throw new Error("Configuration must be an object");
  }

  // Validate required fields
  if (!config.sourceLocale || typeof config.sourceLocale !== "string") {
    throw new Error("sourceLocale is required and must be a string");
  }

  if (!Array.isArray(config.locales) || config.locales.length === 0) {
    throw new Error("locales must be a non-empty array");
  }

  // Validate locales are safe strings (alphanumeric + dash/underscore only)
  const localeRegex = /^[a-zA-Z0-9_-]+$/;
  config.locales.forEach((locale) => {
    if (!localeRegex.test(locale)) {
      throw new Error(
        `Invalid locale "${locale}". Only alphanumeric characters, dashes, and underscores allowed.`
      );
    }
  });

  // Validate format
  const validFormats = ["js", "json", "ts"];
  if (!validFormats.includes(config.format)) {
    throw new Error(
      `Invalid format "${config.format}". Must be one of: ${validFormats.join(", ")}`
    );
  }

  // Validate catalogs
  if (!config.catalogs || typeof config.catalogs !== "object") {
    throw new Error("catalogs configuration is required");
  }

  if (
    !config.catalogs.outputFolder ||
    typeof config.catalogs.outputFolder !== "string"
  ) {
    throw new Error("catalogs.outputFolder is required and must be a string");
  }

  // Prevent path traversal in outputFolder
  if (config.catalogs.outputFolder.includes("..")) {
    throw new Error(
      "Security: Path traversal detected in outputFolder. Use relative paths without '..'"
    );
  }

  if (!Array.isArray(config.catalogs.include)) {
    throw new Error("catalogs.include must be an array");
  }
}
