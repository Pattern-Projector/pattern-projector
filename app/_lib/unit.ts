export const { CM, IN } = { IN: "IN", CM: "CM" };

export function getPtDensity(unitOfMeasure: string): number {
  return unitOfMeasure === CM ? 96 / 2.54 : 96;
}
