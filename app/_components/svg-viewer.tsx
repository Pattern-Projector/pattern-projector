import { Layers } from "@/_lib/layers";
import { LoadStatusEnum } from "@/_lib/load-status-enum";
import {
  CSSProperties,
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
} from "react";

export default function SvgViewer({
  dataUrl,
  style,
  setFileLoadStatus,
  setLayoutWidth,
  setLayoutHeight,
  setPageCount,
  layers,
  setLayers,
}: {
  dataUrl: string;
  style: CSSProperties;
  setFileLoadStatus: Dispatch<SetStateAction<LoadStatusEnum>>;
  setLayoutWidth: Dispatch<SetStateAction<number>>;
  setLayoutHeight: Dispatch<SetStateAction<number>>;
  setPageCount: Dispatch<SetStateAction<number>>;
  layers: Layers;
  setLayers: (layers: Layers) => void;
}) {
  const objectRef = useRef<HTMLObjectElement>(null);
  useEffect(() => {
    const svg = objectRef.current?.contentDocument?.querySelector("svg");
    if (!svg) return;
    // apply visibility
    Object.entries(layers).forEach(([id, layer]) => {
      const g = svg.getElementById(id) as SVGElement;
      if (!g) return;
      g.style.display = layer.visible ? "" : "none";
    });
  }, [layers]);
  return (
    <object
      ref={objectRef}
      className="pointer-events-none bg-white"
      data={dataUrl}
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
        // get all groups at the root if the svg
        const groupLayers: Layers = {};
        Array.from(svg.querySelectorAll(`g`))
          .filter((g) => g.getAttribute("inkscape:groupmode") == "layer")
          .forEach((g) => {
            const layerName = g.getAttribute("inkscape:label") ?? g.id;
            const isVisible = getComputedStyle(g).display !== "none";
            groupLayers[g.id] = {
              name: layerName,
              ids: [g.id],
              visible: isVisible,
            };
          });
        setLayers(groupLayers);
      }}
    ></object>
  );
}
