import { describe, it, expect } from "vitest";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Config Loading", () => {
  it("should find .js config files", async () => {
    const configPath = path.join(__dirname, "fixtures", "i18nExtractor.js");
    const exists = await fs.pathExists(configPath);
    expect(exists).toBe(true);
  });

  it("should find .json config files", async () => {
    const configPath = path.join(__dirname, "fixtures", "i18nExtractor.json");
    const exists = await fs.pathExists(configPath);
    expect(exists).toBe(true);
  });

  it("should read JSON config correctly", async () => {
    const configPath = path.join(__dirname, "fixtures", "i18nExtractor.json");
    const config = await fs.readJSON(configPath);

    expect(config).toBeDefined();
    expect(config.sourceLocale).toBe("en");
    expect(config.locales).toContain("en");
    expect(config.locales).toContain("fr");
  });
});

describe("Key Extraction", () => {
  it("should match t() calls with double quotes", () => {
    const code = 'const msg = t("Hello");';
    const regex = /\bt\(\s*(\'|\")[^\. \/ @]?\b.+(\'|\")\s*\)/gm;
    const matches = code.match(regex);

    expect(matches).toBeDefined();
    expect(matches.length).toBe(1);
  });

  it("should match t() calls with single quotes", () => {
    const code = "const msg = t('Hello');";
    const regex = /\bt\(\s*(\'|\")[^\. \/ @]?\b.+(\'|\")\s*\)/gm;
    const matches = code.match(regex);

    expect(matches).toBeDefined();
    expect(matches.length).toBe(1);
  });

  it("should match multiple t() calls in same line", () => {
    const code = 'const a = t("First"); const b = t("Second");';
    const regex = /\bt\(\s*('|")[^\. \/ @]?\b.+('|")\s*\)/gm;

    // The regex matches the entire line as one match
    // The code then splits it using .replace(/t\(['|"]/gm, "\nt('")
    const matches = code.match(regex);

    expect(matches).toBeDefined();
    // Initially matches as 1, then gets split in the processing
    expect(matches.length).toBe(1);

    // After processing (like in the main code)
    const processed = matches[0].replace(/t\(['|"]/gm, "\nt('");
    const finalMatches = processed.match(regex);
    expect(finalMatches.length).toBe(2);
  });
  it("should extract key from t() match", () => {
    const match = 't("Hello World")';
    const key = match.replace(/(t\(\s*(\'|\")|(\'|\")\s*\))/g, "");

    expect(key).toBe("Hello World");
  });

  it("should handle keys with spaces", () => {
    const match = 't("This is a test")';
    const key = match.replace(/(t\(\s*(\'|\")|(\'|\")\s*\))/g, "");

    expect(key).toBe("This is a test");
  });

  it("should not match t() calls with variables", () => {
    const code = "const msg = t(variable);";
    const regex = /\bt\(\s*(\'|\")[^\. \/ @]?\b.+(\'|\")\s*\)/gm;
    const matches = code.match(regex);

    expect(matches).toBeNull();
  });
});

describe("File Processing", () => {
  it("should handle empty files", () => {
    const content = "";
    const regex = /\bt\(\s*(\'|\")[^\. \/ @]?\b.+(\'|\")\s*\)/gm;
    const matches = content.match(regex);

    expect(matches).toBeNull();
  });

  it("should handle files without t() calls", () => {
    const content = "const x = 5; const y = 10;";
    const regex = /\bt\(\s*(\'|\")[^\. \/ @]?\b.+(\'|\")\s*\)/gm;
    const matches = content.match(regex);

    expect(matches).toBeNull();
  });

  it("should deduplicate file paths", () => {
    const files = ["file1.vue", "file2.vue", "file1.vue", "file3.vue"];
    const unique = [...new Set(files)];

    expect(unique.length).toBe(3);
    expect(unique).toContain("file1.vue");
    expect(unique).toContain("file2.vue");
    expect(unique).toContain("file3.vue");
  });
});
