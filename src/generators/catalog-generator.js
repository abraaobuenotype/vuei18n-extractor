import path from "path";
import { escapeString } from "../utils/security.js";

/**
 * Generates catalog files in different formats
 */
export class CatalogGenerator {
  /**
   * Converts an absolute file path to a relative path from the current working directory
   * @param {string} absolutePath - Absolute file path
   * @returns {string} Relative file path
   */
  toRelativePath(absolutePath) {
    // Get the current working directory (where the extraction is running from)
    const cwd = process.cwd();
    
    // Convert absolute path to relative
    let relativePath = path.relative(cwd, absolutePath);
    
    // Ensure forward slashes for cross-platform consistency
    relativePath = relativePath.split(path.sep).join('/');
    
    return relativePath;
  }

  /**
   * Generates a JavaScript/TypeScript catalog file
   * @param {import('../types.js').ExtractedKey[]} keys - Extracted keys
   * @param {Object} existingTranslations - Existing translations to preserve
   * @param {string} header - Header for the file
   * @param {boolean} isSourceLocale - Whether this is the source locale
   * @returns {string} Generated file content
   */
  generateJS(
    keys,
    existingTranslations = {},
    header = "module.exports=",
    isSourceLocale = false
  ) {
    const keysByFile = this.groupKeysByFile(keys);

    let output = `${header}{\n`;

    // Sort file groups for deterministic output
    const sortedFileGroups = Object.keys(keysByFile).sort();

    // Group keys by file for better organization
    sortedFileGroups.forEach((file) => {
      output += `  /*\n   ${file}\n  */\n`;

      // Sort keys within each file group for deterministic output
      const sortedKeys = keysByFile[file].sort((a, b) => a.key.localeCompare(b.key));

      sortedKeys.forEach((key) => {
        const safeKey = escapeString(key.key);
        let value;

        if (isSourceLocale) {
          // For source locale, use the key as value
          value = escapeString(key.message);
        } else {
          // For other locales, preserve existing translation or leave empty
          value = existingTranslations[key.key]
            ? escapeString(existingTranslations[key.key])
            : "";
        }

        // Add metadata as comment if key has special features
        if (key.variables && key.variables.length > 0) {
          output += `  // Variables: ${key.variables.join(", ")}\n`;
        }
        if (key.hasPlural) {
          output += `  // Uses pluralization\n`;
        }
        if (key.hasDate) {
          output += `  // Uses date formatting\n`;
        }

        output += `  "${safeKey}": "${value}",\n`;
      });

      output += "\n";
    });

    // Remove trailing comma and newline, close object
    output = output.replace(/,\n\n$/g, "\n");
    output += "};\n";

    return output;
  }

  /**
   * Generates a JSON catalog file
   * @param {import('../types.js').ExtractedKey[]} keys - Extracted keys
   * @param {Object} existingTranslations - Existing translations to preserve
   * @param {boolean} isSourceLocale - Whether this is the source locale
   * @returns {string} Generated file content
   */
  generateJSON(keys, existingTranslations = {}, isSourceLocale = false) {
    const translations = {};

    // Sort keys for deterministic output
    const sortedKeys = [...keys].sort((a, b) => a.key.localeCompare(b.key));

    sortedKeys.forEach((key) => {
      if (isSourceLocale) {
        translations[key.key] = key.message;
      } else {
        translations[key.key] = existingTranslations[key.key] || "";
      }
    });

    return JSON.stringify(translations, null, 2);
  }

  /**
   * Groups keys by the files they appear in
   * Uses RELATIVE paths for cross-developer consistency
   * Sorts file lists for deterministic output
   * @param {import('../types.js').ExtractedKey[]} keys
   * @returns {Object} Keys grouped by file (with relative paths)
   */
  groupKeysByFile(keys) {
    const grouped = {};

    keys.forEach((key) => {
      // Convert absolute paths to relative paths and sort for deterministic grouping
      const relativePaths = key.files.map(f => this.toRelativePath(f));
      const sortedFiles = relativePaths.sort();
      const fileList = sortedFiles.join(" | ");

      if (!grouped[fileList]) {
        grouped[fileList] = [];
      }

      grouped[fileList].push(key);
    });

    return grouped;
  }

  /**
   * Generates an index file that exports all locale namespaces
   * This creates one file per locale that imports all its namespaces
   * Example: pt-BR.js imports pt-BR.auth.js, pt-BR.dashboard.js, etc.
   * @param {string} locale - The locale to generate index for
   * @param {string[]} namespaces - List of namespaces
   * @param {string} format - File format ('js', 'ts', 'json')
   * @returns {string} Generated index file content
   */
  generateLocaleIndex(locale, namespaces, format) {
    const isJSON = format === "json";

    let output = "";

    // Sort namespaces for deterministic output
    const sortedNamespaces = [...namespaces].sort();

    // Import all namespaces for this locale
    sortedNamespaces.forEach((namespace) => {
      const varName = this.sanitizeVarName(namespace);
      // For TypeScript/JavaScript, omit extension (ES modules convention)
      // For JSON, include extension
      const importPath = isJSON
        ? `./${locale}.${namespace}.json`
        : `./${locale}.${namespace}`;
      output += `import ${varName} from '${importPath}';\n`;
    });

    output += "\n";

    // Export merged translations directly (required by unplugin-vue-i18n)
    output += "// Merge all namespace translations into a single object\n";
    output += "export default {\n";

    sortedNamespaces.forEach((namespace, index) => {
      const varName = this.sanitizeVarName(namespace);
      const comma = index < sortedNamespaces.length - 1 ? "," : "";
      output += `  ...${varName}${comma}\n`;
    });

    output += "};\n";

    return output;
  }

  /**
   * Sanitizes a string to be a valid JavaScript variable name
   * @param {string} str
   * @returns {string}
   */
  sanitizeVarName(str) {
    // Replace hyphens and dots with underscores
    return str.replace(/[-\.]/g, "_");
  }
}
