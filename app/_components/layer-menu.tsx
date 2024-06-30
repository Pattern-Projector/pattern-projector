import { Dispatch } from "react";
import { IconButton } from "@/_components/buttons/icon-button";
import { useTranslations } from "next-intl";
import KeyboardArrowLeftIcon from "@/_icons/keyboard-arrow-left";
import Tooltip from "./tooltip/tooltip";
import LayersIcon from "@/_icons/layers-icon";
import { Layers } from "@/_lib/layers";
import { LayerAction } from "@/_reducers/layersReducer";

export default function LayerMenu({
  className,
  layers,
  dispatchLayerAction,
  visible,
  setVisible,
}: {
  className?: string | undefined;
  dispatchLayerAction: Dispatch<LayerAction>;
  layers: Layers;
  visible: boolean;
  setVisible: (visible: boolean) => void;
}) {
  const t = useTranslations("LayerMenu");

  const allLayersVisible = Object.values(layers).every(
    (layer) => layer.visible,
  );
  const numberOfLayers = Object.entries(layers).length;
  const hasLayers = numberOfLayers > 0;

  return (
    <>
      <div
        className={`${className ?? ""} absolute z-20 ${visible ? "left-0" : "-left-60"} w-48 ${hasLayers && numberOfLayers * 40 < 200 ? "h-fit" : "h-[calc(100vh-12rem)]"}  text-sm font-medium text-gray-900 dark:text-white bg-white dark:bg-black border border-gray-200 dark:border-gray-700 border-top-0 absolute transition-all duration-700`}
      >
        <h1
          key="global"
          className="w-full rounded-t-lg border-b border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-between">
            <IconButton onClick={() => setVisible(false)}>
              <KeyboardArrowLeftIcon ariaLabel="close" />
            </IconButton>
            <h6 className="ml-2">{t("title")}</h6>
            <button
              className="text-purple-600 ml-auto px-4 hover:text-purple-800 "
              onClick={() =>
                dispatchLayerAction({
                  type: allLayersVisible ? "hide-all" : "show-all",
                })
              }
            >
              {allLayersVisible ? t("hideAll") : t("showAll")}
            </button>
          </div>
        </h1>

        <menu
          className={`w-full ${hasLayers && numberOfLayers * 40 > 200 ? "h-[calc(100vh-15rem)] overflow-y-auto scrollbar" : ""}`}
        >
          {Object.entries(layers).map(([key, layer]) => (
            <li key={key} className="w-full  rounded-t-lg">
              <div className="flex items-center ps-3">
                <input
                  id={key}
                  type="checkbox"
                  className="w-4 h-4 accent-purple-600  rounded focus:ring-blue-500 dark:focus:ring-blue-800"
                  checked={layer.visible}
                  onChange={() =>
                    dispatchLayerAction({ type: "toggle-layer", key })
                  }
                ></input>
                <label
                  htmlFor={key}
                  className="w-full py-3 ms-2 text-sm font-medium text-gray-90"
                >
                  {layer.name}
                </label>
              </div>
            </li>
          ))}
        </menu>
      </div>
      {!visible ? (
        <Tooltip
          description={hasLayers ? t("layersOn") : t("noLayers")}
          className="m-2 w-10 !absolute z-10"
        >
          <IconButton
            border={true}
            onClick={() => setVisible(true)}
            disabled={!hasLayers}
          >
            <LayersIcon ariaLabel="layers" />
          </IconButton>
        </Tooltip>
      ) : null}
    </>
  );
}
