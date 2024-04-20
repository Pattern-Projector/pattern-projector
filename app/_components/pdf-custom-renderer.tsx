import { useEffect, useMemo, useRef } from "react";
import invariant from "tiny-invariant";
import { usePageContext, useDocumentContext } from "react-pdf";

import type {
  RenderParameters,
  PDFDocumentProxy,
} from "pdfjs-dist/types/src/display/api.js";
import { Layer } from "@/_lib/interfaces/layer";
import { PDFPageProxy } from "pdfjs-dist";
import { PDF_TO_CSS_UNITS } from "@/_lib/pixels-per-inch";
import { erodeImageData, erosionFilter } from "@/_lib/erode";
import useRenderContext from "@/_hooks/use-render-context";

export default function CustomRenderer() {
  const { layers, setLayers, erosions, scale } = useRenderContext();
  const pageContext = usePageContext();

  invariant(pageContext, "Unable to find Page context.");

  const docContext = useDocumentContext();

  invariant(docContext, "Unable to find Document context.");

  const isSafari = useMemo(() => {
    const ua = navigator.userAgent.toLowerCase();
    return ua.indexOf("safari") != -1 && ua.indexOf("chrome") == -1;
  }, []);
  const filter = isSafari ? "none" : erosionFilter(erosions);

  // Safari does not support the feMorphology filter in CSS.
  const renderErosions = isSafari ? erosions : 0;

  const _className = pageContext._className;
  const page = pageContext.page;
  const pdf = docContext.pdf;
  const canvasElement = useRef<HTMLCanvasElement>(null);
  const offscreen = useRef<OffscreenCanvas | null>(null);
  const userUnit = (page as PDFPageProxy).userUnit || 1;

  invariant(page, "Unable to find page.");
  invariant(pdf, "Unable to find pdf.");

  const viewport = useMemo(() => page.getViewport({ scale: 1 }), [page]);

  const renderViewport = useMemo(
    () =>
      page.getViewport({
        scale: getCanvasScale(viewport.width, viewport.height, userUnit, scale),
      }),
    [page, viewport, userUnit, scale],
  );

  const renderWidth = Math.floor(renderViewport.width);
  const renderHeight = Math.floor(renderViewport.height);

  if (
    offscreen.current === null ||
    offscreen.current.width !== renderWidth ||
    offscreen.current.height !== renderHeight
  ) {
    // Some iPad's don't support OffscreenCanvas.
    if (!isSafari) {
      console.log(
        `Creating new offscreen canvas ${renderWidth}x${renderHeight} ${offscreen.current?.width}x${offscreen.current?.height} ${offscreen.current ? "replacing" : "initializing"}`,
      );
      offscreen.current = new OffscreenCanvas(renderWidth, renderHeight);
    }
  }

  function drawPageOnCanvas() {
    if (!page) {
      return;
    }

    page.cleanup();

    const canvas = offscreen.current ?? canvasElement.current;
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
          for (const entry of layers) {
            const layer = entry[1];
            for (let i = 0; i < layer.ids.length; i += 1) {
              optionalContentConfig.setVisibility(layer.ids[i], layer.visible);
            }
          }
        }
      }
      return optionalContentConfig;
    }

    const ctx = canvas.getContext("2d", {
      alpha: false,
    }) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
    if (!ctx) {
      return;
    }
    const renderContext: RenderParameters = {
      canvasContext: ctx as any,
      viewport: renderViewport,
      optionalContentConfigPromise: pdf
        ? optionalContentConfigPromise(pdf)
        : undefined,
    };

    const cancellable = page.render(renderContext);
    const runningTask = cancellable;

    cancellable.promise
      .then(() => {
        if (renderErosions > 0) {
          let result = ctx.getImageData(0, 0, renderWidth, renderHeight);
          let buffer = new ImageData(renderWidth, renderHeight);
          for (let i = 0; i < renderErosions; i++) {
            erodeImageData(result, buffer);
            [result, buffer] = [buffer, result];
          }
          ctx.putImageData(result, 0, 0);
        } else if (offscreen.current) {
          // draw offscreen canvas to onscreen canvas with filter.
          const dest = canvasElement.current?.getContext("2d");
          if (!dest) {
            return;
          }
          dest.imageSmoothingEnabled = false;
          dest.filter = filter;
          dest.drawImage(canvas, 0, 0);
        }
      })
      .catch(() => {
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
    erosions,
    filter,
    renderErosions,
    renderWidth,
    renderHeight,
    isSafari,
  ]);

  return (
    <canvas
      className={`${_className}__canvas`}
      ref={canvasElement}
      width={renderWidth}
      height={renderHeight}
      style={{
        width:
          Math.floor(viewport.width * PDF_TO_CSS_UNITS * userUnit * scale) +
          "px",
        height:
          Math.floor(viewport.height * PDF_TO_CSS_UNITS * userUnit * scale) +
          "px",
      }}
    />
  );
}

function getCanvasScale(
  w: number,
  h: number,
  userUnit: number,
  patternScale: number,
): number {
  const dpr = window.devicePixelRatio;
  const dpi = dpr * userUnit * PDF_TO_CSS_UNITS * patternScale;
  const renderArea = dpi * w * dpi * h;
  const maxArea = 5 * 16_777_216; // limit for iOS device canvas size https://jhildenbiddle.github.io/canvas-size/#/?id=test-results
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
