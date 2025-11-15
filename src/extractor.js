import { glob } from "glob";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { KeyExtractor } from "./parsers/key-extractor.js";
import { CatalogGenerator } from "./generators/catalog-generator.js";
import { validatePath } from "./utils/security.js";
import {
  NamespaceGenerator,
  createNamespaceConfig,
} from "./utils/namespace.js";

/**
 * Main extraction orchestrator
 */
export class Extractor {
  /**
   * @param {import('./types.js').ExtractConfig} config
   */
  constructor(config) {
    this.config = config;
    this.keyExtractor = new KeyExtractor();
    this.catalogGenerator = new CatalogGenerator();
    this.namespaceGenerator = new NamespaceGenerator(
      createNamespaceConfig(config)
    );
  }

  /**
   * Main extraction process
   */
  async extract() {
    // Migrate old files with invalid names before extraction
    await this.migrateInvalidFileNames();

    // Scan files
    const files = await glob(this.config.catalogs.include, {
      ignore: this.config.catalogs.exclude,
    });

    console.log(chalk.blue(`📂 Scanning ${files.length} file(s)...`));

    // Extract keys from all files
    let allKeys = [];
    for (const file of files) {
      try {
        const safePath = validatePath(file);
        const keys = this.keyExtractor.extractFromFile(safePath);

        // Apply namespace to each key
        keys.forEach((key) => {
          key.namespace = this.namespaceGenerator.generate(safePath);
        });

        allKeys = this.keyExtractor.mergeKeys(allKeys, keys);
      } catch (err) {
        console.warn(chalk.yellow(`⚠ Skipping ${file}: ${err.message}`));
      }
    }

    console.log(chalk.blue(`🔑 Found ${allKeys.length} unique key(s)`));

    // Count special features
    const withVars = allKeys.filter(
      (k) => k.variables && k.variables.length > 0
    ).length;
    const withPlural = allKeys.filter((k) => k.hasPlural).length;
    const withDate = allKeys.filter((k) => k.hasDate).length;

    if (withVars > 0) {
      console.log(chalk.cyan(`   → ${withVars} with variables`));
    }
    if (withPlural > 0) {
      console.log(chalk.cyan(`   → ${withPlural} with pluralization`));
    }
    if (withDate > 0) {
      console.log(chalk.cyan(`   → ${withDate} with date formatting`));
    }

    // Get namespaces
    const namespaces = this.namespaceGenerator.getNamespaces(allKeys);
    const groupedKeys = this.namespaceGenerator.groupByNamespace(allKeys);

    if (namespaces.length > 1) {
      console.log(
        chalk.cyan(
          `   → ${namespaces.length} namespace(s): ${namespaces.join(", ")}`
        )
      );
    }

    // Generate catalogs for each locale and namespace
    for (const locale of this.config.locales) {
      for (const namespace of namespaces) {
        const keys = groupedKeys.get(namespace) || [];
        const fileName = this.namespaceGenerator.getFileName(
          namespace,
          locale,
          this.config.format
        );
        const outputPath = validatePath(
          path.join(this.config.catalogs.outputFolder, fileName)
        );

        // Load existing translations
        let existingTranslations = {};
        if (fs.pathExistsSync(outputPath)) {
          try {
            if (this.config.format === "json") {
              existingTranslations = await fs.readJSON(outputPath);
            } else {
              // For JS/TS files, we'll need to import them
              const imported = await import(outputPath);
              existingTranslations = imported.default || {};
            }
          } catch {
            console.warn(
              chalk.yellow(
                `⚠ Could not load existing translations for ${locale}/${namespace}`
              )
            );
          }
        }

        // Generate catalog
        const isSourceLocale = locale === this.config.sourceLocale;
        let content;

        if (this.config.format === "json") {
          content = this.catalogGenerator.generateJSON(
            keys,
            existingTranslations,
            isSourceLocale
          );
        } else {
          const header = this.config.header || "module.exports=";
          content = this.catalogGenerator.generateJS(
            keys,
            existingTranslations,
            header,
            isSourceLocale
          );
        }

        // Ensure directory exists
        await fs.ensureDir(path.dirname(outputPath));

        // Write file
        await fs.writeFile(outputPath, content, "utf-8");

        console.log(chalk.green(`✓ Generated ${fileName}`));
      }
    }

    // Generate index files - one per locale when using splitting
    if (namespaces.length > 1) {
      await this.generateLocaleIndexFiles(namespaces);
    }
  }

  /**
   * Generates index files for each locale (when using splitting)
   * @param {string[]} namespaces - List of namespaces
   */
  async generateLocaleIndexFiles(namespaces) {
    for (const locale of this.config.locales) {
      const indexFileName = `${locale}.${this.config.format}`;
      const indexPath = validatePath(
        path.join(this.config.catalogs.outputFolder, indexFileName)
      );

      const content = this.catalogGenerator.generateLocaleIndex(
        locale,
        namespaces,
        this.config.format
      );

      await fs.writeFile(indexPath, content, "utf-8");

      console.log(
        chalk.green(
          `✓ Generated ${indexFileName} (aggregates all ${locale} namespaces)`
        )
      );
    }
  }

  /**
   * Migrates files with invalid names (containing [, ], etc.) to sanitized names
   * Preserves existing translations during the migration
   */
  async migrateInvalidFileNames() {
    const outputFolder = this.config.catalogs.outputFolder;

    // Check if output folder exists
    if (!fs.pathExistsSync(outputFolder)) {
      return; // Nothing to migrate
    }

    // Pattern to find files with invalid characters
    const invalidCharsPattern = /[\[\](){}<>]/;

    // Get all translation files in the output folder
    const allFiles = await fs.readdir(outputFolder);

    let migratedCount = 0;
    const migrations = [];

    for (const fileName of allFiles) {
      // Skip if doesn't match our format pattern or doesn't have invalid chars
      if (!invalidCharsPattern.test(fileName)) {
        continue;
      }

      // Check if it's a translation file (not index files)
      const ext = path.extname(fileName);
      if (![".js", ".ts", ".json"].includes(ext)) {
        continue;
      }

      const oldPath = path.join(outputFolder, fileName);

      // Extract locale and namespace parts
      // Example: pt-BR.pages.employees.[id].js
      const parts = fileName.split(".");
      const locale = parts[0];
      const namespaceWithExt = parts.slice(1).join(".");
      const namespace = namespaceWithExt.replace(new RegExp(`\\${ext}$`), "");

      // Sanitize the namespace
      const sanitizedNamespace =
        this.namespaceGenerator.sanitizeNamespace(namespace);

      // Build new filename
      const newFileName = `${locale}.${sanitizedNamespace}${ext}`;
      const newPath = path.join(outputFolder, newFileName);

      // Skip if old and new are the same (shouldn't happen, but just in case)
      if (oldPath === newPath) {
        continue;
      }

      migrations.push({ oldPath, newPath, oldFileName: fileName, newFileName });
    }

    // Execute migrations
    for (const { oldPath, newPath, oldFileName, newFileName } of migrations) {
      try {
        // Check if target file already exists
        if (fs.pathExistsSync(newPath)) {
          // Merge translations if both exist
          const oldContent = await this.readTranslationFile(oldPath);
          const newContent = await this.readTranslationFile(newPath);

          // Merge: new content takes precedence for conflicts
          const merged = { ...oldContent, ...newContent };

          // Write merged content
          await this.writeTranslationFile(newPath, merged);

          // Remove old file
          await fs.remove(oldPath);

          console.log(
            chalk.yellow(
              `🔀 Merged ${oldFileName} → ${newFileName} (duplicate resolved)`
            )
          );
        } else {
          // Simple rename if target doesn't exist
          await fs.rename(oldPath, newPath);

          console.log(
            chalk.cyan(`📦 Migrated ${oldFileName} → ${newFileName}`)
          );
        }

        migratedCount++;
      } catch (error) {
        console.warn(
          chalk.yellow(`⚠ Could not migrate ${oldFileName}: ${error.message}`)
        );
      }
    }

    if (migratedCount > 0) {
      console.log(
        chalk.green(`✓ Migrated ${migratedCount} file(s) to sanitized names\n`)
      );
    }
  }

  /**
   * Reads a translation file and returns its content as an object
   * @param {string} filePath
   * @returns {Promise<Object>}
   */
  async readTranslationFile(filePath) {
    try {
      const ext = path.extname(filePath);

      if (ext === ".json") {
        return await fs.readJSON(filePath);
      } else {
        // For JS/TS files, read as text and parse
        const content = await fs.readFile(filePath, "utf-8");

        // Try to extract the object
        // Handle both: export default {...} and module.exports = {...}
        const match =
          content.match(/export default\s+({[\s\S]*?});?\s*$/m) ||
          content.match(/module\.exports\s*=\s*({[\s\S]*?});?\s*$/m);

        if (match && match[1]) {
          // Use eval to parse the object (safe in this context)
          return eval(`(${match[1]})`);
        }

        return {};
      }
    } catch {
      return {};
    }
  }

  /**
   * Writes an object to a translation file
   * @param {string} filePath
   * @param {Object} content
   */
  async writeTranslationFile(filePath, content) {
    const ext = path.extname(filePath);

    if (ext === ".json") {
      await fs.writeJSON(filePath, content, { spaces: 2 });
    } else {
      // For JS/TS files
      const header = this.config.header || "export default";
      const jsonString = JSON.stringify(content, null, 2);
      const fileContent = `${header} ${jsonString};\n`;

      await fs.writeFile(filePath, fileContent, "utf-8");
    }
  }
}
