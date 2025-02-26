import { Layers } from "@/_lib/layers";
import { LoadStatusEnum } from "@/_lib/load-status-enum";
import { CSSProperties, Dispatch, SetStateAction } from "react";

export default function SvgViewer({
  file,
  style,
  setFileLoadStatus,
  setLayoutWidth,
  setLayoutHeight,
  setPageCount,
  layers,
  setLayers,
}: {
  file: File;
  style: CSSProperties;
  setFileLoadStatus: Dispatch<SetStateAction<LoadStatusEnum>>;
  setLayoutWidth: Dispatch<SetStateAction<number>>;
  setLayoutHeight: Dispatch<SetStateAction<number>>;
  setPageCount: Dispatch<SetStateAction<number>>;
  layers: Layers;
  setLayers: (layers: Layers) => void;
}) {
  return (
    <object
      className="pointer-events-none bg-white"
      data={URL.createObjectURL(file)}
      type="image/svg+xml"
      style={style}
      onLoad={(e) => {
        const object = e.target as HTMLObjectElement;
        const svg = object.contentDocument?.querySelector("svg");

        if (!svg) {
          setFileLoadStatus(LoadStatusEnum.FAILED);
          return;
        }
        setFileLoadStatus(LoadStatusEnum.SUCCESS);
        setLayoutWidth(svg.width.baseVal.value);
        setLayoutHeight(svg.height.baseVal.value);
        setPageCount(1);
        if (Object.entries(layers).length > 0) {
          // apply visibility
          Object.entries(layers).forEach(([id, layer]) => {
            const g = svg.getElementById(id);
            if (g) {
              g.setAttribute("display", layer.visible ? "inline" : "none");
            }
          });
          return;
        }
        // get all groups at the root if the svg
        const groupLayers: Layers = {};
        svg.querySelectorAll("g").forEach((g) => {
          const title = g.querySelector("title");
          const layerName =
            title?.textContent ?? g.getAttribute("inkscape:label") ?? g.id;
          groupLayers[g.id] = {
            name: layerName,
            ids: [g.id],
            visible: g.getAttribute("display") !== "none",
          };
        });
        setLayers(groupLayers);
      }}
    ></object>
  );
}
