export enum Unit {
  CM = "CM",
  IN = "IN",
}

export function getPtDensity(unitOfMeasure: Unit): number {
  return unitOfMeasure === Unit.CM ? 96 / 2.54 : 96;
}
