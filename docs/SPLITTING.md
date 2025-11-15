# Splitting Strategy - Dividing Translations into Multiple Files

## Overview

For large projects with hundreds or thousands of translation keys, having all translations in a single file becomes difficult to manage and translate. The **splitting strategy** allows you to automatically organize translations into multiple files based on your project structure, **while still writing messages in plain language** without needing to think about key names.

## Strategies

### 1. **Flat** (Default)
All translations in a single file.

```javascript
// i18nExtractor.js
module.exports = {
  sourceLocale: "pt",
  locales: ["pt", "en"],
  format: "js",
  catalogs: {
    outputFolder: "src/locales",
    include: ["src/**/*.{vue,js}"],
    exclude: []
  }
  // No splitting config = flat strategy
};
```

**Output:**
```
src/locales/
  ├── pt.js
  └── en.js
```

---

### 2. **Directory** 
Namespace based on directory structure.

```javascript
module.exports = {
  sourceLocale: "pt",
  locales: ["pt", "en"],
  format: "js",
  catalogs: {
    outputFolder: "src/locales",
    include: ["src/**/*.{vue,js}"],
    exclude: []
  },
  splitting: {
    strategy: "directory",
    maxDepth: 2  // Limit namespace depth
  }
};
```

**Example:**
```
src/pages/auth/Login.vue         → namespace: "pages.auth"
src/components/ui/Button.vue     → namespace: "components.ui"
src/views/Dashboard.vue          → namespace: "views"
```

**Output:**
```
src/locales/
  ├── pt.pages.auth.js
  ├── pt.components.ui.js
  ├── pt.views.js
  ├── en.pages.auth.js
  ├── en.components.ui.js
  └── en.views.js
```

**Benefits:**
- ✅ Natural organization by project structure
- ✅ Easy to find translations related to specific pages/components
- ✅ Smaller files, easier to review and translate
- ✅ Better for version control (fewer merge conflicts)

---

### 3. **Feature**
Namespace based on feature folders (DDD/Feature-Sliced Design).

```javascript
module.exports = {
  sourceLocale: "pt",
  locales: ["pt", "en"],
  format: "js",
  catalogs: {
    outputFolder: "src/locales",
    include: ["src/**/*.{vue,js}"],
    exclude: []
  },
  splitting: {
    strategy: "feature",
    featureFolders: ["features", "modules", "domains"]
  }
};
```

**Example:**
```
src/features/auth/Login.vue           → namespace: "auth"
src/features/dashboard/Home.vue       → namespace: "dashboard"
src/modules/user/Profile.vue          → namespace: "user"
src/components/Button.vue             → namespace: "components"
```

**Output:**
```
src/locales/
  ├── pt.auth.js
  ├── pt.dashboard.js
  ├── pt.user.js
  ├── pt.components.js
  ├── en.auth.js
  ├── en.dashboard.js
  ├── en.user.js
  └── en.components.js
```

**Benefits:**
- ✅ Perfect for feature-based architecture
- ✅ Each feature has its own translation file
- ✅ Easy to extract or reuse features
- ✅ Clear domain boundaries

---

### 4. **Custom**
Use a custom function to determine namespace.

```javascript
module.exports = {
  sourceLocale: "pt",
  locales: ["pt", "en"],
  format: "js",
  catalogs: {
    outputFolder: "src/locales",
    include: ["src/**/*.{vue,js}"],
    exclude: []
  },
  splitting: {
    strategy: "custom",
    customNamespace: (filePath, baseDir) => {
      // Admin area
      if (filePath.includes('/admin/')) return 'admin';
      
      // Public area
      if (filePath.includes('/public/')) return 'public';
      
      // API-related
      if (filePath.includes('/api/')) return 'api';
      
      // Default
      return 'common';
    }
  }
};
```

**Benefits:**
- ✅ Complete control over organization
- ✅ Can implement any logic you need
- ✅ Mix multiple criteria

---

## Real-World Example

### Project Structure
```
src/
├── features/
│   ├── auth/
│   │   ├── Login.vue
│   │   └── Register.vue
│   ├── dashboard/
│   │   ├── Home.vue
│   │   └── Stats.vue
│   └── settings/
│       └── Profile.vue
├── components/
│   └── ui/
│       └── Button.vue
└── locales/  (output)
```

### Code (still using natural language!)
```vue
<!-- src/features/auth/Login.vue -->
<template>
  <div>
    <h1>{{ t("Welcome back!") }}</h1>
    <p>{{ t("Please enter your credentials to continue") }}</p>
    <button>{{ t("Sign in") }}</button>
  </div>
</template>
```

### Configuration
```javascript
// i18nExtractor.js
module.exports = {
  sourceLocale: "en",
  locales: ["en", "pt", "es"],
  format: "js",
  catalogs: {
    outputFolder: "src/locales",
    include: ["src/features/**/*.vue", "src/components/**/*.vue"],
    exclude: ["src/locales/*"]
  },
  splitting: {
    strategy: "feature",
    featureFolders: ["features"]
  }
};
```

### Generated Files
```javascript
// src/locales/en.auth.js
export default {
  /*
   src/features/auth/Login.vue
  */
  "Welcome back!": "Welcome back!",
  "Please enter your credentials to continue": "Please enter your credentials to continue",
  "Sign in": "Sign in",
  
  /*
   src/features/auth/Register.vue
  */
  "Create your account": "Create your account",
  "Sign up": "Sign up",
};

// src/locales/en.dashboard.js
export default {
  /*
   src/features/dashboard/Home.vue
  */
  "Dashboard": "Dashboard",
  "Overview": "Overview",
};

// src/locales/en.settings.js
export default {
  /*
   src/features/settings/Profile.vue
  */
  "My Profile": "My Profile",
  "Edit profile": "Edit profile",
};
```

---

## Using Split Translations in Your App

### Vue i18n Configuration (Super Simple!)

O extrator **gera automaticamente um arquivo `index.js/ts`** que já importa tudo para você:

```javascript
// src/i18n.js
import { createI18n } from 'vue-i18n';
import messages from './locales/index'; // ← Importa tudo automaticamente!

export default createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages, // ← Pronto! Todas as traduções carregadas
});
```

**Arquivo `locales/index.js` gerado automaticamente:**
```javascript
import en_auth from './en.auth.js';
import en_dashboard from './en.dashboard.js';
import en_settings from './en.settings.js';
import pt_auth from './pt.auth.js';
import pt_dashboard from './pt.dashboard.js';
import pt_settings from './pt.settings.js';

export const messages = {
  'en': {
    'auth': en_auth,
    'dashboard': en_dashboard,
    'settings': en_settings
  },
  'pt': {
    'auth': pt_auth,
    'dashboard': pt_dashboard,
    'settings': pt_settings
  }
};

export default messages;
```

### Using in Components

```vue
<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// Still using the same natural language messages!
const message = t("Welcome back!");  // Works automatically with namespaced files
</script>
```

**Note:** Vue i18n will automatically look for the key across all loaded namespaces, so you don't need to change your code at all!

---

## Best Practices

### ✅ DO

- **Use meaningful directory structure** - Your file organization will reflect in translations
- **Choose strategy based on project size:**
  - Small projects (< 50 translations): `flat`
  - Medium projects (50-500): `directory` with `maxDepth: 2`
  - Large projects (> 500): `feature` or `custom`
- **Keep messages in natural language** - Don't change your t() calls!
- **Commit both source and target locale files** - Easier for translators

### ❌ DON'T

- **Don't mix strategies** - Pick one and stick with it
- **Don't manually edit generated files for source locale** - They will be overwritten
- **Don't go too deep** - Use `maxDepth` to limit nesting (3 levels max recommended)

---

## Migration from Single File

Already have a single translation file? No problem!

1. **Enable splitting strategy** in your config
2. **Run the extractor** - It will reorganize your translations
3. **Update your i18n configuration** to load multiple files
4. **Test your app** - All existing t() calls will still work!

The extractor preserves existing translations, so you won't lose any work.

---

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `strategy` | `'flat' \| 'directory' \| 'feature' \| 'custom'` | `'flat'` | Splitting strategy |
| `baseDir` | `string` | `process.cwd()` | Base directory for relative paths |
| `featureFolders` | `string[]` | `['features', 'modules', 'pages', 'components', 'views']` | Folders indicating features |
| `maxDepth` | `number` | `3` | Maximum namespace depth for directory strategy |
| `customNamespace` | `function` | - | Custom function `(filePath, baseDir) => namespace` |

---

## Questions?

**Q: Will I need to change my t() calls?**  
A: No! You still write `t("Plain text message")` - the splitting is transparent.

**Q: What if I have translations from multiple namespaces in one component?**  
A: That's fine! Vue i18n searches across all namespaces automatically with `flatJson: true`.

**Q: Can I change strategy later?**  
A: Yes! Just update your config and run the extractor again. Existing translations are preserved.

**Q: How does this affect performance?**  
A: Minimal impact. You can lazy-load namespaces for better performance in large apps.
