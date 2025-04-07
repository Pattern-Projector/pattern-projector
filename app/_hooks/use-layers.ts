import { Layers } from "@/_lib/layers";
import layersReducer, { LayerAction } from "@/_reducers/layersReducer";
import { Dispatch, useCallback, useReducer } from "react";

/**
 * Hook that stores visible layers per file name in local storage whenever there
 * is a change in visibility, and loads those values whenever the "set-layers" action
 * is dispatched.
 */
export default function useLayers(fileName: string) {
  const [layers, dispatchLayersActionInternal] = useReducer(layersReducer, {});
  const dispatchLayersAction: Dispatch<LayerAction> = useCallback(
    (action: LayerAction) => {
      dispatchLayersActionInternal(action);
      // We need to know the new layers value so we can synchronize with local storage
      let newLayers = layersReducer(layers, action);
      if (action.type === "set-layers") {
        // Layers were freshly loaded, so let's check local storage for which layers should be visible
        const visibleLayers = visibleLayersFromLocalStorage(fileName);
        if (visibleLayers != null && visibleLayers.length > 0) {
          const visibilityAction: LayerAction = {
            type: "update-visibility",
            visibleLayers: new Set(visibleLayers),
          };
          dispatchLayersActionInternal(visibilityAction);
          // We also need to update the layers data we're about to write back to local storage -
          // otherwise visible layers would reset to "everything visible"
          newLayers = layersReducer(newLayers, visibilityAction);
        }
      }
      if (newLayers == null || Object.keys(newLayers).length === 0) {
        return;
      }
      writeToLocalStorage(fileName, newLayers);
    },
    [layers, fileName],
  );
  return { layers, dispatchLayersAction };
}

function visibleLayersFromLocalStorage(fileName: string): string[] | undefined {
  return readFromLocalStorage(`visibleLayers:${fileName}`);
}

function writeToLocalStorage(fileName: string, layers: Layers) {
  localStorage.setItem(
    `visibleLayers:${fileName}`,
    JSON.stringify(
      Object.entries(layers)
        .map(([key, layer]) => (layer.visible ? key : undefined))
        .filter((x) => x != null),
    ),
  );
}

function readFromLocalStorage<T>(key: string): T | undefined {
  const rawValue = localStorage.getItem(key);
  if (rawValue == null) {
    return undefined;
  }
  try {
    return JSON.parse(rawValue);
  } catch {
    return undefined;
  }
}
