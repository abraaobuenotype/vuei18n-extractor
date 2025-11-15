import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import { Extractor } from "../src/extractor.js";

describe("File Migration Tests", () => {
  const testDir = path.join(process.cwd(), "tests", "temp-migration");
  const outputFolder = path.join(testDir, "locales");

  beforeEach(async () => {
    await fs.ensureDir(outputFolder);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it("should migrate files with [id] in names", async () => {
    // Create file with invalid name
    const oldFile = path.join(outputFolder, "en.pages.employees.[id].js");
    await fs.writeFile(
      oldFile,
      'export default {\n  "title": "Employee Details"\n};\n',
      "utf-8"
    );

    const config = {
      catalogs: {
        include: ["tests/fixtures/src/**/*.{js,vue}"],
        exclude: ["**/node_modules/**"],
        outputFolder,
      },
      locales: ["en"],
      sourceLocale: "en",
      format: "js",
      splitting: {
        enabled: true,
        strategy: "directory",
      },
    };

    const extractor = new Extractor(config);
    await extractor.migrateInvalidFileNames();

    // Check if old file was renamed
    expect(fs.pathExistsSync(oldFile)).toBe(false);

    // Check if new file exists
    const newFile = path.join(outputFolder, "en.pages.employees.id.js");
    expect(fs.pathExistsSync(newFile)).toBe(true);

    // Check if content was preserved
    const content = await fs.readFile(newFile, "utf-8");
    expect(content).toContain('"title": "Employee Details"');
  });

  it("should migrate files with [slug] in names", async () => {
    const oldFile = path.join(outputFolder, "pt-BR.pages.products.[slug].js");
    await fs.writeFile(
      oldFile,
      'export default {\n  "name": "Nome do Produto"\n};\n',
      "utf-8"
    );

    const config = {
      catalogs: {
        outputFolder,
      },
      locales: ["pt-BR"],
      sourceLocale: "pt-BR",
      format: "js",
      splitting: {
        enabled: true,
        strategy: "directory",
      },
    };

    const extractor = new Extractor(config);
    await extractor.migrateInvalidFileNames();

    const newFile = path.join(outputFolder, "pt-BR.pages.products.slug.js");
    expect(fs.pathExistsSync(newFile)).toBe(true);

    const content = await fs.readFile(newFile, "utf-8");
    expect(content).toContain('"name": "Nome do Produto"');
  });

  it("should merge files if target already exists", async () => {
    // Create old file with invalid name
    const oldFile = path.join(outputFolder, "en.pages.items.[id].js");
    await fs.writeFile(
      oldFile,
      'export default {\n  "oldKey": "Old Value",\n  "shared": "From Old"\n};\n',
      "utf-8"
    );

    // Create new file that already exists (sanitized name)
    const newFile = path.join(outputFolder, "en.pages.items.id.js");
    await fs.writeFile(
      newFile,
      'export default {\n  "newKey": "New Value",\n  "shared": "From New"\n};\n',
      "utf-8"
    );

    const config = {
      catalogs: {
        outputFolder,
      },
      locales: ["en"],
      sourceLocale: "en",
      format: "js",
      splitting: {
        enabled: true,
        strategy: "directory",
      },
    };

    const extractor = new Extractor(config);
    await extractor.migrateInvalidFileNames();

    // Old file should be removed
    expect(fs.pathExistsSync(oldFile)).toBe(false);

    // New file should exist with merged content
    expect(fs.pathExistsSync(newFile)).toBe(true);

    const content = await fs.readFile(newFile, "utf-8");

    // Should have both keys
    expect(content).toContain('"oldKey": "Old Value"');
    expect(content).toContain('"newKey": "New Value"');

    // New content should take precedence for conflicts
    expect(content).toContain('"shared": "From New"');
  });

  it("should handle JSON files", async () => {
    const oldFile = path.join(outputFolder, "en.pages.users.[id].json");
    await fs.writeJSON(oldFile, {
      title: "User Profile",
      description: "View user details",
    });

    const config = {
      catalogs: {
        outputFolder,
      },
      locales: ["en"],
      sourceLocale: "en",
      format: "json",
      splitting: {
        enabled: true,
        strategy: "directory",
      },
    };

    const extractor = new Extractor(config);
    await extractor.migrateInvalidFileNames();

    expect(fs.pathExistsSync(oldFile)).toBe(false);

    const newFile = path.join(outputFolder, "en.pages.users.id.json");
    expect(fs.pathExistsSync(newFile)).toBe(true);

    const content = await fs.readJSON(newFile);
    expect(content.title).toBe("User Profile");
    expect(content.description).toBe("View user details");
  });

  it("should handle multiple bracket patterns", async () => {
    const oldFile = path.join(
      outputFolder,
      "en.pages.(group).items.[customId].js"
    );
    await fs.writeFile(
      oldFile,
      'export default {\n  "label": "Item"\n};\n',
      "utf-8"
    );

    const config = {
      catalogs: {
        outputFolder,
      },
      locales: ["en"],
      sourceLocale: "en",
      format: "js",
      splitting: {
        enabled: true,
        strategy: "directory",
      },
    };

    const extractor = new Extractor(config);
    await extractor.migrateInvalidFileNames();

    expect(fs.pathExistsSync(oldFile)).toBe(false);

    // (group) removed, [customId] -> param
    const newFile = path.join(outputFolder, "en.pages.group.items.param.js");
    expect(fs.pathExistsSync(newFile)).toBe(true);
  });

  it("should not migrate files without invalid characters", async () => {
    const validFile = path.join(outputFolder, "en.pages.dashboard.js");
    await fs.writeFile(
      validFile,
      'export default {\n  "title": "Dashboard"\n};\n',
      "utf-8"
    );

    const config = {
      catalogs: {
        outputFolder,
      },
      locales: ["en"],
      sourceLocale: "en",
      format: "js",
    };

    const extractor = new Extractor(config);
    await extractor.migrateInvalidFileNames();

    // File should still exist with same name
    expect(fs.pathExistsSync(validFile)).toBe(true);
  });

  it("should handle TypeScript files", async () => {
    const oldFile = path.join(outputFolder, "en.components.[slug].ts");
    await fs.writeFile(
      oldFile,
      'export default {\n  "component": "Dynamic Component"\n};\n',
      "utf-8"
    );

    const config = {
      catalogs: {
        outputFolder,
      },
      locales: ["en"],
      sourceLocale: "en",
      format: "ts",
      splitting: {
        enabled: true,
        strategy: "directory",
      },
    };

    const extractor = new Extractor(config);
    await extractor.migrateInvalidFileNames();

    expect(fs.pathExistsSync(oldFile)).toBe(false);

    const newFile = path.join(outputFolder, "en.components.slug.ts");
    expect(fs.pathExistsSync(newFile)).toBe(true);
  });
});
