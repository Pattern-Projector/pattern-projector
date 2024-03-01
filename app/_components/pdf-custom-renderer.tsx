import {
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import invariant from "tiny-invariant";
import { usePageContext, useDocumentContext } from "react-pdf";
import usePDFLayerContext from "@/_hooks/usePDFLayerContext";

import type {
  RenderParameters,
  PDFDocumentProxy,
} from "pdfjs-dist/types/src/display/api.js";
import { Layer } from "@/_lib/layer";

export default function CustomRenderer() {
  const pageContext = usePageContext();
  const { layers, setLayers } = usePDFLayerContext();
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
  invariant(page, "Unable to find page.");
  invariant(pdf, "Unable to find pdf.");

  const viewport = useMemo(() => page.getViewport({ scale: 1 }), [page]);

  const renderViewport = useMemo(
    () =>
      page.getViewport({ scale: getScale(viewport.width, viewport.height) }),
    [page, viewport],
  );

  function drawPageOnCanvas() {
    if (!page) {
      return;
    }

    page.cleanup();

    const { current: canvas } = canvasElement;

    if (!canvas) {
      return;
    }

    async function optionalContentConfigPromise(pdf: PDFDocumentProxy) {
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

    const renderContext: RenderParameters = {
      canvasContext: canvas.getContext("2d", {
        alpha: false,
      }) as CanvasRenderingContext2D,
      viewport: renderViewport,
      optionalContentConfigPromise: pdf
        ? optionalContentConfigPromise(pdf)
        : undefined,
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

  useEffect(drawPageOnCanvas, [
    canvasElement,
    page,
    viewport,
    renderViewport,
    layers,
    pdf,
    setLayers,
  ]);

  return (
    <canvas
      className={`${_className}__canvas`}
      ref={canvasElement}
      width={Math.floor(renderViewport.width)}
      height={Math.floor(renderViewport.height)}
      style={{
        width: Math.floor(viewport.width * PDF_TO_CSS_UNITS) + "px",
        height: Math.floor(viewport.height * PDF_TO_CSS_UNITS) + "px",
      }}
    />
  );
}

function getScale(w: number, h: number): number {
  const dpr = window.devicePixelRatio;
  let renderArea = dpr * dpr * w * h;
  const maxArea = 16777216; // pdfjs
  // TODO: increase limit in pdfjs or tile support?
  // https://github.com/mozilla/pdf.js/issues/17371
  let scale = dpr;
  if (renderArea > maxArea) {
    // drop high dpi.
    scale = 1;
    renderArea = w * h;
    if (renderArea > maxArea) {
      // scale to fit
      scale = Math.sqrt(maxArea / renderArea);
    }
  }
  return scale;
}
