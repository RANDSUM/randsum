<!-- Banner Image -->

<div align="center">
  <a href="https://github.com/RANDSUM/randsum" align="center">
    <img width="150" height="150" align="center" src="https://raw.githubusercontent.com/RANDSUM/randsum/main/icon.webp">
  </a>
</div>

<h1 align="center">@randsum/faces</h1>
<h2 align="center">Go Beyond Random Numbers</h2>

## Introduction

`@randsum/faces` is an extension of `@randsum` utilities to support non-numerical "Custom Faces" dice.

For instace, Fudge Dice are six-sided dice with two `+` sides, two `-` sides, and two blank sides.

You can use `@randsum/faces` to simulate this unconvential die in your code.

## CustomFacesD

Similar to `D` from `@randsum/dice`, `CustomFacesD` is a class that creates a rollable die.

Unlike `D`, however, `CustomFacesD` takes an array of strings - representing the faces of the dice - and its rolls return strings as well.

```ts
import {CustomFacesD} from `@randsum/faces`

const FudgeDice = new CustomFacesD(['+", "+", "-", "-", " ", " "])

FudgeDice.roll() // a random value from the provided faces
FudgeDice.rollMany(4) // an Array of strings representing the results of the roll
FudgeDice.sides // 6
FudgeDice.faces // the same array passed in to the constructor
```

## Popular Custom Faces Dice

`@randsum/faces` exports popular non-numerical dice:

- `export { FudgeDice } from '@randsum/faces'`

## `customFacesRoll`

## `validateCustomFacesNotation`

---

Made with ![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)
Written in ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
