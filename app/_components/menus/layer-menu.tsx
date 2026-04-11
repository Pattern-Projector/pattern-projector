import { Dispatch } from "react";
import { useTranslations } from "next-intl";
import { Layers } from "@/_lib/layers";
import { ButtonStyle, sideMenuStyles } from "@/_components/theme/styles";
import { Button } from "@/_components/buttons/button";
import { LayerAction } from "@/_reducers/layersReducer";

export default function LayerMenu({
  className,
  layers,
  dispatchLayerAction,
}: {
  className?: string | undefined;
  dispatchLayerAction: Dispatch<LayerAction>;
  layers: Layers;
}) {
  const t = useTranslations("LayerMenu");

  const someLayersVisible = Object.values(layers).some(
    (layer) => layer.visible,
  );
  const numberOfLayers = Object.entries(layers).length;
  const hasLayers = numberOfLayers > 0;

  return (
    <div
      className={`${className ?? ""} ${sideMenuStyles} ${hasLayers && numberOfLayers * 40 < 200 ? "h-fit" : "h-[calc(100vh-8rem)]"} text-sm font-medium border-top-0`}
    >
      <menu
        key="global"
        className="flex items-center justify-between w-full border-b border-gray-200 dark:border-gray-700 p-2"
      >
        <h1>{t("title")}</h1>
        <Button
          style={ButtonStyle.OUTLINE}
          onClick={() =>
            dispatchLayerAction({
              type: someLayersVisible ? "hide-all" : "show-all",
            })
          }
        >
          {someLayersVisible ? t("hideAll") : t("showAll")}
        </Button>
      </menu>

      <menu
        className={`w-full ${hasLayers && numberOfLayers * 40 > 200 ? "h-[calc(100vh-12rem)] overflow-y-auto scrollbar" : ""}`}
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
  );
}
