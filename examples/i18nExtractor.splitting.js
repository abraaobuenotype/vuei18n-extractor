// Example configuration with splitting strategy
module.exports = {
  header: "export default",
  sourceLocale: "en",
  locales: ["en", "pt", "es"],
  format: "js",
  catalogs: {
    outputFolder: "src/locales",
    include: ["src/**/*.{vue,js,ts}"],
    exclude: ["src/locales/**/*"],
  },
  // Splitting configuration (optional)
  splitting: {
    // Strategy: 'flat' | 'directory' | 'feature' | 'custom'
    strategy: "feature",

    // Base directory for calculating relative paths
    // baseDir: process.cwd(),

    // Folders that indicate feature boundaries
    featureFolders: ["features", "modules", "pages", "domains"],

    // Maximum depth for directory-based namespacing (used with 'directory' strategy)
    // maxDepth: 3,

    // Custom function for generating namespace (used with 'custom' strategy)
    // customNamespace: (filePath, baseDir) => {
    //   if (filePath.includes('/admin/')) return 'admin';
    //   if (filePath.includes('/public/')) return 'public';
    //   return 'common';
    // }
  },
};
