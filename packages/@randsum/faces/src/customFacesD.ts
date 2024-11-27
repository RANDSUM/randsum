import { D } from '@randsum/dice'
import { resultToFaces } from './utils/resultToFaces'
import type { CustomFacesRollConfig } from './types'

export class CustomFacesD {
  public sides: number
  private coreDie: D

  constructor(public faces: string[]) {
    this.sides = faces.length
    this.faces = faces
    this.coreDie = new D(this.sides)
  }

  toRollConfig(): CustomFacesRollConfig {
    return {
      sides: this.sides,
      quantity: 1,
      faces: this.faces
    }
  }

  roll(): string {
    return resultToFaces(this.coreDie.roll(), this.faces)
  }

  rollMany(quantity: number): string[] {
    return this.coreDie
      .rollMany(quantity)
      .map((value) => resultToFaces(value, this.faces))
  }
}
