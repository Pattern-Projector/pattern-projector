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

function erodeImageData(imageData: ImageData, output: ImageData) {
  const { width, height, data } = imageData;
  const erodedData = output.data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let index = (y * width + x) * 4;
      for (let i = 0; i < 3; i++) {
        erodedData[index + i] = erodeAtIndex(
          imageData,
          x,
          y,
          index,
          width,
          height,
        );
      }
      erodedData[index + 3] = 255;
    }
  }
}

function erodeAtIndex(
  imageData: ImageData,
  x: number,
  y: number,
  index: number,
  width: number,
  height: number,
): number {
  const { data } = imageData;
  let c = data[index];
  if (c !== 255) {
    return 0;
  }
  if (x > 0) {
    let n = data[index - 4];
    if (n < c) {
      c = n;
    }
  }
  if (x < width - 1) {
    let n = data[index + 4];
    if (n < c) {
      c = n;
    }
  }
  if (y > 0) {
    let n = data[index - width * 4];
    if (n < c) {
      c = n;
    }
  }
  if (y < height - 1) {
    let n = data[index + width * 4];
    if (n < c) {
      c = n;
    }
  }
  return c;
}

export default function CustomRenderer(
  setLayers: Dispatch<SetStateAction<Map<string, Layer>>>,
  layers: Map<string, Layer>,
  erosions: number,
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

    cancellable.promise
      .then(() => {
        if (erosions === 0) {
          return;
        }
        let ctx = renderContext.canvasContext;
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const erodedData = new Uint8ClampedArray(imageData.data.length);
        let output = new ImageData(
          erodedData,
          imageData.width,
          imageData.height,
        );
        for (let i = 0; i < erosions; i++) {
          erodeImageData(imageData, output);
          const temp = imageData;
          imageData = output;
          output = temp;
        }
        // put the eroded imageData back on the canvas
        ctx.putImageData(imageData, 0, 0);
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
