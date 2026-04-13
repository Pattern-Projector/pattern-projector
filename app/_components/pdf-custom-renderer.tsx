// pdf-custom-renderer.tsx
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import invariant from "tiny-invariant";
import { usePageContext, useDocumentContext } from "react-pdf";

import type {
  RenderParameters,
  PDFDocumentProxy,
} from "pdfjs-dist/types/src/display/api.js";
import { PDFPageProxy } from "pdfjs-dist";
import { PDF_TO_CSS_UNITS } from "@/_lib/pixels-per-inch";
import {
  erodeImageData,
  enhanceLineQualityFast,
  recolourImageData,
  erosionFilter,
} from "@/_lib/erode";
import useRenderContext from "@/_hooks/use-render-context";

export default function CustomRenderer() {
  const {
    erosions,
    layers,
    magnifying,
    onPageRenderSuccess,
    patternScale,
    recolourHex,
    themeFilter,
  } = useRenderContext();

  const pageContext = usePageContext();
  invariant(pageContext, "Unable to find Page context.");

  const docContext = useDocumentContext();
  invariant(docContext, "Unable to find Document context.");

  const isSafari = useMemo(() => {
    const ua = navigator.userAgent.toLowerCase();
    return ua.indexOf("safari") != -1 && ua.indexOf("chrome") == -1;
  }, []);

  const useRecolour = !!recolourHex && !isSafari;

  // Chrome/Firefox: quality filter applied via ctx.filter when drawing offscreen
  // → visible canvas. Theme filter (e.g. invert for Dark) stays on the container div.
  const filter = isSafari
    ? "none"
    : erosionFilter(magnifying ? 0 : erosions, useRecolour);

  // Safari: erosion and enhancement run at pixel level, respecting magnifying.
  const renderErosions = isSafari ? (magnifying ? 0 : erosions) : 0;

  // Safari: pixel-level recolour for colour themes (Green etc). Dark theme is
  // handled by the container div's CSS filter: invert(1) — Safari supports this
  // on a div, so no need to bake it into canvas pixels.
  const safariEffectiveRecolourHex = isSafari ? recolourHex : undefined;

  const _className = pageContext._className;
  const page = pageContext.page;
  const pdf = docContext.pdf;

  const canvasElement = useRef<HTMLCanvasElement>(null);
  // Safari: back buffer canvas. page.render() writes here; processed pixels are
  // written to the visible canvas only when fully ready, preventing grey flashes.
  const backCanvas = useRef<HTMLCanvasElement | null>(null);
  // Chrome/Firefox: OffscreenCanvas as render target.
  const offscreen = useRef<OffscreenCanvas | null>(null);

  const lastLayersRef = useRef(layers);
  const layersVersionRef = useRef(0);

  const userUnit = (page as PDFPageProxy).userUnit || 1;

  invariant(page, "Unable to find page.");
  invariant(pdf, "Unable to find pdf.");

  // Safari: zero the canvas on mount so no blank rectangle is visible before
  // the first render completes.
  useLayoutEffect(() => {
    if (!isSafari) return;
    const canvas = canvasElement.current;
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }, [isSafari]);

  // Safari: when the recolour target changes (theme switch), hide the canvas
  // before the browser paints so the parent div's backgroundColor shows through
  // until the new render is ready.
  const lastSafariThemeRef = useRef("");
  const safariThemeKey = isSafari
    ? (safariEffectiveRecolourHex ?? "none")
    : "";
  useLayoutEffect(() => {
    if (!isSafari) return;
    const canvas = canvasElement.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;
    if (
      lastSafariThemeRef.current !== "" &&
      lastSafariThemeRef.current !== safariThemeKey
    ) {
      canvas.style.visibility = "hidden";
    }
    lastSafariThemeRef.current = safariThemeKey;
  }, [isSafari, safariThemeKey]);

  // Ensure back canvas for Safari pixel processing.
  if (isSafari && backCanvas.current === null) {
    backCanvas.current = document.createElement("canvas");
  }

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
    // Some iPads don't support OffscreenCanvas.
    if (!isSafari) {
      offscreen.current = new OffscreenCanvas(renderWidth, renderHeight);
    }
  }

  function drawPageOnCanvas() {
    if (!page) {
      return;
    }

    page.cleanup();

    if (lastLayersRef.current !== layers) {
      lastLayersRef.current = layers;
      layersVersionRef.current++;
    }

    // Render target:
    // - Safari: backCanvas so the visible canvas only receives finished pixels.
    // - Chrome/Firefox: offscreen canvas, then drawImage to the visible canvas.
    const canvas = isSafari
      ? backCanvas.current
      : offscreen.current ?? canvasElement.current;
    if (!canvas) {
      return;
    }

    // Size the back buffer for Safari (Chrome offscreen is sized at component
    // render time via the OffscreenCanvas constructor).
    if (canvas instanceof HTMLCanvasElement) {
      canvas.width = renderWidth;
      canvas.height = renderHeight;
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
        if (isSafari) {
          // Process pixels on the back buffer, then commit to visible canvas.
          let result = ctx.getImageData(0, 0, renderWidth, renderHeight);
          let buffer = new ImageData(renderWidth, renderHeight);
          for (let i = 0; i < renderErosions; i++) {
            erodeImageData(result, buffer);
            [result, buffer] = [buffer, result];
          }
          // Always apply quality enhancement: darkens grey anti-aliased edges
          // and boosts contrast — equivalent to push-darks + contrast(1.5).
          enhanceLineQualityFast(result);
          if (safariEffectiveRecolourHex) {
            recolourImageData(result, safariEffectiveRecolourHex);
          }
          // Write processed pixels back into the backCanvas, then draw canvas-
          // to-canvas onto the visible canvas. This keeps the visible canvas on
          // the GPU-compositing path (drawImage is hardware-accelerated;
          // putImageData directly to the visible canvas can deoptimise it).
          ctx.putImageData(result, 0, 0);
          const visibleCanvas = canvasElement.current;
          if (!visibleCanvas) return;
          if (
            visibleCanvas.width !== renderWidth ||
            visibleCanvas.height !== renderHeight
          ) {
            visibleCanvas.width = renderWidth;
            visibleCanvas.height = renderHeight;
          }
          const dest = visibleCanvas.getContext("2d", { alpha: false });
          if (dest && backCanvas.current) {
            dest.drawImage(backCanvas.current, 0, 0);
          }
          // Reveal the canvas (hidden on mount or during theme transition).
          visibleCanvas.style.visibility = "";
          lastSafariThemeRef.current = safariThemeKey;
        } else if (offscreen.current) {
          // Chrome/Firefox: draw offscreen to (JSX-sized) visible canvas with filter.
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
        // Render was cancelled
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
    magnifying,
    filter,
    safariEffectiveRecolourHex,
    recolourHex,
    renderErosions,
    renderWidth,
    renderHeight,
    isSafari,
    safariThemeKey,
    themeFilter,
    onPageRenderSuccess,
  ]);

  return (
    <canvas
      className={`${_className}__canvas`}
      ref={canvasElement}
      // Chrome/Firefox: React sets canvas pixel dimensions directly.
      // Safari: undefined — dimensions are managed in the render callback
      // (the canvas starts at 0×0 on mount and is sized when pixels are ready).
      width={isSafari ? undefined : renderWidth}
      height={isSafari ? undefined : renderHeight}
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
