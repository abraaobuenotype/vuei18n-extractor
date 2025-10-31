import fs from "fs-extra";
import path from "path";
import { validatePath } from "../utils/security.js";
import { validateConfig } from "../utils/validation.js";

/**
 * Loads configuration from a file
 */
export class ConfigLoader {
  /**
   * Loads configuration from JS or JSON file
   * @param {string} configPath - Path to configuration file
   * @returns {Promise<import('../types.js').ExtractConfig>} Configuration object
   */
  async load(configPath) {
    // Validate path to prevent path traversal
    const safePath = validatePath(configPath);

    // Only allow config files in current directory
    if (path.dirname(safePath) !== process.cwd()) {
      throw new Error(
        "Security: Configuration file must be in the project root directory"
      );
    }

    const ext = path.extname(configPath);
    let config;

    if (ext === ".json") {
      config = await this.loadJSON(safePath);
    } else if (ext === ".js") {
      config = await this.loadJS(safePath);
    } else {
      throw new Error(`Unsupported config file type: ${ext}`);
    }

    // Validate configuration
    validateConfig(config);

    return config;
  }

  /**
   * Loads JSON configuration
   * @param {string} filePath - Path to JSON file
   * @returns {Promise<Object>} Configuration object
   */
  async loadJSON(filePath) {
    try {
      return await fs.readJSON(filePath);
    } catch (err) {
      throw new Error(`Failed to load JSON config: ${err.message}`);
    }
  }

  /**
   * Loads JavaScript configuration
   * @param {string} filePath - Path to JS file
   * @returns {Promise<Object>} Configuration object
   */
  async loadJS(filePath) {
    try {
      const module = await import(filePath);
      return module.default;
    } catch (err) {
      throw new Error(`Failed to load JS config: ${err.message}`);
    }
  }
}
