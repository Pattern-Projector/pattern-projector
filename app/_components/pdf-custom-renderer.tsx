import { Dispatch, SetStateAction, useEffect, useMemo, useRef } from "react";
import invariant from "tiny-invariant";
import { usePageContext, useDocumentContext } from "react-pdf";

import type { RenderParameters } from "pdfjs-dist/types/src/display/api.js";
import { Layer } from "@/_lib/layer";

export default function CustomRenderer(
  setLayers: Dispatch<SetStateAction<Map<string, Layer>>>,
  layers: Map<string, Layer>
) {
  const pageContext = usePageContext();

  invariant(pageContext, "Unable to find Page context.");

  const docContext = useDocumentContext();

  invariant(docContext, "Unable to find Document context.");

  const _className = pageContext._className;
  const page = pageContext.page;
  const pdf = docContext.pdf;
  const canvasElement = useRef<HTMLCanvasElement>(null);
  const CSS = 96.0;
  const PDF = 72.0;
  const PDF_TO_CSS_UNITS = CSS / PDF;

  const viewport = useMemo(() => {
    page.getViewport({ scale: PDF_TO_CSS_UNITS });
  }, [page, PDF_TO_CSS_UNITS]);

  function drawPageOnCanvas() {
    if (!page) {
      return;
    }

    const { current: canvas } = canvasElement;

    if (!canvas) {
      return;
    }

    async function optionalContentConfigPromise() {
      if (pdf) {
        const optionalContentConfig = await pdf.getOptionalContentConfig();
        const groups = optionalContentConfig.getGroups();
        if (groups) {
          if (layers.size === 0) {
            const l = new Map<string, Layer>();
            Object.keys(groups).forEach((key, i) => {
              l.set(key, {
                name: String(groups[key].name) ?? key,
                visible: true,
              });
              setLayers(l);
            });
          } else {
            for (let entry of layers) {
              const key = entry[0];
              const layer = entry[1];
              optionalContentConfig.setVisibility(key, layer.visible);
            }
          }
        }
        return optionalContentConfig;
      }
      return null; // Need to figure out how to create a default optionalContentConfig
    }

    const renderContext: RenderParameters = {
      canvasContext: canvas.getContext("2d", {
        alpha: false,
      }) as CanvasRenderingContext2D,
      viewport,
      optionalContentConfigPromise: optionalContentConfigPromise(),
    };

    const cancellable = page.render(renderContext);
    const runningTask = cancellable;

    cancellable.promise.catch(() => {
      // Intentionally empty
    });

    return () => {
      runningTask.cancel();
    };
  }

  useEffect(drawPageOnCanvas, [canvasElement, page, viewport, layers]);

  return (
    <canvas
      className={`${_className}__canvas`}
      height={viewport.height}
      ref={canvasElement}
      width={viewport.width}
    />
  );
}
