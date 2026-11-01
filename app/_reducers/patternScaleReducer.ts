export type PatternScaleAction =
  | { type: "delta"; delta: number }
  | { type: "set"; scale: string };

export default function PatternScaleReducer(
  patternScale: string,
  action: PatternScaleAction,
): string {
  switch (action.type) {
    case "set": {
      return action.scale;
    }
    case "delta": {
      const n = action.delta + Number(patternScale);
      const hm = n > 0 ? String(n.toFixed(2)) : patternScale;
      return hm;
    }
  }
}
