# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
