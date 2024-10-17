import { useEffect, useMemo, useRef } from "react";
import invariant from "tiny-invariant";
import { usePageContext, useDocumentContext } from "react-pdf";

import type {
  RenderParameters,
  PDFDocumentProxy,
} from "pdfjs-dist/types/src/display/api.js";
import { PDFPageProxy } from "pdfjs-dist";
import { PDF_TO_CSS_UNITS } from "@/_lib/pixels-per-inch";
import { erodeImageData, erosionFilter } from "@/_lib/erode";
import useRenderContext from "@/_hooks/use-render-context";

export default function CustomRenderer() {
  const { erosions, layers, magnifying, onPageRenderSuccess, patternScale } =
    useRenderContext();
  const pageContext = usePageContext();

  invariant(pageContext, "Unable to find Page context.");

  const docContext = useDocumentContext();

  invariant(docContext, "Unable to find Document context.");

  const isSafari = useMemo(() => {
    const ua = navigator.userAgent.toLowerCase();
    return ua.indexOf("safari") != -1 && ua.indexOf("chrome") == -1;
  }, []);
  const filter = isSafari ? "none" : erosionFilter(magnifying ? 0 : erosions);

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
        scale: getScale(
          viewport.width,
          viewport.height,
          userUnit,
          patternScale,
        ),
      }),
    [page, viewport, userUnit, patternScale],
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
      for (const layer of Object.values(layers)) {
        for (const id of layer.ids) {
          optionalContentConfig.setVisibility(id, layer.visible);
        }
      }
      return optionalContentConfig;
    }

    const ctx = canvas.getContext("2d", {
      alpha: false,
      willReadFrequently: true,
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
        onPageRenderSuccess();
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
    erosions,
    filter,
    renderErosions,
    renderWidth,
    renderHeight,
  ]);

  return (
    <canvas
      className={`${_className}__canvas`}
      ref={canvasElement}
      width={renderWidth}
      height={renderHeight}
      style={{
        width:
          Math.floor(
            viewport.width * PDF_TO_CSS_UNITS * userUnit * patternScale,
          ) + "px",
        height:
          Math.floor(
            viewport.height * PDF_TO_CSS_UNITS * userUnit * patternScale,
          ) + "px",
      }}
    />
  );
}

function getScale(
  w: number,
  h: number,
  userUnit: number,
  patternScale: number,
): number {
  const dpr = window.devicePixelRatio;
  const dpi = dpr * userUnit * PDF_TO_CSS_UNITS * patternScale;
  const renderArea = dpi * w * dpi * h;
  const maxArea = 16_777_216; // limit for iOS or Android device canvas size https://jhildenbiddle.github.io/canvas-size/#/?id=test-results
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
