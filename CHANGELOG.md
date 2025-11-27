# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
## [2.4.0] - 2025-11-27

### Added
- **🌍 Relative Paths in Comments** - File path comments now use relative paths instead of absolute paths
  - Ensures consistent output across different developers and machines
  - Eliminates git diffs caused by different user home directories
  - Uses forward slashes for cross-platform consistency (Windows/macOS/Linux)
- New `toRelativePath()` method in `CatalogGenerator` class
- New test suite "Relative Path Tests" with 3 tests covering:
  - Relative path generation
  - Cross-developer consistency
  - Cross-platform path separators

### Changed
- `groupKeysByFile()` now converts absolute paths to relative paths before grouping
- Path comments in generated files now show paths relative to project root (e.g., `src/components/Button.vue` instead of `/Users/john/project/src/components/Button.vue`)

### Fixed
- **🐛 Git diffs between developers** - Previously, file path comments contained absolute paths that included user-specific directories, causing unnecessary git changes when different developers ran the extractor

## [2.3.0] - 2025-11-26

### Added
- **🔒 Output Determinístico** - Arquivos gerados são idênticos entre execuções
  - Ordenação alfabética de chaves por `key.localeCompare()`
  - Ordenação alfabética de arquivos fonte (`files.sort()`)
  - Ordenação de namespaces e grupos de arquivos
  - Garante que `git diff` mostre apenas mudanças reais
- **⚡ Skip-if-Unchanged** - Pula escrita de arquivos sem modificações
  - Compara conteúdo gerado com arquivo existente antes de escrever
  - Reduz operações de I/O desnecessárias
  - Preserva timestamps de arquivos inalterados
  - Nova estatística: "X files unchanged (skipped)"
- Ordenação de arquivos do `glob()` para processamento determinístico

### Changed
- `mergeKeys()` agora retorna chaves ordenadas por `key.localeCompare()`
- `groupKeysByFile()` ordena lista de arquivos antes de criar a chave do grupo
- `generateJS()` ordena grupos de arquivos e chaves dentro de cada grupo
- `generateJSON()` ordena chaves alfabeticamente
- `generateLocaleIndex()` ordena namespaces no arquivo de índice
- `groupByNamespace()` ordena chaves dentro de cada namespace
- Estatísticas de extração agora incluem contagem de arquivos pulados

### Fixed
- **🐛 Arquivos alterados desnecessariamente entre execuções**
  - Problema: Ordem dos arquivos no comentário mudava a cada execução
  - Problema: Ordem das chaves variava dependendo da ordem de leitura
  - Problema: Arquivos eram reescritos mesmo sem mudanças reais
  - Solução: Output 100% determinístico + verificação de mudanças
- Otimização de performance: menos escritas em disco



## [2.2.0] - 2025-11-15

### Added
- **🎉 MAJOR: Arquivos agregadores por locale gerados automaticamente** - Simplifica importação de traduções
  - Gera automaticamente um arquivo por locale que importa todos seus namespaces
  - Exemplo: `pt-BR.js` importa `pt-BR.auth.js`, `pt-BR.dashboard.js`, etc.
  - Suporta TypeScript com types completos
  - Funciona automaticamente quando splitting está ativo
  - Zero configuração necessária do usuário
- **🔄 Migração automática de arquivos inválidos** - Preserva traduções existentes
  - Detecta e renomeia automaticamente arquivos com nomes inválidos (`[id]`, `[slug]`, etc.)
  - Preserva 100% das traduções durante migração
  - Mescla duplicados se arquivo novo já existir (novo tem prioridade)
  - Suporta JS, TS e JSON
  - Executa automaticamente antes da extração
  - Exemplos de migração:
    - `pt-BR.pages.employees.[id].js` → `pt-BR.pages.employees.id.js`
    - `en.pages.products.[slug].ts` → `en.pages.products.slug.ts`
- Método `generateLocaleIndex()` no `CatalogGenerator`
- Método `sanitizeVarName()` para nomes de variáveis seguros
- Método `sanitizeNamespace()` para limpar caracteres inválidos em namespaces
- Método `migrateInvalidFileNames()` para migração automática
- Métodos `readTranslationFile()` e `writeTranslationFile()` para manipulação segura
- 15 novos testes (1 agregadores + 7 sanitização + 7 migração, total: 95 testes)

### Changed
- Extrator agora gera um arquivo agregador por locale quando há splitting
- Configuração Vue i18n simplificada: `import pt from './locales/pt'`
- Cada locale importa apenas seus próprios namespaces
- Migração de arquivos antigos acontece automaticamente (zero config)

### Fixed
- **🐛 Suporte para rotas dinâmicas do Vue Router** - Namespaces com `[id]`, `[slug]` agora funcionam
  - Converte `[id]` → `id`, `[slug]` → `slug` em namespaces
  - Remove caracteres especiais como `[]`, `()`, `{}`, `<>`
  - Exemplo: `pages.employees.[id]` → `pages.employees.id`
  - Normaliza para lowercase e remove pontos consecutivos
  - Soluciona erro com arquivos inválidos em projetos usando rotas dinâmicas
- **💾 Preservação de traduções existentes** - Não é mais necessário deletar e traduzir tudo novamente
  - Sistema detecta arquivos com nomes antigos e migra automaticamente
  - Traduções são preservadas durante o processo
  - Resolve duplicados de forma inteligente
- **🔧 Compatibilidade com Nuxt/Vue i18n** - Arquivo agregador agora usa estrutura flat
  - Mudança de estrutura aninhada `{ auth: {...}, dashboard: {...} }` para flat `{ ...auth, ...dashboard }`
  - Usa spread operator para mesclar namespaces em objeto único
  - Resolve erro: "You need to define 'export default' that will return the locale messages"
  - Totalmente compatível com configuração padrão do Nuxt i18n
- **📦 Imports ES Modules corretos** - Remove extensões `.ts`/`.js` dos imports
  - Segue convenção ES modules: imports sem extensão
  - Mantém `.json` para imports JSON
  - Resolve problemas de resolução de módulos em projetos TypeScript
  - Exemplo: `import components from './en-US.components'`
- **🔧 Compatibilidade com unplugin-vue-i18n** - Arquivos agregadores sem tipos TypeScript
  - Remove interface `Messages` dos arquivos de locale
  - Remove variável tipada intermediária
  - Exporta objeto diretamente: `export default { ...ns1, ...ns2 }`
  - Plugin processa arquivos sem erros de tipos
  - Totalmente compatível com build-time optimization do unplugin

## [2.1.0] - 2025-11-15

### Added
- **🎉 MAJOR: Estratégias de splitting automático** - Divide traduções em múltiplos arquivos
  - Estratégia `flat`: Todas traduções em um único arquivo (padrão)
  - Estratégia `directory`: Namespace baseado na estrutura de diretórios
  - Estratégia `feature`: Namespace baseado em pastas de features/modules
  - Estratégia `custom`: Função personalizada para gerar namespace
- Módulo `NamespaceGenerator` para geração inteligente de namespaces
- 15 novos testes para estratégias de splitting (total: 75 testes)
- Documentação completa em `docs/SPLITTING.md`
- Exemplo de configuração com splitting em `examples/`
- Suporte a `splitting.maxDepth` para limitar profundidade de namespace
- Suporte a `splitting.featureFolders` para customizar detecção de features
- Mensagens no console mostram namespaces detectados

### Changed
- Chaves extraídas agora incluem propriedade `namespace`
- Generator agora cria múltiplos arquivos quando splitting está habilitado
- Nomes de arquivos seguem padrão `{locale}.{namespace}.{format}`

## [2.0.0] - 2025-10-31

### Added
- **🎉 MAJOR: Suporte a interpolação de variáveis** `{name}`, `{count}`, etc.
- **🎉 MAJOR: Suporte a pluralização (ICU MessageFormat)** `{count, plural, one {# item} other {# items}}`
- **🎉 MAJOR: Suporte a formatação de datas** `{date, date, short}`, `{time, time, long}`
- **🎉 MAJOR: Arquitetura modular** - Código separado em módulos reutilizáveis
- Módulo `KeyExtractor` para extração de chaves
- Módulo `MessageParser` para análise de mensagens ICU
- Módulo `CatalogGenerator` para geração de arquivos
- Módulo `ConfigLoader` para carregamento de configuração
- Validação de MessageFormat ICU para prevenir erros
- Detecção automática de variáveis, plurais e datas
- Metadados nos arquivos gerados (comentários sobre features usadas)
- 28 novos testes para as funcionalidades avançadas (total: 60 testes)
- ESLint configuration for code quality
- Prettier configuration for consistent code formatting
- JSDoc documentation for all functions and types
- GitHub Actions CI workflow for automated testing
- Test coverage reporting with v8
- Code quality scripts (`lint`, `format`, `test`)
- Improved error messages with better context
- Development section in README
- Test fixtures for Vue and JS files
- `prepublishOnly` script to ensure quality before publishing
- **Security hardening with multiple layers of protection**
- Path traversal validation for all file operations
- Input sanitization and escaping for generated code
- Configuration validation with strict schema checks
- Regex DoS protection with bounded repetition
- Secure temporary file handling
- Variable name validation for security

### Changed
- **🔧 BREAKING: Arquitetura completamente refatorada** em módulos
- **🔧 BREAKING: CLI movido para `bin/cli.js`**
- Código principal agora em `src/` com estrutura modular:
  - `src/parsers/` - Extração e análise de mensagens
  - `src/generators/` - Geração de catálogos
  - `src/utils/` - Utilitários de segurança e validação
  - `src/config/` - Carregamento de configuração
- Regex melhorada para suportar template literals
- Extração mais robusta com suporte a ICU MessageFormat
- Mensagens de log aprimoradas com emojis e cores
- Updated all dependencies to latest versions
- Improved error handling (replaced empty catch blocks with proper logging)
- Enhanced console messages with better formatting and colors
- Added success message with file count after extraction
- Updated README with badges and better documentation
- Updated `.gitignore` to exclude coverage and test output
- **Regex improved to prevent ReDoS attacks (limited to 500 chars)**
- **String escaping now handles all special characters**
- **Configuration files must be in project root (security)**
- **Locale names restricted to alphanumeric + dash/underscore**

### Fixed
- Security vulnerabilities by updating Vitest to 1.6.1
- Empty catch blocks that silenced errors
- **CRITICAL: Path traversal vulnerability in file operations**
- **CRITICAL: Code injection via malicious translation keys**
- **CRITICAL: Arbitrary code execution via dynamic imports**
- **HIGH: Comment injection in generated files**
- **MEDIUM: Regular Expression Denial of Service (ReDoS)**

### Security
- All file paths are validated against path traversal attacks
- Translation keys and values are escaped to prevent code injection
- Configuration is validated with strict type and format checks
- Temporary files use timestamp-based naming for uniqueness
- Maximum key length enforced (500 characters)
- Only safe characters allowed in locale names

## [1.2.1] - Previous Release

### Features
- Basic extraction of translation keys from Vue and JS files
- Support for multiple locales
- Configurable output formats (js, json, ts)
- File grouping with comments in output

[Unreleased]: https://github.com/abraaobuenotype/vuei18n-extractor/compare/v1.2.1...HEAD
[1.2.1]: https://github.com/abraaobuenotype/vuei18n-extractor/releases/tag/v1.2.1
