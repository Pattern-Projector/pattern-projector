interface DeltaAction {
  type: "delta";
  delta: number;
}

interface SetAction {
  type: "set";
  scale: number;
}

export type PatternScaleAction = DeltaAction | SetAction;

export default function PatternScaleReducer(
  patternScale: number,
  action: PatternScaleAction,
): number {
  switch (action.type) {
    case "set": {
      return action.scale;
    }
    case "delta": {
      return action.delta + patternScale;
    }
  }
}
