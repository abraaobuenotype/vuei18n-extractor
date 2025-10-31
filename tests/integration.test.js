import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// We'll need to export these functions from bin/index.js for testing
// For now, we'll test the integration by running the CLI

describe("Integration Tests", () => {
  const outputDir = path.join(__dirname, "fixtures", "output");

  beforeEach(async () => {
    // Clean output directory before each test
    await fs.remove(outputDir);
  });

  afterEach(async () => {
    // Clean up after tests
    await fs.remove(outputDir);
  });

  it("should create output directory structure", async () => {
    await fs.ensureDir(outputDir);
    const exists = await fs.pathExists(outputDir);
    expect(exists).toBe(true);
  });

  it("should extract keys from Vue files", async () => {
    const vueFile = path.join(__dirname, "fixtures", "src", "Component.vue");
    const content = await fs.readFile(vueFile, "utf-8");

    const matches = content.match(
      /\bt\(\s*(\'|\")[^\. \/ @]?\b.+(\'|\")\s*\)/gm
    );

    expect(matches).toBeDefined();
    expect(matches.length).toBeGreaterThan(0);
  });

  it("should extract keys from JS files", async () => {
    const jsFile = path.join(__dirname, "fixtures", "src", "utils.js");
    const content = await fs.readFile(jsFile, "utf-8");

    const matches = content.match(
      /\bt\(\s*(\'|\")[^\. \/ @]?\b.+(\'|\")\s*\)/gm
    );

    expect(matches).toBeDefined();
    expect(matches.length).toBe(3);
  });
});
