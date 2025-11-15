// Configuration with feature splitting strategy
export default {
  header: "export default",
  sourceLocale: "en",
  locales: ["en", "pt"],
  format: "js",
  catalogs: {
    outputFolder: "tests/fixtures/output-split",
    include: [
      "tests/fixtures/src/features/**/*.vue",
      "tests/fixtures/src/components/**/*.vue",
    ],
    exclude: [],
  },
  splitting: {
    strategy: "feature",
    featureFolders: ["features", "components"],
  },
};
