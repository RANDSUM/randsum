---
title: "Installation"
description: "Get RANDSUM installed and configured in your project"
category: "guide"
order: 1
tags: ["setup", "npm", "getting-started"]
difficulty: "beginner"
estimatedReadTime: 5
relatedDocs: ["quick-start"]
relatedPackages: ["@randsum/roller"]
sidebar: true
toc: true
searchable: true
---

# Installation

RANDSUM is available as a collection of npm packages. You can install the core package or specific game system packages depending on your needs.

## Core Package

The core `@randsum/roller` package provides the fundamental dice rolling engine:

```bash
npm install @randsum/roller
```

```bash
yarn add @randsum/roller
```

```bash
pnpm add @randsum/roller
```

```bash
bun add @randsum/roller
```

## Game System Packages

Install specific game system packages for specialized dice mechanics:

### Blades in the Dark
```bash
npm install @randsum/blades
```

### Daggerheart
```bash
npm install @randsum/daggerheart
```

### D&D 5th Edition
```bash
npm install @randsum/fifth
```

### Root RPG
```bash
npm install @randsum/root-rpg
```

### Salvage Union
```bash
npm install @randsum/salvageunion
```

## TypeScript Support

All RANDSUM packages include full TypeScript definitions out of the box. No additional `@types` packages are needed.

## Verification

After installation, verify everything is working:

```typescript
import { roll } from '@randsum/roller';

const result = roll('2d6+3');
console.log(result.total); // Random number between 5-15
```

## Next Steps

- [Quick Start Guide](/docs/quick-start) - Learn the basics
- [Dice Notation](/docs/dice-notation) - Understand the syntax
- [API Reference](/docs/api) - Complete API documentation
