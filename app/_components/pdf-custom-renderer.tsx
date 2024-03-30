import { Dispatch, SetStateAction, useEffect, useMemo, useRef } from "react";
import invariant from "tiny-invariant";
import { usePageContext, useDocumentContext } from "react-pdf";

import type {
  RenderParameters,
  PDFDocumentProxy,
} from "pdfjs-dist/types/src/display/api.js";
import { Layer } from "@/_lib/layer";
import { PDFPageProxy } from "pdfjs-dist";
import { PDF_TO_CSS_UNITS } from "@/_lib/pixels-per-inch";

export default function CustomRenderer(
  setLayers: Dispatch<SetStateAction<Map<string, Layer>>>,
  layers: Map<string, Layer>,
) {
  const pageContext = usePageContext();

  invariant(pageContext, "Unable to find Page context.");

  const docContext = useDocumentContext();

  invariant(docContext, "Unable to find Document context.");

  const _className = pageContext._className;
  const page = pageContext.page;
  const pdf = docContext.pdf;
  const canvasElement = useRef<HTMLCanvasElement>(null);
  const userUnit = (page as PDFPageProxy).userUnit || 1;

  invariant(page, "Unable to find page.");
  invariant(pdf, "Unable to find pdf.");

  const viewport = useMemo(() => page.getViewport({ scale: 1 }), [page]);

  const renderViewport = useMemo(
    () =>
      page.getViewport({
        scale: getScale(viewport.width, viewport.height, userUnit),
      }),
    [page, viewport, userUnit],
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
          Object.keys(groups).forEach((key) => {
            const name = String(groups[key].name) ?? key;
            const existing = l.get(name);
            if (existing) {
              existing.ids.push(key);
              l.set(name, existing);
            } else {
              l.set(name, {
                name,
                ids: [key],
                visible: true,
              });
            }
            setLayers(l);
          });
        } else {
          for (let entry of layers) {
            const layer = entry[1];
            for (let i = 0; i < layer.ids.length; i += 1) {
              optionalContentConfig.setVisibility(layer.ids[i], layer.visible);
            }
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
        width: Math.floor(viewport.width * PDF_TO_CSS_UNITS * userUnit) + "px",
        height:
          Math.floor(viewport.height * PDF_TO_CSS_UNITS * userUnit) + "px",
      }}
    />
  );
}

function getScale(w: number, h: number, userUnit: number): number {
  const dpr = window.devicePixelRatio;
  const dpi = dpr * userUnit * PDF_TO_CSS_UNITS;
  const renderArea = dpi * w * dpi * h;
  const maxArea = 16_777_216; // limit for iOS device canvas size https://jhildenbiddle.github.io/canvas-size/#/?id=test-results
  let scale = dpi;
  if (renderArea > maxArea) {
    // scale to fit max area.
    scale = Math.sqrt(maxArea / (w * h));
    console.log(
      `Canvas area ${renderArea} exceeds max area ${maxArea}, scaling by ${scale} instead.`,
    );
  }
  return scale;
}
