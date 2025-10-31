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
  generateJS(keys, existingTranslations = {}, header = "module.exports=", isSourceLocale = false) {
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
}
