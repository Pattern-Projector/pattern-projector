import { Layer } from "@/_lib/interfaces/layer";

export interface MenuStates {
  nav: boolean;
  layers: boolean;
  stitch: boolean;
  more: boolean;
}

export function getDefaultMenuStates(): MenuStates {
  return {
    nav: true,
    layers: false,
    stitch: false,
    more: false,
  };
}

export function getMenuStatesFromPageCount(
  menuStates: MenuStates,
  pageCount: number,
) {
  let showStitch: boolean = menuStates.stitch;
  if (pageCount === 1) {
    showStitch = false;
  } else if (pageCount > 1) {
    showStitch = true;
  }
  return { ...menuStates, stitch: showStitch };
}

export function getMenuStatesFromLayers(
  menuStates: MenuStates,
  layers: Map<string, Layer>,
) {
  let showLayers;
  if (layers.size > 0) {
    showLayers = true;
  } else {
    showLayers = false;
  }
  return { ...menuStates, layers: showLayers };
}
