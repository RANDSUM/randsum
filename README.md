<div align="center">
<a href="https://github.com/RANDSUM/randsum-ts" align="center">
  <img width="150" height="150" align="center" src="https://raw.githubusercontent.com/RANDSUM/randsum-ts/main/icon.webp">
</div>
<h1 align="center">@randsum</h1>
<h2 align="center">A powerful collection of utilities for rolling dice in Javascript</h2>
<div align="center">
  <a href="https://www.npmjs.com/package/randsum" align="center">
    <img src="https://img.shields.io/npm/v/randsum">
  </a>
  <a href="https://bundlephobia.com/package/randsum" align="center">
    <img src="https://img.shields.io/bundlephobia/minzip/randsum">
  </a>
  <a href="https://github.com/RANDSUM/randsum-ts/blob/main/CODE_OF_CONDUCT.md" align="center">
    <img src="https://img.shields.io/badge/code%20of-conduct-ff69b4.svg?style=flat">
  </a>
  <a href="https://github.com/RANDSUM/randsum-ts/actions/workflows/main.yml" align="center">
    <img src="https://github.com/RANDSUM/randsum-ts/actions/workflows/main.yml/badge.svg">
  </a>
  <a href="https://github.com/RANDSUM/randsum-ts/actions/workflows/github-code-scanning/codeql" align="center">
    <img src="https://github.com/RANDSUM/randsum-ts/actions/workflows/github-code-scanning/codeql/badge.svg">
  </a>
  <a href="https://github.com/oven-sh/bun">
    <img src="https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white">
  </a>
</div>

## What is this?

`@randsum` is a powerful collection of dice-rolling utilities:

```ts
// Let's Roll!
import { D20 } from `@randsum/dice`

// Roll a single D20
D20.roll()

// Roll 4 D20
D20.rollMany(4)

// Lets pull out the dice tower for some more complicated rolls

import { roll } from `@randsum/tower`

// Roll 4 D6
roll({quantity: 4, sides: 6})

// Roll 4 D6, drop the lowest
roll({ quantity: 4, sides: 6, modifiers: { drop: { lowest: true } } })

// Lets do the same, but with dice notation
roll('4d6L')

// Maybe we want to validate that notation?

import { validate } from `@randsum/notation`

const { valid } = validate('4d6L')

```

Written in 100% Typescript with strong attention paid to return types. You depend on `randsum` to give you what you expect - just not always the roll you want.

## Further Reading

[Getting Started](https://github.com/RANDSUM/randsum-ts/blob/main/GETTING_STARTED.md) - Installation and Documentation for using `randsum`

[Roll Dice Notation](https://github.com/RANDSUM/randsum-ts/blob/main/RANDSUM_DICE_NOTATION.md) - A guide for using [Dice Notation](https://en.wikipedia.org/wiki/Dice_notation) with `randsum`.

[Contributing](https://github.com/RANDSUM/randsum-ts/blob/main/CONTRIBUTING.md) - help make `randsum` better!

[Sophie's Dice Notation](https://sophiehoulden.com/dice/documentation/notation.html) - a great dice notation guide that helped me along the way

[\_why's poignant guide to ruby](https://poignant.guide/) - \_why not?

## Why did you make this?

Sometime around 2012, I decided I wanted to learn to program. I had installed ruby on the best laptop six-hundred dollars could buy, set to make a dice roller as an easy first project.

I spent an easy 30 minutes trying to figure out how to make `rand(n)` return `1...n` instead of `0...(n-1)`.

When I found the answer, I laughed and laughed. I've been chasing that high ever since.
