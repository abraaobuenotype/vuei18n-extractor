import { escapeString } from "../utils/security.js";

/**
 * Generates catalog files in different formats
 */
export class CatalogGenerator {
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

    // Group keys by file for better organization
    Object.keys(keysByFile).forEach((file) => {
      output += `  /*\n   ${file}\n  */\n`;

      keysByFile[file].forEach((key) => {
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

    keys.forEach((key) => {
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
   * @param {import('../types.js').ExtractedKey[]} keys
   * @returns {Object} Keys grouped by file
   */
  groupKeysByFile(keys) {
    const grouped = {};

    keys.forEach((key) => {
      const fileList = key.files.join(" | ");

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
    const ext = format === "json" ? "json" : format;
    const isTypeScript = format === "ts";

    let output = "";

    // Add TypeScript types if needed
    if (isTypeScript) {
      output += "export interface Messages {\n";
      output += "  [key: string]: string;\n";
      output += "}\n\n";
      output += "export interface NamespaceMessages {\n";
      namespaces.forEach((ns) => {
        output += `  '${ns}': Messages;\n`;
      });
      output += "}\n\n";
    }

    // Import all namespaces for this locale
    namespaces.forEach((namespace) => {
      const varName = this.sanitizeVarName(namespace);
      output += `import ${varName} from './${locale}.${namespace}.${ext}';\n`;
    });

    output += "\n";

    // Export messages object
    if (isTypeScript) {
      output += "const messages: NamespaceMessages = {\n";
    } else {
      output += "const messages = {\n";
    }

    namespaces.forEach((namespace, index) => {
      const varName = this.sanitizeVarName(namespace);
      const comma = index < namespaces.length - 1 ? "," : "";
      output += `  '${namespace}': ${varName}${comma}\n`;
    });

    output += "};\n\n";
    output += "export default messages;\n";

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
