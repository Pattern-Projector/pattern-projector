import { Layers } from "@/_lib/layers";
import { LoadStatusEnum } from "@/_lib/load-status-enum";
import { MenuStates, getDefaultMenuStates } from "@/_lib/menu-states";
import { DxfStyles, applyDxfStyles } from "@/_lib/dxf/dxf-styles";
import {
  CSSProperties,
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
} from "react";

export default function SvgViewer({
  dataUrl,
  svgStyle,
  setFileLoadStatus,
  setLayoutWidth,
  setLayoutHeight,
  setPageCount,
  layers,
  setLayers,
  patternScale,
  setMenuStates,
  patternScaleFactor,
  dxfStyles = null,
}: {
  dataUrl: string;
  svgStyle: CSSProperties;
  setFileLoadStatus: Dispatch<SetStateAction<LoadStatusEnum>>;
  setLayoutWidth: Dispatch<SetStateAction<number>>;
  setLayoutHeight: Dispatch<SetStateAction<number>>;
  setPageCount: Dispatch<SetStateAction<number>>;
  layers: Layers;
  setLayers: (layers: Layers) => void;
  patternScale: number;
  setMenuStates: Dispatch<SetStateAction<MenuStates>>;
  patternScaleFactor: number;
  /** Set when the SVG was converted from a DXF: styles are applied live to its layers */
  dxfStyles?: DxfStyles | null;
}) {
  const objectRef = useRef<HTMLObjectElement>(null);

  const imageStyle = `
    transform: ${transformStyle(patternScaleFactor)};
    transform-origin: top left;
    background-color: white;
  `;

  function transformStyle(patternScaleFactor: number): string {
    if (patternScaleFactor === 1) {
      return "none";
    }
    return `scale(${patternScaleFactor})`;
  }
  useEffect(() => {
    const svg = objectRef.current?.contentDocument?.querySelector("svg");
    if (!svg) return;
    svg.setAttribute("style", imageStyle);
  }, [imageStyle]);

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

  useEffect(() => {
    if (!dxfStyles) return;
    const svg = objectRef.current?.contentDocument?.querySelector("svg");
    if (!svg) return;
    applyDxfStyles(svg, dxfStyles);
  }, [dxfStyles]);

  useEffect(() => {
    const svg = objectRef.current?.contentDocument?.querySelector("svg");
    if (!svg) return;
    const width = svg.width.baseVal.value;
    const height = svg.height.baseVal.value;
    if (width === 0 || height === 0) return;
    setLayoutWidth(width * patternScale);
    setLayoutHeight(height * patternScale);
  }, [objectRef, setLayoutWidth, setLayoutHeight, patternScale]);

  return (
    <object
      ref={objectRef}
      className="pointer-events-none"
      data={dataUrl}
      type="image/svg+xml"
      style={svgStyle}
      onLoad={(e) => {
        const object = e.target as HTMLObjectElement;
        const svg = object.contentDocument?.querySelector("svg");
        svg?.setAttribute("style", imageStyle);

        if (!svg) {
          setFileLoadStatus(LoadStatusEnum.FAILED);
          return;
        }
        setFileLoadStatus(LoadStatusEnum.SUCCESS);
        setLayoutWidth(svg.width.baseVal.value * patternScale);
        setLayoutHeight(svg.height.baseVal.value * patternScale);
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
        if (dxfStyles) {
          applyDxfStyles(svg, dxfStyles);
        }
        setLayers(groupLayers);
        if (Object.keys(groupLayers).length > 1) {
          // DXF patterns are often reloaded by the folder watcher; keep whichever
          // side menu is open (the DXF menu has its own layer toggles)
          if (!dxfStyles) {
            setMenuStates({ ...getDefaultMenuStates(), layers: true });
          }
        } else {
          setLayers({});
          setMenuStates(getDefaultMenuStates());
        }
      }}
    ></object>
  );
}
