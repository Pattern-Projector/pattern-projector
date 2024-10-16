import {
  MenuStates,
  SideMenuType,
  getNewSideMenuStates,
} from "@/_lib/menu-states";
import Tooltip from "../tooltip/tooltip";
import { IconButton } from "../buttons/icon-button";
import { useTranslations } from "next-intl";
import MagnifyIcon from "@/_icons/magnify-icon";
import StitchMenu from "./stitch-menu";
import ScaleMenu from "./scale-menu";
import LayerMenu from "./layer-menu";
import { Dispatch, SetStateAction } from "react";
import LayersIcon from "@/_icons/layers-icon";
import FlexWrapIcon from "@/_icons/flex-wrap-icon";
import { Layers } from "@/_lib/layers";
import { StitchSettingsAction } from "@/_reducers/stitchSettingsReducer";
import { StitchSettings } from "@/_lib/interfaces/stitch-settings";
import { LayerAction } from "@/_reducers/layersReducer";
import { PatternScaleAction } from "@/_reducers/patternScaleReducer";

export default function SideMenu({
  menuStates,
  setMenuStates,
  pageCount,
  layers,
  dispatchLayersAction,
  file,
  stitchSettings,
  dispatchStitchSettings,
  patternScale,
  dispatchPatternScaleAction,
}: {
  menuStates: MenuStates;
  setMenuStates: Dispatch<SetStateAction<MenuStates>>;
  pageCount: number;
  layers: Layers;
  dispatchLayersAction: Dispatch<LayerAction>;
  file: File | null;
  dispatchStitchSettings: Dispatch<StitchSettingsAction>;
  stitchSettings: StitchSettings;
  patternScale: number;
  dispatchPatternScaleAction: Dispatch<PatternScaleAction>;
}) {
  const sc = useTranslations("ScaleMenu");
  const h = useTranslations("Header");
  const l = useTranslations("LayerMenu");

  const numberOfLayers = Object.entries(layers).length;

  return (
    <menu className="pointer-events-auto flex w-fit">
      {/* reverse so the tooltips show on top */}
      <menu className="flex flex-col-reverse justify-end gap-2 p-2 bg-opacity-60 dark:bg-opacity-50 bg-white dark:bg-black left-0 border-b dark:border-gray-700 transition-all duration-500">
        <Tooltip description={menuStates.scale ? sc("scale") : sc("hide")}>
          <IconButton
            onClick={() =>
              setMenuStates(
                getNewSideMenuStates(menuStates, SideMenuType.scale),
              )
            }
          >
            <MagnifyIcon ariaLabel={sc("scale")} />
          </IconButton>
        </Tooltip>
        <Tooltip
          description={
            menuStates.stitch
              ? h("stitchMenuHide")
              : pageCount === 0
                ? h("stitchMenuDisabled")
                : h("stitchMenuShow")
          }
        >
          <IconButton
            disabled={pageCount === 0}
            onClick={() =>
              setMenuStates(
                getNewSideMenuStates(menuStates, SideMenuType.stitch),
              )
            }
          >
            <FlexWrapIcon
              ariaLabel={
                menuStates.stitch ? h("stitchMenuHide") : h("stitchMenuShow")
              }
            />
          </IconButton>
        </Tooltip>
        <Tooltip
          description={numberOfLayers > 0 ? l("layersOn") : l("noLayers")}
        >
          <IconButton
            onClick={() =>
              setMenuStates(
                getNewSideMenuStates(menuStates, SideMenuType.layers),
              )
            }
            disabled={numberOfLayers === 0}
          >
            <LayersIcon ariaLabel="layers" />
          </IconButton>
        </Tooltip>
      </menu>

      {menuStates.stitch && (
        <StitchMenu
          dispatchStitchSettings={dispatchStitchSettings}
          stitchSettings={stitchSettings}
          pageCount={pageCount}
          file={file}
          layers={layers}
        />
      )}
      {menuStates.scale && (
        <ScaleMenu
          patternScale={patternScale}
          dispatchPatternScaleAction={dispatchPatternScaleAction}
        />
      )}
      {menuStates.layers && (
        <LayerMenu dispatchLayerAction={dispatchLayersAction} layers={layers} />
      )}
    </menu>
  );
}
