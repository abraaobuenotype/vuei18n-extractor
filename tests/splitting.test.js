import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { Extractor } from "../src/extractor.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Splitting Integration Tests", () => {
  const outputDir = path.join(__dirname, "fixtures", "output-split");

  const config = {
    header: "export default",
    sourceLocale: "en",
    locales: ["en", "pt"],
    format: "js",
    catalogs: {
      outputFolder: outputDir,
      include: [
        path.join(__dirname, "fixtures/src/features/**/*.vue"),
        path.join(__dirname, "fixtures/src/components/**/*.vue"),
      ],
      exclude: [],
    },
    splitting: {
      strategy: "feature",
      featureFolders: ["features", "components"],
    },
  };

  beforeEach(async () => {
    // Clean output directory before each test
    await fs.remove(outputDir);
  });

  afterEach(async () => {
    // Clean up after tests
    await fs.remove(outputDir);
  });

  it("should generate multiple files with feature strategy", async () => {
    const extractor = new Extractor(config);
    await extractor.extract();

    // Check that files were created with namespace
    const files = await fs.readdir(outputDir);

    // Should have files for each namespace
    expect(files).toContain("en.auth.js");
    expect(files).toContain("en.dashboard.js");
    expect(files).toContain("en.ui.js"); // from components/ui
    expect(files).toContain("pt.auth.js");
    expect(files).toContain("pt.dashboard.js");
    expect(files).toContain("pt.ui.js");
  });

  it("should separate keys by namespace correctly", async () => {
    const extractor = new Extractor(config);
    await extractor.extract();

    // Read auth translations
    const authContent = await fs.readFile(
      path.join(outputDir, "en.auth.js"),
      "utf-8"
    );

    expect(authContent).toContain("Sign in to your account");
    expect(authContent).toContain("Enter your credentials to continue");
    expect(authContent).not.toContain("Dashboard"); // Should not contain dashboard keys

    // Read dashboard translations
    const dashboardContent = await fs.readFile(
      path.join(outputDir, "en.dashboard.js"),
      "utf-8"
    );

    expect(dashboardContent).toContain("Dashboard");
    expect(dashboardContent).toContain("Welcome to your dashboard");
    expect(dashboardContent).not.toContain("Sign in"); // Should not contain auth keys

    // Read components translations
    const componentsContent = await fs.readFile(
      path.join(outputDir, "en.ui.js"),
      "utf-8"
    );

    expect(componentsContent).toContain("Save");
    expect(componentsContent).toContain("Cancel");
    expect(componentsContent).not.toContain("Dashboard"); // Should not contain dashboard keys
  });

  it("should preserve metadata in split files", async () => {
    const extractor = new Extractor(config);
    await extractor.extract();

    // Read auth translations
    const authContent = await fs.readFile(
      path.join(outputDir, "en.auth.js"),
      "utf-8"
    );

    // Should have variable metadata
    expect(authContent).toContain("// Variables: name");
    expect(authContent).toContain("Welcome back, {name}!");

    // Should have pluralization metadata
    expect(authContent).toContain("// Uses pluralization");
    expect(authContent).toContain("attempts, plural");

    // Read dashboard translations
    const dashboardContent = await fs.readFile(
      path.join(outputDir, "en.dashboard.js"),
      "utf-8"
    );

    // Should have date metadata
    expect(dashboardContent).toContain("// Uses date formatting");
    expect(dashboardContent).toContain("date, date, short");
  });

  it("should generate empty translations for non-source locales", async () => {
    const extractor = new Extractor(config);
    await extractor.extract();

    // Read Portuguese auth translations (non-source locale)
    const ptAuthContent = await fs.readFile(
      path.join(outputDir, "pt.auth.js"),
      "utf-8"
    );

    // Should have keys with empty values
    expect(ptAuthContent).toContain('"Sign in to your account": ""');
    expect(ptAuthContent).toContain('"Enter your credentials to continue": ""');
  });

  it("should include file path comments in split files", async () => {
    const extractor = new Extractor(config);
    await extractor.extract();

    const authContent = await fs.readFile(
      path.join(outputDir, "en.auth.js"),
      "utf-8"
    );

    // Should have file path comment
    expect(authContent).toContain("tests/fixtures/src/features/auth/Login.vue");
  });

  it("should generate locale index files aggregating namespaces", async () => {
    const extractor = new Extractor(config);
    await extractor.extract();

    // Check that locale index files were created (en.js and pt.js)
    const enIndexPath = path.join(outputDir, "en.js");
    const ptIndexPath = path.join(outputDir, "pt.js");

    expect(await fs.pathExists(enIndexPath)).toBe(true);
    expect(await fs.pathExists(ptIndexPath)).toBe(true);

    // Read en index content
    const enIndexContent = await fs.readFile(enIndexPath, "utf-8");

    // Should import all namespaces for en
    expect(enIndexContent).toContain("import auth from './en.auth';");
    expect(enIndexContent).toContain("import dashboard from './en.dashboard';");
    expect(enIndexContent).toContain("import ui from './en.ui';");

    // Should merge all namespaces into a flat object using spread
    expect(enIndexContent).toContain("const messages = {");
    expect(enIndexContent).toContain("...auth");
    expect(enIndexContent).toContain("...dashboard");
    expect(enIndexContent).toContain("...ui");

    // Should have default export
    expect(enIndexContent).toContain("export default messages;");

    // Read pt index content
    const ptIndexContent = await fs.readFile(ptIndexPath, "utf-8");

    // Should import all namespaces for pt
    expect(ptIndexContent).toContain("import auth from './pt.auth';");
    expect(ptIndexContent).toContain("import dashboard from './pt.dashboard';");
    expect(ptIndexContent).toContain("import ui from './pt.ui';");
  });
});
