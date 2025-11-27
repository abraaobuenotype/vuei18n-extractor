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
    console.log(chalk.blue("🚀 Initializing extraction..."));
    console.log(
      chalk.gray(`   Strategy: ${this.config.splitting?.strategy || "flat"}`)
    );
    console.log(chalk.gray(`   Source locale: ${this.config.sourceLocale}`));
    console.log(
      chalk.gray(
        `   Target locales: ${this.config.locales.filter((l) => l !== this.config.sourceLocale).join(", ")}`
      )
    );
    console.log();

    // Migrate old files with invalid names before extraction
    await this.migrateInvalidFileNames();

    // Scan files and SORT for deterministic processing
    const files = await glob(this.config.catalogs.include, {
      ignore: this.config.catalogs.exclude,
    });

    // Sort files for deterministic processing order
    files.sort();

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

    console.log(chalk.cyan(`   → ${namespaces.length} namespace(s)`));
    console.log();

    // Track statistics
    const stats = {
      generated: 0,
      skipped: 0,
      preserved: 0,
      newKeys: 0,
      totalKeys: 0,
    };

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
        let existingCount = 0;

        if (fs.pathExistsSync(outputPath)) {
          try {
            existingTranslations = await this.loadTranslationFile(outputPath);
            existingCount = Object.keys(existingTranslations).length;
            stats.preserved += existingCount;
          } catch (err) {
            console.warn(
              chalk.yellow(
                `⚠ Could not load existing translations for ${locale}/${namespace}: ${err.message}`
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

        // Check if content actually changed before writing
        const shouldWrite = await this.shouldWriteFile(outputPath, content);

        if (!shouldWrite) {
          stats.skipped++;
          continue; // Skip writing unchanged file
        }

        // Ensure directory exists
        await fs.ensureDir(path.dirname(outputPath));

        // Write file
        await fs.writeFile(outputPath, content, "utf-8");

        // Count new keys (keys not in existing translations)
        const newKeysCount = keys.filter(
          (k) => !existingTranslations[k.key]
        ).length;
        stats.newKeys += newKeysCount;
        stats.totalKeys += keys.length;
        stats.generated++;

        // Show detailed log for non-source locales with new keys
        if (!isSourceLocale && newKeysCount > 0) {
          console.log(
            chalk.green(`✓ Generated ${fileName}`) +
              chalk.gray(` (${existingCount} preserved, ${newKeysCount} new)`)
          );
        } else {
          console.log(chalk.green(`✓ Generated ${fileName}`));
        }
      }
    }

    // Generate index files - one per locale when using splitting
    if (namespaces.length > 1) {
      await this.generateLocaleIndexFiles(namespaces, stats);
    }

    // Print summary
    console.log();
    console.log(chalk.green("✅ Extract complete!"));
    console.log(chalk.gray(`   ${stats.generated} files generated`));
    if (stats.skipped > 0) {
      console.log(chalk.gray(`   ${stats.skipped} files unchanged (skipped)`));
    }
    if (stats.preserved > 0) {
      console.log(
        chalk.gray(`   ${stats.preserved} existing translations preserved`)
      );
    }
    if (stats.newKeys > 0) {
      console.log(
        chalk.yellow(`   ${stats.newKeys} new keys need translation`)
      );
    }
  }

  /**
   * Check if file content actually changed
   * @param {string} filePath - Path to file
   * @param {string} newContent - New content to write
   * @returns {Promise<boolean>} True if file should be written
   */
  async shouldWriteFile(filePath, newContent) {
    if (!fs.pathExistsSync(filePath)) {
      return true; // New file, always write
    }

    try {
      const existingContent = await fs.readFile(filePath, "utf-8");
      return existingContent !== newContent;
    } catch {
      return true; // Error reading, write anyway
    }
  }

  /**
   * Loads a translation file and returns its content as an object
   * Supports JSON, JS, and TS files with various export formats
   * @param {string} filePath
   * @returns {Promise<Object>}
   */
  async loadTranslationFile(filePath) {
    const ext = path.extname(filePath);

    if (ext === ".json") {
      return await fs.readJSON(filePath);
    }

    // For JS/TS files, try multiple approaches
    try {
      // First try: dynamic import (works for ES modules)
      const fileUrl = `file://${path.resolve(filePath)}?t=${Date.now()}`;
      const imported = await import(fileUrl);
      return imported.default || imported;
    } catch {
      // Second try: read and parse manually
      try {
        const content = await fs.readFile(filePath, "utf-8");
        return this.parseTranslationContent(content);
      } catch {
        return {};
      }
    }
  }

  /**
   * Parses translation file content and extracts the object
   * @param {string} content - File content
   * @returns {Object}
   */
  parseTranslationContent(content) {
    // Try to extract the object from various export formats
    const patterns = [
      /export\s+default\s+({[\s\S]*?});?\s*$/m,
      /module\.exports\s*=\s*({[\s\S]*?});?\s*$/m,
      /^({[\s\S]*?});?\s*$/m,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        try {
          // Use Function constructor to safely parse (safer than eval)
          const fn = new Function(`return ${match[1]}`);
          return fn();
        } catch {
          continue;
        }
      }
    }

    return {};
  }

  /**
   * Generates index files for each locale (when using splitting)
   * @param {string[]} namespaces - List of namespaces
   * @param {Object} stats - Statistics object to update
   */
  async generateLocaleIndexFiles(namespaces, stats) {
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

      // Check if content changed
      const shouldWrite = await this.shouldWriteFile(indexPath, content);

      if (!shouldWrite) {
        stats.skipped++;
        continue;
      }

      await fs.writeFile(indexPath, content, "utf-8");
      stats.generated++;

      console.log(
        chalk.green(`✓ Generated ${indexFileName}`) +
          chalk.gray(` (aggregates ${namespaces.length} namespaces)`)
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
          const oldContent = await this.loadTranslationFile(oldPath);
          const newContent = await this.loadTranslationFile(newPath);

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
   * @deprecated Use loadTranslationFile instead
   */
  async readTranslationFile(filePath) {
    return this.loadTranslationFile(filePath);
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
