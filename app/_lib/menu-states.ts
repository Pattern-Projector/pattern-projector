import { Layers } from "./layers";

export interface MenuStates {
  nav: boolean;
  layers: boolean;
  stitch: boolean;
}

export function getDefaultMenuStates(): MenuStates {
  return {
    nav: true,
    layers: false,
    stitch: false,
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
  layers: Layers,
) {
  return { ...menuStates, layers: Object.keys(layers).length > 0 };
}
