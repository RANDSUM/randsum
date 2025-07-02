<div align="center">
  <img width="150" height="150" src="https://raw.githubusercontent.com/RANDSUM/randsum/main/icon.webp" alt="Randsum Logo">
  <h1>@randsum/core</h1>
  <h3>Internal shared utilities and types for the Randsum ecosystem</h3>

⚠️ **This is an internal package** ⚠️ ️

</div>

This package contains shared utilities and types for the `@randsum` ecosystem. It is not intended for direct installation or usage.

## Usage

Instead of installing this package directly, use one of our public packages which re-export all necessary types and utilities:

- [`@randsum/dice`](https://www.npmjs.com/package/@randsum/dice) - 'core' dice rolling implementation
- [`@randsum/notation`](https://www.npmjs.com/package/@randsum/notation) - 'dice' notation parser
- [`@randsum/5e`](https://www.npmjs.com/package/@randsum/5e) - 5th Edition compatible dice rolling

## For Contributors

This package contains:

- Shared TypeScript types
- Common utilities
- Internal testing helpers
- Shared constants

If you're contributing to randsum, you'll interact with this package through the monorepo setup:

```bash
# From root directory
bun install
bun run build
```

<div align="center">
Made with 👹 by <a href="https://github.com/RANDSUM">RANDSUM</a>
</div>
