<!-- Banner Image -->

<div align="center">
  <a href="https://github.com/RANDSUM/randsum" align="center">
    <img width="150" height="150" align="center" src="https://raw.githubusercontent.com/RANDSUM/randsum/main/icon.webp">
  </a>
</div>

<h1 align="center">@randsum</h1>
<h2 align="center">A powerful collection of utilities for rolling dice in Javascript</h2>

## Introduction

`@randsum` is a powerful collection of dice-rolling utilities. You can roll common dice with `@randsum/dice`:

```ts
import { D20 } from `@randsum/dice`

// Roll a single D20
D20.roll()

// Roll 4 D20
D20.rollMany(4)

```

Or compose powerful rolls with multiple dice and modifiers using `@randsum/tower`:

```ts
import { roll } from `@randsum/tower`

// Roll 4 D6 and 2 D20
roll({quantity: 4, sides: 6}, D20)

// Roll 4 D6, drop the lowest, and roll three d8
roll({ quantity: 4, sides: 6, modifiers: { drop: { lowest: true } } }, {quantity: 3, sides: 8})
```

Validate and manipulate dice notation with `@randsum/notation`:

```ts
import { validate, DiceNotation } from `@randsum/notation`

const { valid } = validate('4d6L')

const notation: DiceNotation = `4D6!` // valid
const badNotation: DiceNotation = `4X2` // invalid
```

...and more!

---

Written With ![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)
