import { Layer } from "@/_lib/layer";
import { Dispatch, SetStateAction } from "react";

export default function LayerMenu({
  className,
  layers,
  setLayers,
}: {
  className: string | undefined;
  setLayers: Dispatch<SetStateAction<Map<string, Layer>>>;
  layers: Map<string, Layer>;
}) {
  function handleOnChange(key: string, layer: Layer) {
    layer.visible = !layer.visible;
    setLayers(new Map(layers.set(key, layer)));
  }

  return (
    <menu
      className={
        "w-48 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg absolute top-16 z-30 " +
        className
      }
    >
      {[...layers.entries()].map((e) => (
        <li key={e[0]} className="w-full border-b border-gray-200 rounded-t-lg">
          <div className="flex items-center ps-3">
            <input
              id={e[0]}
              type="checkbox"
              value=""
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
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
  );
}
