/**
 * @typedef {Object} ExtractConfig
 * @property {string} [header] - Header to prepend to output files (default: "module.exports=")
 * @property {string} sourceLocale - The source/default locale (e.g., "pt")
 * @property {string[]} locales - Array of all supported locales
 * @property {string} format - Output file format ("js", "json", "ts")
 * @property {CatalogConfig} catalogs - Catalog configuration
 */

/**
 * @typedef {Object} CatalogConfig
 * @property {string} outputFolder - Directory where locale files will be generated
 * @property {string[]} include - Glob patterns for files to scan
 * @property {string[]} exclude - Glob patterns for files to exclude from scanning
 */

/**
 * @typedef {Object} LocalePath
 * @property {string} path - File path for the locale file
 * @property {Record<string, TranslationValue>} source - Existing translations from the file
 */

/**
 * @typedef {Object} TranslationValue
 * @property {string} message - The translation message
 * @property {Object} [context] - Additional context for the translation
 * @property {string[]} [variables] - Variables used in interpolation
 * @property {Object} [plurals] - Plural forms
 */

/**
 * @typedef {Object} ExtractedKey
 * @property {string} key - The translation key
 * @property {string} message - The default message
 * @property {string[]} files - Files where this key appears
 * @property {string[]} [variables] - Variables found in the message
 * @property {boolean} [hasPlural] - Whether this key uses pluralization
 * @property {number} [line] - Line number where found
 */

export {};
