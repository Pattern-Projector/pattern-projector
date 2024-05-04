import { useEffect, useMemo, useRef } from "react";
import invariant from "tiny-invariant";
import { usePageContext, useDocumentContext } from "react-pdf";
import type { OptionalContentConfig } from "pdfjs-dist/types/src/display/optional_content_config";
import type { RenderParameters } from "pdfjs-dist/types/src/display/api.js";
import { erodeImageData, erosionFilter } from "@/_lib/erode";
import useRenderContext from "@/_hooks/use-render-context";

export default function PageTileRenderer({
  optionalContentConfigPromise,
  renderScale,
  canvasWidth,
  canvasHeight,
  cssWidth,
  cssHeight,
  tx,
  ty,
}: {
  optionalContentConfigPromise: Promise<OptionalContentConfig>;
  renderScale: number;
  canvasWidth: number;
  canvasHeight: number;
  cssWidth: number;
  cssHeight: number;
  tx: number;
  ty: number;
}) {
  const { layers, erosions } = useRenderContext();
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

  invariant(page, "Unable to find page.");
  invariant(pdf, "Unable to find pdf.");

  const renderWidth = Math.floor(canvasWidth);
  const renderHeight = Math.floor(canvasHeight);

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

    const canvas = offscreen.current ?? canvasElement.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d", {
      alpha: false,
    }) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
    if (!ctx) {
      return;
    }

    const renderContext: RenderParameters = {
      canvasContext: ctx as any,
      viewport: page.getViewport({ scale: renderScale }),
      optionalContentConfigPromise,
      transform: [1, 0, 0, 1, tx, ty],
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
    renderScale,
    layers,
    pdf,
    renderWidth,
    renderHeight,
    isSafari,
    optionalContentConfigPromise,
    tx,
    ty,
    renderErosions,
    filter,
  ]);

  return (
    <canvas
      className={`${_className}__canvas`}
      ref={canvasElement}
      width={renderWidth}
      height={renderHeight}
      style={{
        width: Math.floor(cssWidth) + "px",
        height: Math.floor(cssHeight) + "px",
      }}
    />
  );
}
