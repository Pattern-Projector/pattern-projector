import { Layers } from "@/_lib/layers";
import { LoadStatusEnum } from "@/_lib/load-status-enum";
import { MenuStates, getDefaultMenuStates } from "@/_lib/menu-states";
import {
  STANDARD_DPI,
  applySvgSize,
  getOriginalSvgSizeAttributes,
  guessSvgDpi,
  svgSizeNeedsDpi,
} from "@/_lib/svg-size";
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
  svgDpi,
  onSvgDpiDetected,
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
  /** DPI for SVGs whose size has no units; null when the file states real units. */
  svgDpi: number | null;
  /** Called on load with a DPI guess, or null when the file doesn't need one. */
  onSvgDpiDetected: (guessedDpi: number | null) => void;
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
    const svg = objectRef.current?.contentDocument?.querySelector("svg");
    if (!svg) return;
    applySvgSize(svg, svgDpi ?? STANDARD_DPI);
    const width = svg.width.baseVal.value;
    const height = svg.height.baseVal.value;
    if (width === 0 || height === 0) return;
    setLayoutWidth(width * patternScale);
    setLayoutHeight(height * patternScale);
  }, [objectRef, setLayoutWidth, setLayoutHeight, patternScale, svgDpi]);

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
        if (!svg) {
          setFileLoadStatus(LoadStatusEnum.FAILED);
          return;
        }
        const guessedDpi = svgSizeNeedsDpi(getOriginalSvgSizeAttributes(svg))
          ? guessSvgDpi(svg)
          : null;
        applySvgSize(svg, guessedDpi ?? STANDARD_DPI);
        onSvgDpiDetected(guessedDpi);
        svg.setAttribute("style", imageStyle);
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
        setLayers(groupLayers);
        if (Object.keys(groupLayers).length > 1) {
          setMenuStates({ ...getDefaultMenuStates(), layers: true });
        } else {
          setLayers({});
          setMenuStates(getDefaultMenuStates());
        }
      }}
    ></object>
  );
}
