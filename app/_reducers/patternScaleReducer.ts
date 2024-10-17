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
      return String((action.delta + Number(patternScale)).toFixed(2));
    }
  }
}
