interface DeltaAction {
  type: "delta";
  delta: number;
}

interface SetAction {
  type: "set";
  scale: string;
}

export type PatternScaleAction = DeltaAction | SetAction;

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
