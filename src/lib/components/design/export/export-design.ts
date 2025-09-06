import DesignView from "$lib/components/design/design-view.svelte"
import { BaseDirectory, writeFile } from "@tauri-apps/plugin-fs";

type DesignExportFormat = "png" | "jpeg" | "svg" | "pdf";

interface BaseExportOptions {
    id: string;
    name: string;
    description: string;
    selectionOnly: boolean;
    format: DesignExportFormat;
}

interface JPEGExportOptions extends BaseExportOptions {
    format: "jpeg";
    quality: number; // 0 to 100
}

interface PNGExportOptions extends BaseExportOptions {
    format: "png";
}

interface SVGExportOptions extends BaseExportOptions {
    format: "svg";
}

type DesignExportOptions = JPEGExportOptions | PNGExportOptions | SVGExportOptions;

export async function exportDesign(renderCanvasFunc: ((resolutionScale?: number, selectionOnly?: boolean) => Promise<HTMLCanvasElement>), options: DesignExportOptions) {

    const canvas = await renderCanvasFunc(1.0, options.selectionOnly);

    switch (options.format) {
        case "jpeg":
            exportDesignAsJPEG(canvas, options);
            break;
        case "png":
            exportDesignAsPNG(canvas, options);
            break;
        case "svg":
            exportDesignAsSVG(canvas, options);
            break;
        default:
            throw new Error("Unsupported export format");
    }
}

async function exportDesignAsJPEG(canvas: HTMLCanvasElement, options: JPEGExportOptions) {
    const blob = await canvasToBlob(canvas, "image/jpeg", options.quality / 100);
    const binaryData = await blobToUint8Array(blob);
    await writeFile(
        'test_export.jpg',
         binaryData,
         { baseDir: BaseDirectory.Desktop }
    );
}

async function exportDesignAsPNG(canvas: HTMLCanvasElement, options: PNGExportOptions) {
    throw new Error("PNG export not implemented yet");
}

async function exportDesignAsSVG(canvas: HTMLCanvasElement, options: SVGExportOptions) {
    throw new Error("SVG export not implemented yet");
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: "image/png" | "image/jpeg",
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob returned null"))),
      type,
      quality
    );
  });
}

/** Blob -> Uint8Array */
export async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
    const buf = await blob.arrayBuffer();
    return new Uint8Array(buf);
}