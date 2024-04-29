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
import { ErodeShader } from "@/_lib/erode";
import useRenderContext from "@/_hooks/use-render-context";
import * as THREE from "three";

class LineThickener {
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.Camera;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly mesh: THREE.Mesh;
  private readonly shader: THREE.Shader;
  private readonly texture: THREE.Texture;
  private readonly material: THREE.ShaderMaterial;
  private readonly geometry: THREE.PlaneBufferGeometry;

  constructor(inputCanvas: HTMLCanvasElement, outputCanvas: HTMLCanvasElement) {
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const width = inputCanvas.width;
    const height = inputCanvas.height;
    this.shader = ErodeShader(width, height, 0);
    this.material = new THREE.ShaderMaterial(this.shader);
    this.material.minFilter = THREE.NearestFilter;
    this.material.magFilter = THREE.NearestFilter;
    this.geometry = new THREE.PlaneGeometry(2, 2);
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      canvas: outputCanvas,
    });
    this.scene = new THREE.Scene();
    this.texture = new THREE.CanvasTexture(inputCanvas);
    this.shader.uniforms.tDiffuse.value = this.texture;
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  textureChanged() {
    this.texture.needsUpdate = true;
  }

  render(width: number, height: number, erosions: number) {
    this.shader.uniforms.radius.value = erosions;
    this.shader.uniforms.resolution.value.set(width, height);
    this.renderer.setSize(width, height);
    this.renderer.render(this.scene, this.camera);
  }
}

export default function CustomRenderer() {
  const { layers, setLayers, erosions } = useRenderContext();
  const pageContext = usePageContext();

  invariant(pageContext, "Unable to find Page context.");

  const docContext = useDocumentContext();

  invariant(docContext, "Unable to find Document context.");

  const _className = pageContext._className;
  const page = pageContext.page;
  const pdf = docContext.pdf;
  const canvasElement = useRef<HTMLCanvasElement>(null);
  const offscreen = useRef<HTMLCanvasElement>(null);
  const effects = useRef<LineThickener>(null);
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

  if (offscreen.current === null) {
    const canvas = document.createElement("canvas");
    offscreen.current = canvas;
  }

  function drawPageOnCanvas() {
    if (!page) {
      return;
    }

    page.cleanup();

    const source = offscreen.current;
    const dest = canvasElement.current;
    if (!source || !dest) {
      return;
    }
    source.width = renderWidth;
    source.height = renderHeight;
    const e: LineThickener = effects.current ?? new LineThickener(source, dest);
    if (!effects.current) {
      effects.current = e;
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

    const ctx = source.getContext("2d", {
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
        e.textureChanged();
        e.render(renderWidth, renderHeight, erosions);
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
