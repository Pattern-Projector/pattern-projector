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
import { erode, erodeImageData, erosionFilter } from "@/_lib/erode";
import useRenderContext from "@/_hooks/use-render-context";

export default function CustomRenderer() {
  const { layers, setLayers, erosions } = useRenderContext();
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
        scale: getScale(viewport.width, viewport.height, userUnit),
      }),
    [page, viewport, userUnit],
  );

  const renderWidth = Math.floor(renderViewport.width);
  const renderHeight = Math.floor(renderViewport.height);

  if (
    offscreen.current === null ||
    offscreen.current.width !== renderWidth ||
    offscreen.current.height !== renderHeight
  ) {
    console.log(
      `Creating new offscreen canvas ${renderWidth}x${renderHeight} ${offscreen.current?.width}x${offscreen.current?.height} ${offscreen.current ? "replacing" : "initializing"}`,
    );
    offscreen.current = new OffscreenCanvas(renderWidth, renderHeight);
  }

  function drawPageOnCanvas() {
    if (!page) {
      return;
    }

    page.cleanup();

    const canvas = offscreen.current;
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

    const renderContext: RenderParameters = {
      canvasContext: canvas.getContext("2d", {
        alpha: false,
      }) as any,
      viewport: renderViewport,
      optionalContentConfigPromise: pdf
        ? optionalContentConfigPromise(pdf)
        : undefined,
    };

    renderContext.canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    renderContext.canvasContext.imageSmoothingEnabled = false;
    const cancellable = page.render(renderContext);
    const runningTask = cancellable;

    cancellable.promise
      .then(() => {
        const dest = canvasElement.current?.getContext("2d");
        if (!dest) {
          return;
        }
        dest.imageSmoothingEnabled = false;
        if (renderErosions > 0) {
          let input = renderContext.canvasContext.getImageData(
            0,
            0,
            renderWidth,
            renderHeight,
          );
          if (true) {
            console.log(`eroding new ${renderErosions} times`);
            erode(input, renderErosions);
          } else {
            console.log(`eroding old ${renderErosions} times`);
            let output = dest.getImageData(0, 0, renderWidth, renderHeight);
            for (let i = 0; i < renderErosions; i++) {
              erodeImageData(input, output);
              [input, output] = [output, input];
            }
          }
          dest.putImageData(input, 0, 0);
        } else {
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
  ]);

  return (
    <canvas
      className={`${_className}__canvas`}
      ref={canvasElement}
      width={renderWidth}
      height={renderHeight}
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
