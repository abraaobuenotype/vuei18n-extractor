# vuei18n-extractor

[![CI](https://github.com/abraaobuenotype/vuei18n-extractor/actions/workflows/ci.yml/badge.svg)](https://github.com/abraaobuenotype/vuei18n-extractor/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/vuei18n-extractor.svg)](https://www.npmjs.com/package/vuei18n-extractor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/vuei18n-extractor)](https://nodejs.org)

> 🌍 Automated translation key extractor for vue-i18n with Composition API support

Extrator automatizado de chaves de tradução para vue-i18n, projetado para simplificar a internacionalização de aplicações Vue.js.

## ✨ Features

- 🚀 Extração automática de chaves `t()` de arquivos Vue e JavaScript
- 🌐 Suporte a múltiplos idiomas simultaneamente
- 📦 Múltiplos formatos de saída (JS, JSON, TypeScript)
- 🔄 Preserva traduções existentes
- 📝 Agrupa chaves por arquivo de origem
- ⚙️ Configuração flexível (JS ou JSON)
- 🎯 Zero dependências de runtime
- **✨ NOVO: Suporte a interpolação de variáveis** `{name}`
- **✨ NOVO: Suporte a pluralização (ICU MessageFormat)** `{count, plural, ...}`
- **✨ NOVO: Suporte a formatação de datas** `{date, date, short}`
- **✨ NOVO: Arquivo `index.js/ts` gerado automaticamente** para fácil import
- **✨ NOVO: Divisão inteligente em múltiplos arquivos** (feature splitting)
- **🔒 NOVO: Segurança robusta contra injection attacks**

## 📦 Instalação

```bash
npm install -g vuei18n-extractor
```

Ou use diretamente com npx:

```bash
npx vuei18n-extractor
```

## 🚀 Uso Rápido

### 1. Crie o arquivo de configuração

Crie um arquivo `i18nExtractor.js` ou `i18nExtractor.json` na raiz do projeto:

### 1. Crie o arquivo de configuração

Crie um arquivo `i18nExtractor.js` ou `i18nExtractor.json` na raiz do projeto:

**Opção 1: JavaScript (recomendado)**

```javascript
// i18nExtractor.js
module.exports = {
  header: "export default",      // ou "module.exports=" para CommonJS
  sourceLocale: "pt",            // idioma fonte
  locales: ["pt", "en", "es"],   // todos os idiomas
  format: "js",                  // formato de saída: "js", "json" ou "ts"
  catalogs: {
    outputFolder: "src/locales", // onde salvar os arquivos
    include: ["src/**/*.{vue,js,ts}"],  // arquivos para escanear
    exclude: ["src/locales/*"]   // arquivos para ignorar
  }
};
```

**Opção 2: JSON**

```json
{
  "sourceLocale": "en",
  "locales": ["en", "fr", "de"],
  "format": "json",
  "catalogs": {
    "outputFolder": "locales",
    "include": ["src/**/*.vue"],
    "exclude": []
  }
}
```

### 2. Use t() no seu código

**Tradução simples:**
```vue
<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const greeting = t("Hello World");
</script>

<template>
  <h1>{{ t("Welcome to my app") }}</h1>
</template>
```

**Com interpolação de variáveis:**
```vue
<script setup>
const welcome = t("Hello {name}, welcome back!");
const message = t("You have {count} new messages");
</script>

<template>
  <p>{{ t("Welcome, {username}!") }}</p>
</template>
```

**Com pluralização (ICU MessageFormat):**
```vue
<script setup>
// Pluralização automática baseada no count
const items = t("{count, plural, =0 {no items} one {# item} other {# items}}");
const notifications = t("{n, plural, zero {no notifications} one {# notification} other {# notifications}}");
</script>

<template>
  <span>{{ t("{count, plural, one {# message} other {# messages}}") }}</span>
</template>
```

**Com formatação de data:**
```vue
<script setup>
const today = t("Today is {date, date, long}");
const time = t("Current time: {now, time, short}");
</script>
```

**Exemplo complexo:**
```vue
<script setup>
const complex = t("Hello {name}, you have {count, plural, zero {no messages} one {# message} other {# messages}} from {date, date, short}");
</script>
```

### 3. Execute o extrator

```bash
npx vuei18n-extractor
```

### 4. Resultado

O extrator gera arquivos de tradução automaticamente com metadados úteis:

**src/locales/pt.js** (idioma fonte)
```javascript
export default {
  /*
   src/Component.vue
  */
  // Variables: name
  "Hello {name}, welcome back!": "Hello {name}, welcome back!",
  
  // Uses pluralization
  "{count, plural, one {# item} other {# items}}": "{count, plural, one {# item} other {# items}}",
  
  // Uses date formatting
  "Today is {date, date, long}": "Today is {date, date, long}",
  
  "Welcome to my app": "Welcome to my app",
};
```

**src/locales/en.js** (outros idiomas - com metadados para facilitar tradução)
```javascript
export default {
  /*
   src/Component.vue
  */
  // Variables: name
  "Hello {name}, welcome back!": "",
  
  // Uses pluralization
  "{count, plural, one {# item} other {# items}}": "",
  
  // Uses date formatting
  "Today is {date, date, long}": "",
  
  "Welcome to my app": "",
};
```

**src/locales/index.js** (✨ NOVO - gerado automaticamente!)
```javascript
import pt from './pt.js';
import en from './en.js';

export const messages = {
  'pt': pt,
  'en': en
};

export default messages;
```

### 5. Configure Vue i18n

```typescript
// src/i18n.ts
import { createI18n } from 'vue-i18n';
import pt from './locales/pt';
import en from './locales/en';

export default createI18n({
  locale: 'pt',
  fallbackLocale: 'en',
  messages: { pt, en },
});
```

Com splitting ativo, cada arquivo de locale (`pt.js`) importa automaticamente todos seus namespaces!

## ⚙️ Opções de Configuração

| Opção | Tipo | Obrigatório | Padrão | Descrição |
|-------|------|-------------|--------|-----------|
| `sourceLocale` | `string` | ✅ | - | Idioma fonte do projeto |
| `locales` | `string[]` | ✅ | - | Lista de todos os idiomas suportados |
| `format` | `"js" \| "json" \| "ts"` | ✅ | - | Formato dos arquivos de saída |
| `header` | `string` | ❌ | `"module.exports="` | Cabeçalho dos arquivos gerados |
| `catalogs.outputFolder` | `string` | ✅ | - | Diretório para salvar arquivos |
| `catalogs.include` | `string[]` | ✅ | - | Padrões glob de arquivos para escanear |
| `catalogs.exclude` | `string[]` | ❌ | `[]` | Padrões glob de arquivos para ignorar |
| `splitting` | `object` | ❌ | - | Configuração para dividir traduções em múltiplos arquivos |

## 📂 Dividindo Traduções em Múltiplos Arquivos

Para projetos grandes, você pode dividir automaticamente as traduções em múltiplos arquivos baseado na estrutura do projeto. **Você continua escrevendo mensagens em linguagem natural**, o splitting é transparente!

### Estratégias Disponíveis

**1. Flat (Padrão)** - Todas traduções em um único arquivo
```javascript
// Sem configuração de splitting
```

**2. Directory** - Baseado na estrutura de diretórios
```javascript
{
  splitting: {
    strategy: "directory",
    maxDepth: 2
  }
}
// src/pages/auth/Login.vue → namespace: "pages.auth"
// Gera: pt.pages.auth.js, en.pages.auth.js
```

**3. Feature** - Baseado em pastas de features
```javascript
{
  splitting: {
    strategy: "feature",
    featureFolders: ["features", "modules"]
  }
}
// src/features/auth/Login.vue → namespace: "auth"
// Gera: pt.auth.js, en.auth.js
```

**4. Custom** - Função personalizada
```javascript
{
  splitting: {
    strategy: "custom",
    customNamespace: (filePath, baseDir) => {
      if (filePath.includes('/admin/')) return 'admin';
      if (filePath.includes('/public/')) return 'public';
      return 'common';
    }
  }
}
```

📚 **[Documentação completa sobre Splitting →](docs/SPLITTING.md)**

## 📖 Exemplos

### Exemplo com TypeScript

```javascript
// i18nExtractor.js
module.exports = {
  header: "export default",
  sourceLocale: "en",
  locales: ["en", "ja", "ko"],
  format: "ts",
  catalogs: {
    outputFolder: "src/i18n/locales",
    include: ["src/**/*.{vue,ts,tsx}"],
    exclude: ["src/**/*.spec.ts", "src/i18n/*"]
  }
};
```

### Exemplo com JSON

```javascript
// i18nExtractor.js
module.exports = {
  sourceLocale: "pt",
  locales: ["pt", "en"],
  format: "json",
  catalogs: {
    outputFolder: "public/locales",
    include: ["src/components/**/*.vue", "src/views/**/*.vue"],
    exclude: []
  }
};
```

## 🔍 Como Funciona

1. **Escaneamento**: Busca todos os arquivos que correspondem aos padrões `include`
2. **Extração**: Encontra todas as chamadas `t("key")` ou `t('key')` no código
3. **Agrupamento**: Organiza chaves por arquivo de origem
4. **Geração**: Cria/atualiza arquivos de locale preservando traduções existentes
5. **Limpeza**: Remove chaves que não existem mais no código

## ⚠️ Limitações

### ❌ Não Suportado (ainda)
- Chaves dinâmicas: `t(variableName)` 
- Chamadas com expressões: `t("key" + suffix)`

### ✅ Suportado
- Strings literais: `t("key")` ✅
- Interpolação: `t("Hello {name}")` ✅
- Pluralização ICU: `t("{count, plural, one {# item} other {# items}}")` ✅
- Formatação de data: `t("{date, date, short}")` ✅
- Template literals: ``t(`Hello {name}`)`` ✅
- Múltiplas linhas (dentro de strings) ✅

## 🔒 Segurança

Esta biblioteca foi desenvolvida com segurança em mente:

- ✅ **Proteção contra Path Traversal**: Todos os caminhos são validados
- ✅ **Proteção contra Code Injection**: Strings são escapadas adequadamente
- ✅ **Validação de Configuração**: Schema estrito com whitelist
- ✅ **Proteção contra ReDoS**: Regex com repetição limitada
- ✅ **Sanitização de Variáveis**: Apenas nomes válidos são aceitos
- ✅ **Validação de ICU MessageFormat**: Sintaxe validada antes de processar

### Exemplos de Proteção

```javascript
// ❌ Path traversal bloqueado
{
  "catalogs": {
    "outputFolder": "../../../etc"  // ERRO: Path traversal detectado
  }
}

// ❌ Locale inválido bloqueado
{
  "locales": ["en; rm -rf /"]  // ERRO: Caracteres inválidos
}

// ❌ Chaves maliciosas são escapadas
t('test"; maliciousCode(); "')  // Escapado automaticamente
```

## 🛠️ Desenvolvimento

### Pré-requisitos

- Node.js >= 18.0.0
- npm ou yarn

### Setup do Projeto

```bash
# Clone o repositório
git clone https://github.com/abraaobuenotype/vuei18n-extractor.git
cd vuei18n-extractor

# Instale dependências
npm install
```

### Scripts Disponíveis

```bash
# Executar testes
npm test

# Testes em modo watch
npm run test:watch

# Cobertura de testes
npm run test:coverage

# Verificar código (linting)
npm run lint

# Corrigir problemas de lint
npm run lint:fix

# Formatar código
npm run format

# Verificar formatação
npm run format:check
```

### Rodando os Testes

```bash
npm test
```

15 testes unitários e de integração garantem a qualidade do código.

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abrir um Pull Request

Por favor, certifique-se de:
- ✅ Adicionar testes para novas funcionalidades
- ✅ Executar `npm run lint` e `npm run format`
- ✅ Todos os testes passando (`npm test`)

## 📝 Changelog

Veja [CHANGELOG.md](CHANGELOG.md) para histórico de versões e mudanças.

## 📄 Licença

MIT © [Abraao Bueno](https://github.com/abraaobuenotype)

## 💡 Inspiração

Inspirado na biblioteca [lingui](https://lingui.js.org/) para React.

## 🙏 Agradecimentos

Obrigado a todos os [contribuidores](https://github.com/abraaobuenotype/vuei18n-extractor/graphs/contributors) que ajudaram a melhorar este projeto!

---

<p align="center">
  Feito com ❤️ para a comunidade Vue.js
</p>
