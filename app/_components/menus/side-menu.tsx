import {
  MenuStates,
  SideMenuType,
  toggleSideMenuStates,
} from "@/_lib/menu-states";
import Tooltip from "@/_components/tooltip/tooltip";
import { IconButton } from "@/_components/buttons/icon-button";
import { useTranslations } from "next-intl";
import StitchMenu from "@/_components/menus/stitch-menu";
import ScaleMenu from "@/_components/menus/scale-menu";
import LayerMenu from "@/_components/menus/layer-menu";
import { Dispatch, SetStateAction } from "react";
import LayersIcon from "@/_icons/layers-icon";
import FlexWrapIcon from "@/_icons/flex-wrap-icon";
import { Layers } from "@/_lib/layers";
import { StitchSettingsAction } from "@/_reducers/stitchSettingsReducer";
import { StitchSettings } from "@/_lib/interfaces/stitch-settings";
import { LayerAction } from "@/_reducers/layersReducer";
import { PatternScaleAction } from "@/_reducers/patternScaleReducer";
import TuneIcon from "@/_icons/tune-icon";

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
  patternScale: string;
  dispatchPatternScaleAction: Dispatch<PatternScaleAction>;
}) {
  const sc = useTranslations("ScaleMenu");
  const h = useTranslations("Header");
  const l = useTranslations("LayerMenu");

  const numberOfLayers = Object.entries(layers).length;
  const disableStitchMenu =
    pageCount === 0 || file?.name.toLocaleUpperCase().endsWith(".SVG");

  return (
    <menu className="pointer-events-auto flex w-fit">
      {/* reverse so the tooltips show on top */}
      <menu className="w-16 flex flex-col-reverse justify-end gap-2 p-2 bg-opacity-60 dark:bg-opacity-50 bg-white dark:bg-black left-0 border-b border-r dark:border-gray-700 transition-all duration-500">
        <Tooltip description={menuStates.scale ? sc("hide") : sc("show")}>
          <IconButton
            active={menuStates.scale}
            onClick={() =>
              setMenuStates(
                toggleSideMenuStates(menuStates, SideMenuType.scale),
              )
            }
          >
            <TuneIcon ariaLabel={menuStates.scale ? sc("hide") : sc("show")} />
          </IconButton>
        </Tooltip>

        <Tooltip
          // to make button underneath clickable
          className="pointer-events-none"
          description={
            numberOfLayers > 0
              ? menuStates.layers
                ? l("layersOff")
                : l("layersOn")
              : l("noLayers")
          }
        >
          <IconButton
            className="pointer-events-auto"
            active={menuStates.layers}
            onClick={() =>
              setMenuStates(
                toggleSideMenuStates(menuStates, SideMenuType.layers),
              )
            }
            disabled={numberOfLayers === 0}
          >
            <LayersIcon ariaLabel="layers" />
          </IconButton>
        </Tooltip>

        <Tooltip
          className="pointer-events-none"
          description={
            menuStates.stitch
              ? h("stitchMenuHide")
              : disableStitchMenu
                ? h("stitchMenuDisabled")
                : h("stitchMenuShow")
          }
        >
          <IconButton
            className="pointer-events-auto"
            active={menuStates.stitch}
            disabled={disableStitchMenu}
            onClick={() =>
              setMenuStates(
                toggleSideMenuStates(menuStates, SideMenuType.stitch),
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
