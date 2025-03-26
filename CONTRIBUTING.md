# Contributing to Randsum

First off, thanks for taking the time to contribute! 👍

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Pull Requests](#pull-requests)
- [Development Process](#development-process)
  - [Setting Up the Development Environment](#setting-up-the-development-environment)
  - [Running Tests](#running-tests)
  - [Code Style](#code-style)
- [Project Structure](#project-structure)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- Use a clear and descriptive title
- Describe the exact steps which reproduce the problem
- Provide specific examples to demonstrate the steps
- Describe the behavior you observed after following the steps
- Explain which behavior you expected to see instead and why
- Include code samples and error messages if applicable

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- A clear and descriptive title
- A detailed description of the proposed functionality
- Examples of how the feature would be used
- Why this enhancement would be useful to most Randsum users

### Pull Requests

- Fill in the required template
- Do not include issue numbers in the PR title
- Include screenshots and animated GIFs in your pull request whenever possible
- Follow the TypeScript and JavaScript styleguides
- Include thoughtfully-worded, well-structured tests
- Document new code
- End all files with a newline

## Development Process

### Setting Up the Development Environment

```bash
# Clone the repository
git clone https://github.com/RANDSUM/randsum.git
cd randsum-ts

# Install dependencies for all packages
bun run install:all

# Build all packages
bun run build:all
```

### Running Tests

```bash
# Run all tests
bun test

# Run type checks
bun ts:check

# Run linting
bun lint
```

### Code Style

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Follow the existing code style
- Write descriptive commit messages
- Keep code modular and maintainable

## Project Structure

This is a monorepo containing several packages:

```
packages/
├── core/         # Shared utilities and types
├── dice/         # Core dice rolling implementation
└── notation/      # Dice notation parser
```

Each package has its own:

- `package.json`
- `README.md`
- `src/` directory
- `__tests__/` directory
- `dist/` directory (generated)

### Package Responsibilities

- `@randsum/core`: Shared types and utilities
- `@randsum/dice`: Core dice rolling logic
- `@randsum/notation`: Dice notation parsing
- `randsum`: Main package that most users will install

## Need Help?

Feel free to reach out by:

- Opening an issue
- Starting a discussion
- Emailing alxjrvs@gmail.com

---

Thank you for contributing to Randsum! 🎲
