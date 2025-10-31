# Contributing to vuei18n-extractor

First off, thank you for considering contributing to vuei18n-extractor! 🎉

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)

## Code of Conduct

This project and everyone participating in it is governed by respect and professionalism. Please be kind and courteous to others.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Description**: Clear description of the problem
- **Steps to Reproduce**: Numbered steps to reproduce the behavior
- **Expected Behavior**: What you expected to happen
- **Actual Behavior**: What actually happened
- **Environment**: OS, Node.js version, package version
- **Configuration**: Your `i18nExtractor.js` config (if relevant)

### Suggesting Enhancements

Enhancement suggestions are welcome! Please include:

- **Use Case**: Describe the problem you're trying to solve
- **Proposed Solution**: How you think it should work
- **Alternatives**: Any alternative solutions you've considered

### Pull Requests

We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`
2. If you've added code, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Git

### Setup Steps

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/vuei18n-extractor.git
cd vuei18n-extractor

# Install dependencies
npm install

# Run tests to make sure everything works
npm test
```

### Project Structure

```
vuei18n-extractor/
├── bin/
│   └── index.js          # Main CLI script
├── tests/
│   ├── unit.test.js      # Unit tests
│   ├── integration.test.js # Integration tests
│   └── fixtures/         # Test fixtures
├── .github/
│   └── workflows/
│       └── ci.yml        # CI configuration
├── .eslintrc.json        # ESLint config
├── .prettierrc           # Prettier config
├── vitest.config.js      # Vitest config
└── package.json
```

## Pull Request Process

1. **Update Documentation**: Update the README.md with details of changes if needed
2. **Update Changelog**: Add your changes to CHANGELOG.md under `[Unreleased]`
3. **Follow Coding Standards**: Ensure your code follows our standards (see below)
4. **Write Tests**: Add tests for new features or bug fixes
5. **Run Quality Checks**: Before submitting, run:
   ```bash
   npm run lint
   npm run format
   npm test
   ```
6. **Commit Messages**: Use clear, descriptive commit messages
7. **PR Description**: Clearly describe what your PR does and why

### Commit Message Format

```
<type>: <description>

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat: add support for template literals in t() calls

fix: handle edge case with nested quotes in translation keys

docs: update README with new configuration options
```

## Coding Standards

### JavaScript Style

- Follow ESLint rules (`.eslintrc.json`)
- Use Prettier for formatting (`.prettierrc`)
- Use JSDoc for documentation

### Code Formatting

```bash
# Format all code
npm run format

# Check if code is formatted
npm run format:check
```

### Linting

```bash
# Check for lint errors
npm run lint

# Auto-fix lint errors
npm run lint:fix
```

### JSDoc Comments

Document all functions:

```javascript
/**
 * Brief description of the function
 * @param {Type} paramName - Description of the parameter
 * @returns {Type} Description of the return value
 */
function myFunction(paramName) {
  // implementation
}
```

## Testing Guidelines

### Writing Tests

- Use Vitest for testing
- Tests should be in `tests/` directory
- Each test should be independent and not rely on execution order
- Use descriptive test names

### Test Structure

```javascript
import { describe, it, expect } from "vitest";

describe("Feature Name", () => {
  it("should do something specific", () => {
    // Arrange
    const input = "test";
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe("expected");
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Test Coverage

- Aim for high test coverage (>80%)
- All new features should have tests
- Bug fixes should include a test that would have caught the bug

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🙏
