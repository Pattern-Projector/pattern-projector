import { Layers } from "@/_lib/layers";

export type LayerAction =
  | { type: "set-layers"; layers: Layers }
  | { type: "update-visibility"; visibleLayers: Set<string> }
  | { type: "toggle-layer"; key: string }
  | { type: "hide-all" }
  | { type: "show-all" };

export default function layersReducer(
  layers: Layers,
  action: LayerAction,
): Layers {
  switch (action.type) {
    case "set-layers":
      return action.layers;
    case "update-visibility":
      return Object.fromEntries(
        Object.entries(layers).map(([key, layer]) => [
          key,
          { ...layer, visible: action.visibleLayers.has(key) },
        ]),
      );
    case "toggle-layer":
      return {
        ...layers,
        [action.key]: {
          ...layers[action.key],
          visible: !layers[action.key]?.visible,
        },
      };
    case "hide-all":
      return Object.fromEntries(
        Object.entries(layers).map(([key, layer]) => [
          key,
          { ...layer, visible: false },
        ]),
      );
    case "show-all":
      return Object.fromEntries(
        Object.entries(layers).map(([key, layer]) => [
          key,
          { ...layer, visible: true },
        ]),
      );
  }
}
