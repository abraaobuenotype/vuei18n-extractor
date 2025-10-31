import { glob } from "glob";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { KeyExtractor } from "./parsers/key-extractor.js";
import { CatalogGenerator } from "./generators/catalog-generator.js";
import { validatePath } from "./utils/security.js";

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
  }

  /**
   * Main extraction process
   */
  async extract() {
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
        allKeys = this.keyExtractor.mergeKeys(allKeys, keys);
      } catch (err) {
        console.warn(chalk.yellow(`⚠ Skipping ${file}: ${err.message}`));
      }
    }

    console.log(chalk.blue(`🔑 Found ${allKeys.length} unique key(s)`));

    // Count special features
    const withVars = allKeys.filter((k) => k.variables && k.variables.length > 0).length;
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

    // Generate catalogs for each locale
    for (const locale of this.config.locales) {
      const outputPath = validatePath(
        path.join(
          this.config.catalogs.outputFolder,
          `${locale}.${this.config.format}`
        )
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
            chalk.yellow(`⚠ Could not load existing translations for ${locale}`)
          );
        }
      }

      // Generate catalog
      const isSourceLocale = locale === this.config.sourceLocale;
      let content;

      if (this.config.format === "json") {
        content = this.catalogGenerator.generateJSON(
          allKeys,
          existingTranslations,
          isSourceLocale
        );
      } else {
        const header = this.config.header || "module.exports=";
        content = this.catalogGenerator.generateJS(
          allKeys,
          existingTranslations,
          header,
          isSourceLocale
        );
      }

      // Ensure directory exists
      await fs.ensureDir(path.dirname(outputPath));

      // Write file
      await fs.writeFile(outputPath, content, "utf-8");

      console.log(chalk.green(`✓ Generated ${locale}.${this.config.format}`));
    }
  }
}
