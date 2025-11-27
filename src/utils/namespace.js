import path from "path";

/**
 * @typedef {Object} NamespaceConfig
 * @property {'flat' | 'directory' | 'feature' | 'file' | 'custom'} strategy - Strategy to use for namespacing
 * @property {string} [baseDir] - Base directory to calculate relative paths (default: process.cwd())
 * @property {string[]} [featureFolders] - Folders that indicate feature boundaries (e.g., ['features', 'modules', 'pages'])
 * @property {number} [maxDepth] - Maximum depth for directory-based namespacing (default: 3)
 * @property {Function} [customFn] - Custom function to generate namespace from file path
 */

/**
 * Generates a namespace from a file path using different strategies
 */
export class NamespaceGenerator {
  /**
   * @param {NamespaceConfig} config
   */
  constructor(config = {}) {
    this.strategy = config.strategy || "flat";
    this.baseDir = config.baseDir || process.cwd();
    this.featureFolders = config.featureFolders || [
      "features",
      "modules",
      "pages",
      "components",
      "views",
      "layouts",
      "composables",
    ];
    this.maxDepth = config.maxDepth || 3;
    this.customFn = config.customFn;
  }

  /**
   * Generates a namespace from a file path
   * @param {string} filePath - Absolute file path
   * @returns {string} Namespace (e.g., 'pages.auth.login' or 'common')
   */
  generate(filePath) {
    let namespace;

    switch (this.strategy) {
      case "flat":
        namespace = this.generateFlat();
        break;

      case "directory":
        namespace = this.generateFromDirectory(filePath);
        break;

      case "feature":
        namespace = this.generateFromFeature(filePath);
        break;

      case "file":
        namespace = this.generateFromFile(filePath);
        break;

      case "custom":
        namespace = this.generateCustom(filePath);
        break;

      default:
        // Log warning for unknown strategy
        console.warn(`⚠ Unknown splitting strategy: "${this.strategy}". Using "flat" instead.`);
        namespace = this.generateFlat();
    }

    // Sanitize namespace to remove invalid characters
    return this.sanitizeNamespace(namespace);
  }

  /**
   * Sanitizes a namespace by removing or replacing invalid characters
   * Removes: [ ] ( ) { } < > and other special characters
   * @param {string} namespace
   * @returns {string}
   */
  sanitizeNamespace(namespace) {
    return namespace
      .replace(/\[id\]/gi, "id") // [id] -> id
      .replace(/\[slug\]/gi, "slug") // [slug] -> slug
      .replace(/\[[^\]]+\]/g, "param") // [anything] -> param
      .replace(/[[\](){}<>]/g, "") // Remove remaining brackets
      .replace(/[^\w.-]/g, "_") // Replace other invalid chars with underscore
      .replace(/_+/g, "_") // Remove consecutive underscores
      .replace(/\.+/g, ".") // Remove consecutive dots
      .replace(/^[._]+|[._]+$/g, "") // Remove leading/trailing dots and underscores
      .toLowerCase(); // Normalize to lowercase
  }

  /**
   * Flat strategy - all translations in a single file
   * @returns {string}
   */
  generateFlat() {
    return "common";
  }

  /**
   * File strategy - namespace based on file path with full hierarchy
   * Similar to directory but includes deeper nesting for granular control
   * Example: src/pages/products/[id].vue → pages.products.id
   * @param {string} filePath
   * @returns {string}
   */
  generateFromFile(filePath) {
    const relativePath = path.relative(this.baseDir, filePath);
    const parts = relativePath.split(path.sep);

    // Remove 'src' prefix if exists
    if (parts[0] === "src") {
      parts.shift();
    }

    // Get filename without extension
    const fileName = parts.pop();
    const fileNameWithoutExt = fileName.replace(/\.(vue|js|ts|jsx|tsx)$/, "");

    // Check if file is index/default - if so, don't add to namespace
    const isIndex = /^(index|default)$/i.test(fileNameWithoutExt);

    // Build namespace from directory parts
    let namespaceParts = parts.slice(0, this.maxDepth);

    // Add filename to namespace if it's not an index file and adds value
    if (!isIndex && fileNameWithoutExt) {
      namespaceParts.push(fileNameWithoutExt);
    }

    // Limit total depth
    namespaceParts = namespaceParts.slice(0, this.maxDepth);

    const namespace = namespaceParts.join(".");

    return namespace || "common";
  }

  /**
   * Directory strategy - namespace based on directory structure
   * Example: src/pages/auth/Login.vue → pages.auth
   * @param {string} filePath
   * @returns {string}
   */
  generateFromDirectory(filePath) {
    const relativePath = path.relative(this.baseDir, filePath);
    const parts = relativePath.split(path.sep);

    // Remove 'src' prefix if exists
    if (parts[0] === "src") {
      parts.shift();
    }

    // Remove filename
    parts.pop();

    // Limit depth
    const namespace = parts.slice(0, this.maxDepth).join(".");

    return namespace || "common";
  }

  /**
   * Feature strategy - namespace based on feature folders
   * Example: src/features/auth/Login.vue → auth
   * @param {string} filePath
   * @returns {string}
   */
  generateFromFeature(filePath) {
    const relativePath = path.relative(this.baseDir, filePath);
    const parts = relativePath.split(path.sep);

    // Find first feature folder
    for (let i = 0; i < parts.length; i++) {
      if (this.featureFolders.includes(parts[i])) {
        // Return the folder name after the feature folder
        if (i + 1 < parts.length) {
          // Clean the folder name from dynamic route markers
          return parts[i + 1].replace(/\[[^\]]+\]/g, "");
        }
      }
    }

    // If no feature folder found, use directory strategy
    return this.generateFromDirectory(filePath);
  }

  /**
   * Custom strategy - use custom function
   * @param {string} filePath
   * @returns {string}
   */
  generateCustom(filePath) {
    if (typeof this.customFn === "function") {
      const result = this.customFn(filePath, this.baseDir);
      return result || "common";
    }
    return this.generateFlat();
  }

  /**
   * Groups keys by namespace
   * Sorts keys within each group for deterministic output
   * @param {import('../types.js').ExtractedKey[]} keys
   * @returns {Map<string, import('../types.js').ExtractedKey[]>}
   */
  groupByNamespace(keys) {
    const grouped = new Map();

    keys.forEach((key) => {
      const namespace = key.namespace || "common";

      if (!grouped.has(namespace)) {
        grouped.set(namespace, []);
      }

      grouped.get(namespace).push(key);
    });

    // Sort keys within each namespace for deterministic output
    for (const [namespace, namespaceKeys] of grouped) {
      namespaceKeys.sort((a, b) => a.key.localeCompare(b.key));
    }

    return grouped;
  }

  /**
   * Generates file name for a namespace
   * @param {string} namespace
   * @param {string} locale
   * @param {string} format
   * @returns {string}
   */
  getFileName(namespace, locale, format) {
    if (namespace === "common" || this.strategy === "flat") {
      return `${locale}.${format}`;
    }

    return `${locale}.${namespace}.${format}`;
  }

  /**
   * Gets all unique namespaces from keys
   * Returns sorted array for deterministic output
   * @param {import('../types.js').ExtractedKey[]} keys
   * @returns {string[]}
   */
  getNamespaces(keys) {
    const namespaces = new Set(keys.map((key) => key.namespace || "common"));
    return Array.from(namespaces).sort();
  }
}

/**
 * Creates a namespace configuration from user config
 * @param {Object} config - User configuration
 * @returns {NamespaceConfig}
 */
export function createNamespaceConfig(config) {
  if (!config || !config.splitting) {
    return { strategy: "flat" };
  }

  const splitting = config.splitting;

  return {
    strategy: splitting.strategy || "flat",
    baseDir: splitting.baseDir || process.cwd(),
    featureFolders: splitting.featureFolders,
    maxDepth: splitting.maxDepth,
    customFn: splitting.customNamespace,
  };
}
