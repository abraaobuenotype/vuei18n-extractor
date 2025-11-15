import { describe, it, expect } from "vitest";
import { NamespaceGenerator } from "../src/utils/namespace.js";

describe("Namespace Generator", () => {
  const baseDir = "/project";

  describe("flat strategy", () => {
    it("should return 'common' for all files", () => {
      const generator = new NamespaceGenerator({ strategy: "flat" });

      expect(generator.generate("/project/src/pages/Home.vue")).toBe("common");
      expect(generator.generate("/project/src/components/Button.vue")).toBe(
        "common"
      );
    });
  });

  describe("directory strategy", () => {
    it("should generate namespace from directory structure", () => {
      const generator = new NamespaceGenerator({
        strategy: "directory",
        baseDir,
      });

      expect(generator.generate("/project/src/pages/auth/Login.vue")).toBe(
        "pages.auth"
      );
      expect(generator.generate("/project/src/components/ui/Button.vue")).toBe(
        "components.ui"
      );
    });

    it("should remove 'src' prefix", () => {
      const generator = new NamespaceGenerator({
        strategy: "directory",
        baseDir,
      });

      expect(generator.generate("/project/src/pages/Home.vue")).toBe("pages");
    });

    it("should return 'common' for root files", () => {
      const generator = new NamespaceGenerator({
        strategy: "directory",
        baseDir,
      });

      expect(generator.generate("/project/App.vue")).toBe("common");
    });

    it("should respect maxDepth", () => {
      const generator = new NamespaceGenerator({
        strategy: "directory",
        baseDir,
        maxDepth: 2,
      });

      expect(
        generator.generate("/project/src/pages/auth/components/Form.vue")
      ).toBe("pages.auth");
    });
  });

  describe("feature strategy", () => {
    it("should extract feature from path", () => {
      const generator = new NamespaceGenerator({
        strategy: "feature",
        baseDir,
      });

      expect(generator.generate("/project/src/features/auth/Login.vue")).toBe(
        "auth"
      );
      expect(
        generator.generate("/project/src/features/dashboard/Home.vue")
      ).toBe("dashboard");
    });

    it("should work with different feature folders", () => {
      const generator = new NamespaceGenerator({
        strategy: "feature",
        baseDir,
        featureFolders: ["modules"],
      });

      expect(generator.generate("/project/src/modules/user/Profile.vue")).toBe(
        "user"
      );
    });

    it("should fallback to directory strategy if no feature found", () => {
      const generator = new NamespaceGenerator({
        strategy: "feature",
        baseDir,
      });

      expect(generator.generate("/project/src/utils/helpers.js")).toBe("utils");
    });
  });

  describe("custom strategy", () => {
    it("should use custom function", () => {
      const customFn = (filePath) => {
        if (filePath.includes("admin")) return "admin";
        if (filePath.includes("public")) return "public";
        return "common";
      };

      const generator = new NamespaceGenerator({
        strategy: "custom",
        customFn,
      });

      expect(generator.generate("/project/src/admin/Users.vue")).toBe("admin");
      expect(generator.generate("/project/src/public/Home.vue")).toBe("public");
      expect(generator.generate("/project/src/utils/helpers.js")).toBe(
        "common"
      );
    });

    it("should fallback to 'common' if custom function returns falsy", () => {
      const customFn = () => null;

      const generator = new NamespaceGenerator({
        strategy: "custom",
        customFn,
      });

      expect(generator.generate("/project/src/pages/Home.vue")).toBe("common");
    });
  });

  describe("groupByNamespace", () => {
    it("should group keys by namespace", () => {
      const generator = new NamespaceGenerator({ strategy: "flat" });

      const keys = [
        { key: "key1", message: "msg1", files: [], namespace: "auth" },
        { key: "key2", message: "msg2", files: [], namespace: "dashboard" },
        { key: "key3", message: "msg3", files: [], namespace: "auth" },
      ];

      const grouped = generator.groupByNamespace(keys);

      expect(grouped.size).toBe(2);
      expect(grouped.get("auth")).toHaveLength(2);
      expect(grouped.get("dashboard")).toHaveLength(1);
    });

    it("should handle keys without namespace", () => {
      const generator = new NamespaceGenerator({ strategy: "flat" });

      const keys = [
        { key: "key1", message: "msg1", files: [] },
        { key: "key2", message: "msg2", files: [], namespace: "auth" },
      ];

      const grouped = generator.groupByNamespace(keys);

      expect(grouped.has("common")).toBe(true);
      expect(grouped.has("auth")).toBe(true);
    });
  });

  describe("getFileName", () => {
    it("should generate correct file names for flat strategy", () => {
      const generator = new NamespaceGenerator({ strategy: "flat" });

      expect(generator.getFileName("common", "pt", "js")).toBe("pt.js");
      expect(generator.getFileName("auth", "en", "json")).toBe("en.json");
    });

    it("should generate namespaced file names for other strategies", () => {
      const generator = new NamespaceGenerator({ strategy: "directory" });

      expect(generator.getFileName("pages.auth", "pt", "js")).toBe(
        "pt.pages.auth.js"
      );
      expect(generator.getFileName("components.ui", "en", "json")).toBe(
        "en.components.ui.json"
      );
    });
  });

  describe("getNamespaces", () => {
    it("should return unique sorted namespaces", () => {
      const generator = new NamespaceGenerator({ strategy: "flat" });

      const keys = [
        { key: "key1", message: "msg1", files: [], namespace: "auth" },
        { key: "key2", message: "msg2", files: [], namespace: "dashboard" },
        { key: "key3", message: "msg3", files: [], namespace: "auth" },
        { key: "key4", message: "msg4", files: [], namespace: "common" },
      ];

      const namespaces = generator.getNamespaces(keys);

      expect(namespaces).toEqual(["auth", "common", "dashboard"]);
    });
  });
});
