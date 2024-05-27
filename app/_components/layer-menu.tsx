import { Layer } from "@/_lib/interfaces/layer";
import { Dispatch, SetStateAction, useMemo } from "react";
import { IconButton } from "@/_components/buttons/icon-button";
import { useTranslations } from "next-intl";
import KeyboardArrowLeftIcon from "@/_icons/keyboard-arrow-left";
import Tooltip from "./tooltip/tooltip";
import LayersIcon from "@/_icons/layers-icon";

export default function LayerMenu({
  className,
  layers,
  setLayers,
  visible,
  setVisible,
}: {
  className?: string | undefined;
  setLayers: Dispatch<SetStateAction<Map<string, Layer>>>;
  layers: Map<string, Layer>;
  visible: boolean;
  setVisible: (visible: boolean) => void;
}) {
  const t = useTranslations("LayerMenu");

  function handleOnChange(key: string, layer: Layer) {
    layer.visible = !layer.visible;
    setLayers(new Map(layers.set(key, layer)));
  }

  const globalCheck = useMemo((): boolean => {
    const layerArray = [...layers.entries()];
    return layerArray.filter((e) => e[1].visible).length === layerArray.length;
  }, [layers]);

  function handleGlobalChange(checked: boolean) {
    const newMap = new Map();
    layers.forEach((value, key) => {
      value.visible = checked;
      newMap.set(key, value);
    });
    setLayers(newMap);
  }

  return (
    <>
      <div
        className={`${className ?? ""} absolute z-20 ${visible ? "left-0" : "-left-60"} w-48 ${layers.size > 0 && layers.size * 40 < 200 ? "h-fit" : "h-[calc(100vh-12rem)]"}  text-sm font-medium text-gray-900 dark:text-white bg-white dark:bg-black border border-gray-200 dark:border-gray-700 border-top-0 absolute transition-all duration-700`}
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
              onClick={() => handleGlobalChange(!globalCheck)}
            >
              {globalCheck ? t("hideAll") : t("showAll")}
            </button>
          </div>
        </h1>

        <menu
          className={`w-full ${layers.size > 0 && layers.size * 40 > 200 ? "h-[calc(100vh-15rem)] overflow-y-auto scrollbar" : ""}`}
        >
          {[...layers.entries()].map((e) => (
            <li key={e[0]} className="w-full  rounded-t-lg">
              <div className="flex items-center ps-3">
                <input
                  id={e[0]}
                  type="checkbox"
                  className="w-4 h-4 accent-purple-600  rounded focus:ring-blue-500 dark:focus:ring-blue-800"
                  checked={e[1].visible}
                  onChange={() => handleOnChange(e[0], e[1])}
                ></input>
                <label
                  htmlFor={e[0]}
                  className="w-full py-3 ms-2 text-sm font-medium text-gray-90"
                >
                  {e[1].name}
                </label>
              </div>
            </li>
          ))}
        </menu>
      </div>
      {!visible ? (
        <Tooltip
          description={layers.size > 0 ? t("layersOn") : t("noLayers")}
          className="m-2 w-10 !absolute z-10"
        >
          <IconButton
            border={true}
            onClick={() => setVisible(true)}
            disabled={layers.size === 0}
          >
            <LayersIcon ariaLabel="layers" />
          </IconButton>
        </Tooltip>
      ) : null}
    </>
  );
}
