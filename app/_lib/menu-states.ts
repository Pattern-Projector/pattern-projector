import { Layers } from "./layers";

export interface MenuStates {
  nav: boolean;
  layers: boolean;
  stitch: boolean;
  scale: boolean;
}

export enum SideMenuType {
  layers = "layers",
  stitch = "stitch",
  scale = "scale",
}

export function toggleSideMenuStates(
  menuStates: MenuStates,
  menu: SideMenuType,
) {
  const visible = !menuStates[menu];
  const newMenuStates = getDefaultMenuStates();
  newMenuStates[menu] = visible;
  return newMenuStates;
}

export function getDefaultMenuStates(): MenuStates {
  return {
    nav: true,
    layers: false,
    stitch: false,
    scale: false,
  };
}

export function getMenuStatesFromPageCount(
  menuStates: MenuStates,
  pageCount: number,
) {
  if (pageCount > 1) {
    return { nav: true, layers: false, scale: false, stitch: true };
  } else {
    return menuStates;
  }
}

export function getMenuStatesFromLayers(
  menuStates: MenuStates,
  layers: Layers,
) {
  if (menuStates.stitch) {
    return menuStates;
  } else {
    return {
      nav: true,
      stitch: false,
      scale: false,
      layers: Object.keys(layers).length > 0,
    };
  }
}

export function sideMenuOpen(menuStates: MenuStates) {
  for (const m in SideMenuType) {
    if (menuStates[m as SideMenuType]) {
      return true;
    }
  }
  return false;
}
