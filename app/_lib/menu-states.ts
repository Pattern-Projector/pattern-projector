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

export function getNewSideMenuStates(
  menuStates: MenuStates,
  menu: SideMenuType,
) {
  const visible = !menuStates[menu];
  let newMenuStates = { ...menuStates, [menu]: visible };
  if (visible) {
    for (const m in SideMenuType) {
      if (m !== menu) {
        newMenuStates = { ...newMenuStates, [m]: false };
      }
    }
  }

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

export function getMenuStatesFromLayers(
  menuStates: MenuStates,
  layers: Layers,
) {
  return { ...menuStates, layers: Object.keys(layers).length > 0 };
}
