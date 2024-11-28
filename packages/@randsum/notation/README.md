<!-- Banner Image -->

<div align="center">
  <a href="https://github.com/RANDSUM/randsum" align="center">
    <img width="150" height="150" align="center" src="https://raw.githubusercontent.com/RANDSUM/randsum/main/icon.webp">
  </a>
</div>

<h1 align="center">@randsum/faces</h1>
<h2 align="center">Go Beyond Random Numbers</h2>

## Introduction

`@randsum/notation` is a library that helps you define and validate Dice Notation.

For a full understanding of the formatting of our dice notation, check out the [RANDSUM Dice Notation](./reference/RANDSUM_DICE_NOTATION.md)

## validateNotation

`@randsum/notation` exports a function, `validateNotation`, which will help define whether or not your strings are `RANDSUM`-compatible dice notation.

```ts
import { validateNotation } from '@randsum/notation'

const result = validateNotation('2D20')

result.valid // true
result.notation // `2D20` - a parsed and normalized notation of what was passed in
result.config // { quantity: 2, sides: 20 } - a `RollConfig` object describing this roll
result.description // An array of human-readable strings describing this roll.
```

## isDiceNotation

Thanks to string interpolation, we can get within spitting distance of letting the type system leverage our validation for us.

For instance, typescript can identify that `2D20` is `number-D-number`, and can be typed as a `DiceNotation`.

`@randsum/notation` exports the guard `isDiceNotation` to help manually type your strings, if that's the kind of thing you need.

---

Made with ![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)
Written in ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
