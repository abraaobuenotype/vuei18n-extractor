#! /usr/bin/env node
import { glob } from "glob";
import chalk from "chalk";
import { ConfigLoader } from "../src/config/loader.js";
import { Extractor } from "../src/extractor.js";

// Find configuration file
glob("i18nExtractor.{js,json}")
  .then(async (files) => {
    if (files.length < 1) {
      console.log(
        chalk.red(
          'You must have config file "i18nExtractor.json" or "i18nExtractor.js". See the documentation'
        )
      );
      process.exit(0);
      return;
    }

    try {
      // Load configuration
      const loader = new ConfigLoader();
      const config = await loader.load(files[0]);

      console.log(chalk.blue("🚀 Initializing extraction..."));

      // Run extraction
      const extractor = new Extractor(config);
      await extractor.extract();

      console.log(chalk.green("✓ Extract complete"));
      console.log(
        chalk.blue(
          `Generated ${config.locales.length} locale file(s) in ${config.catalogs.outputFolder}`
        )
      );
      process.exit(0);
    } catch (err) {
      console.error(chalk.red("Error:"), err.message);
      if (process.env.DEBUG) {
        console.error(err.stack);
      }
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error(chalk.red("Error finding config file:"), err.message);
    process.exit(1);
  });
