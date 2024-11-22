import { D } from '@randsum/dice'

export class CustomD {
  public sides: number
  private coreDie: D

  constructor(public faces: string[]) {
    this.sides = faces.length
    this.faces = faces
    this.coreDie = new D(this.sides)
  }

  roll(): string {
    return this.resultToFace(this.coreDie.roll())
  }

  rollMultiple(quantity: number): string[] {
    return this.coreDie.rollMultiple(quantity).map(this.resultToFace)
  }

  private resultToFace(result: number): string {
    return this.faces[result - 1]
  }
}
