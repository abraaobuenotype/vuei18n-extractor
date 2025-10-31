import { describe, it, expect } from "vitest";
import { KeyExtractor } from "../src/parsers/key-extractor.js";

describe("Key Extractor", () => {
  const extractor = new KeyExtractor();

  describe("extractFromCode", () => {
    it("should extract simple keys", () => {
      const code = `
        const msg = t("Hello World");
      `;
      const keys = extractor.extractFromCode(code, "test.js");

      expect(keys).toHaveLength(1);
      expect(keys[0].key).toBe("Hello World");
    });

    it("should extract keys with variables", () => {
      const code = `
        const msg = t("Hello {name}, you have {count} messages");
      `;
      const keys = extractor.extractFromCode(code, "test.js");

      expect(keys).toHaveLength(1);
      expect(keys[0].variables).toEqual(["name", "count"]);
    });

    it("should detect pluralization", () => {
      const code = `
        const msg = t("{count, plural, one {# item} other {# items}}");
      `;
      const keys = extractor.extractFromCode(code, "test.js");

      expect(keys).toHaveLength(1);
      expect(keys[0].hasPlural).toBe(true);
    });

    it("should detect date formatting", () => {
      const code = `
        const msg = t("Today is {date, date, short}");
      `;
      const keys = extractor.extractFromCode(code, "test.js");

      expect(keys).toHaveLength(1);
      expect(keys[0].hasDate).toBe(true);
    });

    it("should extract multiple keys", () => {
      const code = `
        const msg1 = t("First message");
        const msg2 = t("Second message");
        const msg3 = t("Third message");
      `;
      const keys = extractor.extractFromCode(code, "test.js");

      expect(keys).toHaveLength(3);
    });

    it("should deduplicate keys", () => {
      const code = `
        const msg1 = t("Same message");
        const msg2 = t("Same message");
      `;
      const keys = extractor.extractFromCode(code, "test.js");

      expect(keys).toHaveLength(1);
    });

    it("should support single and double quotes", () => {
      const code = `
        const msg1 = t("Double quotes");
        const msg2 = t('Single quotes');
      `;
      const keys = extractor.extractFromCode(code, "test.js");

      expect(keys).toHaveLength(2);
    });

    it("should support template literals", () => {
      const code = "const msg = t(`Template literal with {variable}`);";
      const keys = extractor.extractFromCode(code, "test.js");

      expect(keys).toHaveLength(1);
      expect(keys[0].variables).toContain("variable");
    });
  });

  describe("mergeKeys", () => {
    it("should merge keys from different sources", () => {
      const keys1 = [
        {
          key: "key1",
          message: "key1",
          files: ["file1.js"],
          variables: [],
        },
      ];

      const keys2 = [
        {
          key: "key2",
          message: "key2",
          files: ["file2.js"],
          variables: [],
        },
      ];

      const merged = extractor.mergeKeys(keys1, keys2);

      expect(merged).toHaveLength(2);
    });

    it("should merge file lists for duplicate keys", () => {
      const keys1 = [
        {
          key: "shared",
          message: "shared",
          files: ["file1.js"],
          variables: [],
        },
      ];

      const keys2 = [
        {
          key: "shared",
          message: "shared",
          files: ["file2.js"],
          variables: [],
        },
      ];

      const merged = extractor.mergeKeys(keys1, keys2);

      expect(merged).toHaveLength(1);
      expect(merged[0].files).toContain("file1.js");
      expect(merged[0].files).toContain("file2.js");
    });
  });
});
