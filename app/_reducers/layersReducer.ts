import { Layers } from "@/_lib/layers";

interface SetLayersAction {
  type: "set-layers";
  layers: Layers;
}

interface UpdateVisibilityAction {
  type: "update-visibility";
  visibleLayers: Set<string>;
}

interface ToggleLayerAction {
  type: "toggle-layer";
  key: string;
}

interface HideAllAction {
  type: "hide-all";
}

interface ShowAllAction {
  type: "show-all";
}

export type LayerAction =
  | SetLayersAction
  | UpdateVisibilityAction
  | ToggleLayerAction
  | HideAllAction
  | ShowAllAction;

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
