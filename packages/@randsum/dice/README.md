<!-- Banner Image -->

<div align="center">
  <a href="https://github.com/RANDSUM/randsum" align="center">
    <img width="150" height="150" align="center" src="https://raw.githubusercontent.com/RANDSUM/randsum/main/icon.webp">
  </a>
</div>

<h1 align="center">@randsum/dice</h1>
<h2 align="center">Random Numbers as a Service</h2>

## Introduction

`@randsum/dice` is a straightforward library for rolling virtual dice.

## Common Dice

If you need to simulate dice of common sizes, `@randsum/dice` probably has you covered.

```ts

import { D4, D6, D8, D10, D12, D20, D100 } from '@randsum/dice'

// Roll a D20
D20.roll // a number between 1-20

// Roll 4 D8
D8.rollMany(4) // A number between 4 and 32

// Inspect sides

D100.sides // 100
```

## D

`D` is a class that can be used to construct dice of `n` sides:

```ts
import { D } from '@randsum/dice'

const D120 = new D(120)

D120.roll() // a number between 1-120

```

---

Made with ![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)
Written in ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
