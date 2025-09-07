import DesignView from "$lib/components/design/design-view.svelte"
import { createBooleanInput, createSliderInput, type OptionsList, type OptionValuesMap } from "$lib/custom-options/custom-options";
import { BaseDirectory, writeFile } from "@tauri-apps/plugin-fs";

type DesignPrintFormat = "png" | "jpeg" | "svg" | "pdf";

export interface DesignPrintOptions {
    id: string;
    name: string;
    description: string | undefined;
    format: DesignPrintFormat;
    options: OptionsList;
    optionValues: OptionValuesMap;
}

const COMMON_OPTIONS: OptionsList = [
    createBooleanInput('selectionOnly', 'Selection Only', false),
    createBooleanInput('showGrid', 'Show Grid', false),
    createSliderInput('resolutionScale', 'Resolution Scale', 1.0, 4.0, 1, 0.1, 'x'),
];

export const PRINT_OPTIONS: DesignPrintOptions[] = [
    {
        id: 'jpeg',
        name: 'JPEG Image',
        description: 'Export the design as a JPEG image.',
        format: 'jpeg',
        options: COMMON_OPTIONS.concat([
            createSliderInput('quality', 'Quality', 0, 100, 90, 1, '%'),
        ]),
        optionValues: new Map([]),
    }
];

export async function printDesign(renderCanvasFunc: ((resolutionScale?: number, selectionOnly?: boolean) => Promise<HTMLCanvasElement>), options: DesignPrintOptions) {

    const resolutionScale = options.optionValues.get('resolutionScale') as number;
    const showGrid = options.optionValues.get('showGrid') as boolean;
    const selectionOnly = options.optionValues.get('selectionOnly') as boolean;
    console.log("Print options:", options.optionValues);

    const canvas = await renderCanvasFunc(resolutionScale, selectionOnly);

    switch (options.format) {
        case "jpeg":
            printDesignAsJPEG(canvas, options);
            break;
        case "png":
            printDesignAsPNG(canvas, options);
            break;
        case "svg":
            printDesignAsSVG(canvas, options);
            break;
        default:
            throw new Error("Unsupported export format");
    }
}

async function printDesignAsJPEG(canvas: HTMLCanvasElement, options: DesignPrintOptions) {
    const quality = options.optionValues.get('quality') as number;

    const blob = await canvasToBlob(canvas, "image/jpeg", quality / 100);
    const binaryData = await blobToUint8Array(blob);
    await writeFile(
        'test_export.jpg',
         binaryData,
         { baseDir: BaseDirectory.Desktop }
    );
}

async function printDesignAsPNG(canvas: HTMLCanvasElement, options: DesignPrintOptions) {
    throw new Error("PNG export not implemented yet");
}

async function printDesignAsSVG(canvas: HTMLCanvasElement, options: DesignPrintOptions) {
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