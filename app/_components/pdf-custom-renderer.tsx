import { useEffect, useMemo, useRef } from "react";
import invariant from "tiny-invariant";
import { pdfjs, useDocumentContext, usePageContext } from "react-pdf";

import type { RenderParameters } from "pdfjs-dist/types/src/display/api.js";
import { OptionalContentConfig } from "pdfjs-dist/types/web/pdf_viewer";

export default function CustomRenderer() {
  const pageContext = usePageContext();
  const docContext = useDocumentContext();

  invariant(pageContext, "Unable to find Page context.");

  const { _className, page, rotate, scale } = pageContext;
  const { pdf } = docContext;

  invariant(
    page,
    "Attempted to render page canvas, but no page was specified.",
  );

  const canvasElement = useRef<HTMLCanvasElement>(null);

  const viewport = useMemo(
    () => page.getViewport({ scale, rotation: rotate }),
    [page, rotate, scale],
  );

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
          Object.keys(groups).forEach((key, i) => {
            if (i > 5) {
              // Hiding all layers after the first 6 layers
              optionalContentConfig.setVisibility(key, false); // Hide the layer
            }
          });
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

  useEffect(drawPageOnCanvas, [canvasElement, page, viewport]);

  return (
    <canvas
      className={`${_className}__canvas`}
      height={viewport.height}
      ref={canvasElement}
      width={viewport.width}
    />
  );
}
