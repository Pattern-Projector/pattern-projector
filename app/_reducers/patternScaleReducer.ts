import { roundTo } from "@/_lib/remove-non-digits";

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
      const n = roundTo(action.delta + Number(patternScale), 3);
      const hm = n > 0 ? n.toFixed(3) : patternScale;
      return hm;
    }
  }
}
