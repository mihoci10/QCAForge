import {
	createBooleanInput,
	createSliderInput,
	type OptionsList,
	type OptionValuesMap,
} from "$lib/custom-options/custom-options";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import * as THREE from "three";
import { CellType, getPolarization, type Cell } from "$lib/Cell";
import type { CellArchitecture } from "$lib/CellArchitecture";
import type { Layer } from "$lib/Layer";
import { Set } from "typescript-collections";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";

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
	createBooleanInput("selectionOnly", "Selection Only", false),
	createBooleanInput("showGrid", "Show Grid", false),
	createSliderInput(
		"resolutionScale",
		"Resolution Scale",
		1.0,
		4.0,
		1,
		0.1,
		"x",
	),
];

export const PRINT_OPTIONS: DesignPrintOptions[] = [
	{
		id: "jpeg",
		name: "JPEG Image",
		description: "Export the design as a JPEG image.",
		format: "jpeg",
		options: COMMON_OPTIONS.concat([
			createSliderInput("quality", "Quality", 0, 100, 90, 1, "%"),
		]),
		optionValues: new Map([]),
	},
	{
		id: "svg",
		name: "SVG Vector Image",
		description: "Export the design as an editable SVG vector image.",
		format: "svg",
		options: COMMON_OPTIONS.filter((option) => option.id !== "resolutionScale"),
		optionValues: new Map([]),
	},
	{
		id: "pdf",
		name: "PDF Vector Document",
		description: "Export the design as a vector PDF document.",
		format: "pdf",
		options: COMMON_OPTIONS.filter((option) => option.id !== "resolutionScale"),
		optionValues: new Map([]),
	},
];

export async function printDesign(
	renderCanvasFunc: (
		resolutionScale?: number,
		selectionOnly?: boolean,
		showGrid?: boolean,
		clearColor?: THREE.Color,
	) => Promise<HTMLCanvasElement>,
	renderSvgFunc: (
		selectionOnly: boolean,
		showGrid: boolean,
	) => Promise<Uint8Array>,
	renderPdfFunc: (
		selectionOnly: boolean,
		showGrid: boolean,
	) => Promise<Uint8Array>,
	options: DesignPrintOptions,
) {
	const showGrid = options.optionValues.get("showGrid") as boolean;
	const selectionOnly = options.optionValues.get("selectionOnly") as boolean;
	let binaryData: Uint8Array;

	switch (options.format) {
		case "jpeg":
			binaryData = await printDesignAsJPEG(
				await renderCanvasFunc(
					options.optionValues.get("resolutionScale") as number,
					selectionOnly,
					showGrid,
					new THREE.Color(1, 1, 1),
				),
				options,
			);
			break;
		case "png":
			binaryData = await printDesignAsPNG(
				await renderCanvasFunc(
					options.optionValues.get("resolutionScale") as number,
					selectionOnly,
					showGrid,
					new THREE.Color(1, 1, 1),
				),
				options,
			);
			break;
		case "svg":
			binaryData = await renderSvgFunc(selectionOnly, showGrid);
			break;
		case "pdf":
			binaryData = await renderPdfFunc(selectionOnly, showGrid);
			break;
		default:
			throw new Error("Unsupported export format");
	}

	const fileName = await save({
		defaultPath: `design_print.${options.format}`,
		title: "Save design as",
		filters: [{ name: "Image", extensions: [options.format] }],
	});

	if (!fileName) return;

	await writeFile(fileName, binaryData);
}

async function printDesignAsJPEG(
	canvas: HTMLCanvasElement,
	options: DesignPrintOptions,
): Promise<Uint8Array> {
	const quality = options.optionValues.get("quality") as number;

	const blob = await canvasToBlob(canvas, "image/jpeg", quality / 100);
	const binaryData = await blobToUint8Array(blob);
	return binaryData;
}

async function printDesignAsPNG(
	canvas: HTMLCanvasElement,
	options: DesignPrintOptions,
): Promise<Uint8Array> {
	throw new Error("PNG export not implemented yet");
}

async function printDesignAsSVG(
	canvas: HTMLCanvasElement,
	options: DesignPrintOptions,
): Promise<Uint8Array> {
	throw new Error("SVG export not implemented yet");
}

export function designToSVG(
	layers: Layer[],
	cellArchitectures: Map<string, CellArchitecture>,
	selectedCells: Set<any>,
	selectionOnly: boolean,
	showGrid: boolean,
): Uint8Array {
	const cells: { cell: Cell; architecture: CellArchitecture; index: number; layer: number }[] = [];
	for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
		const layer = layers[layerIndex];
		if (!layer.visible) continue;
		const architecture = cellArchitectures.get(layer.cell_architecture_id);
		if (!architecture) continue;
		layer.cells.forEach((cell, index) => {
			const selected = isSelected(selectedCells, layerIndex, index);
			if (!selectionOnly || selected) cells.push({ cell, architecture, index, layer: layerIndex });
		});
	}

	const margin = 10;
	const maxSide = Math.max(...cells.map(({ architecture }) => architecture.side_length), 20);
	const minX = cells.length ? Math.min(...cells.map(({ cell }) => cell.position[0])) - maxSide / 2 - margin : -50;
	const maxX = cells.length ? Math.max(...cells.map(({ cell }) => cell.position[0])) + maxSide / 2 + margin : 50;
	const minY = cells.length ? Math.min(...cells.map(({ cell }) => cell.position[1])) - maxSide / 2 - margin : -50;
	const maxY = cells.length ? Math.max(...cells.map(({ cell }) => cell.position[1])) + maxSide / 2 + margin : 50;
	const width = maxX - minX;
	const height = maxY - minY;
	const elements: string[] = [];

	if (showGrid) {
		const gridSize = maxSide;
		for (let x = Math.floor(minX / gridSize) * gridSize; x <= maxX; x += gridSize)
			elements.push(`<path d="M ${x} ${minY} V ${maxY}" stroke="#d1d5db" stroke-width="0.5"/>`);
		for (let y = Math.floor(minY / gridSize) * gridSize; y <= maxY; y += gridSize)
			elements.push(`<path d="M ${minX} ${y} H ${maxX}" stroke="#d1d5db" stroke-width="0.5"/>`);
	}

	for (const { cell, architecture, index, layer } of cells) {
		const selected = isSelected(selectedCells, layer, index);
		const color = selected ? "#ff0000" : cellColor(cell);
		const half = architecture.side_length / 2;
		const rotation = cell.rotation || 0;
		elements.push(`<g transform="translate(${cell.position[0]} ${cell.position[1]}) rotate(${rotation})">`);
		elements.push(`<rect x="${-half}" y="${-half}" width="${architecture.side_length}" height="${architecture.side_length}" fill="none" stroke="${color}" stroke-width="1.5"/>`);
		const polarization = getPolarization(cell.dot_probability_distribution);
		const count = architecture.dot_count === 8 ? 2 : 1;
		const polarizationSum = polarization.reduce((sum, value) => sum + Math.abs(value), 0);
		const offset = (1 - polarizationSum) / (2 * count);
		for (let i = 0; i < count * 2; i++) {
			const angle = Math.PI / 4 + (Math.PI / (count * 2)) * (Math.floor(i / 2) + (i % 2) * count) + (rotation % 180 === 90 ? Math.PI / 4 : 0);
			const x = Math.cos(angle) * architecture.side_length * 0.3;
			const y = Math.sin(angle) * architecture.side_length * 0.3;
			const radius = architecture.side_length * 0.075;
			elements.push(`<circle cx="${x}" cy="${y}" r="${radius}" fill="none" stroke="${color}" stroke-width="1"/>`);
			elements.push(`<circle cx="${-x}" cy="${-y}" r="${Math.max(0.5, radius * (Math.max(0, (polarization[Math.floor(i / 2)] ?? 0) * (i % 2 ? -1 : 1)) + offset) / 0.15)}" fill="${color}"/>`);
		}
		if ([CellType.Input, CellType.Output, CellType.Fixed].includes(cell.typ) && cell.label)
			elements.push(`<text x="0" y="0" text-anchor="middle" dominant-baseline="middle" font-size="${architecture.side_length / 5}" fill="${color}">${escapeXml(cell.label)}</text>`);
		elements.push(`</g>`);
	}

	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${-maxY} ${width} ${height}" width="${width}" height="${height}"><g transform="scale(1 -1)">${elements.join("")}</g></svg>`;
	return new TextEncoder().encode(svg);
}

export async function designToPDF(
	layers: Layer[],
	cellArchitectures: Map<string, CellArchitecture>,
	selectedCells: Set<any>,
	selectionOnly: boolean,
	showGrid: boolean,
): Promise<Uint8Array> {
	const cells = collectPrintableCells(
		layers,
		cellArchitectures,
		selectedCells,
		selectionOnly,
	);
	const bounds = getDesignBounds(cells);
	const pdf = await PDFDocument.create();
	const page = pdf.addPage([bounds.width, bounds.height]);
	const font = await pdf.embedFont(StandardFonts.Helvetica);
	const toPdfPoint = (x: number, y: number) => ({
		x: x - bounds.minX,
		y: bounds.maxY - y,
	});

	page.drawRectangle({
		x: 0,
		y: 0,
		width: bounds.width,
		height: bounds.height,
		color: rgb(1, 1, 1),
	});
	if (showGrid) {
		const gridSize = bounds.maxSide;
		for (let x = Math.floor(bounds.minX / gridSize) * gridSize; x <= bounds.maxX; x += gridSize) {
			const start = toPdfPoint(x, bounds.minY);
			const end = toPdfPoint(x, bounds.maxY);
			page.drawLine({ start, end, thickness: 0.5, color: rgb(0.82, 0.84, 0.86) });
		}
		for (let y = Math.floor(bounds.minY / gridSize) * gridSize; y <= bounds.maxY; y += gridSize) {
			const start = toPdfPoint(bounds.minX, y);
			const end = toPdfPoint(bounds.maxX, y);
			page.drawLine({ start, end, thickness: 0.5, color: rgb(0.82, 0.84, 0.86) });
		}
	}

	for (const { cell, architecture, index, layer } of cells) {
		const selected = isSelected(selectedCells, layer, index);
		const color = pdfColor(selected ? "#ff0000" : cellColor(cell));
		const half = architecture.side_length / 2;
		const center = toPdfPoint(cell.position[0], cell.position[1]);
		page.drawRectangle({
			x: center.x - half,
			y: center.y - half,
			width: architecture.side_length,
			height: architecture.side_length,
			rotate: degrees(cell.rotation || 0),
			borderColor: color,
			borderWidth: 1.5,
		});

		const polarization = getPolarization(cell.dot_probability_distribution);
		const count = architecture.dot_count === 8 ? 2 : 1;
		const polarizationSum = polarization.reduce((sum, value) => sum + Math.abs(value), 0);
		const offset = (1 - polarizationSum) / (2 * count);
		for (let i = 0; i < count * 2; i++) {
			const angle = Math.PI / 4 + (Math.PI / (count * 2)) * (Math.floor(i / 2) + (i % 2) * count) + ((cell.rotation || 0) % 180 === 90 ? Math.PI / 4 : 0);
			const x = Math.cos(angle) * architecture.side_length * 0.3;
			const y = Math.sin(angle) * architecture.side_length * 0.3;
			const dot = toPdfPoint(cell.position[0] + x, cell.position[1] + y);
			const opposite = toPdfPoint(cell.position[0] - x, cell.position[1] - y);
			const radius = architecture.side_length * 0.075;
			page.drawCircle({ x: dot.x, y: dot.y, size: radius, borderColor: color, borderWidth: 1 });
			page.drawCircle({ x: opposite.x, y: opposite.y, size: Math.max(0.5, radius * (Math.max(0, (polarization[Math.floor(i / 2)] ?? 0) * (i % 2 ? -1 : 1)) + offset) / 0.15), color });
		}
		if ([CellType.Input, CellType.Output, CellType.Fixed].includes(cell.typ) && cell.label) {
			page.drawText(cell.label, { x: center.x - font.widthOfTextAtSize(cell.label, architecture.side_length / 5) / 2, y: center.y - architecture.side_length / 10, size: architecture.side_length / 5, font, color });
		}
	}
	return pdf.save();
}

function collectPrintableCells(
	layers: Layer[],
	cellArchitectures: Map<string, CellArchitecture>,
	selectedCells: Set<any>,
	selectionOnly: boolean,
) {
	const cells: { cell: Cell; architecture: CellArchitecture; index: number; layer: number }[] = [];
	for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
		const layer = layers[layerIndex];
		if (!layer.visible) continue;
		const architecture = cellArchitectures.get(layer.cell_architecture_id);
		if (!architecture) continue;
		layer.cells.forEach((cell, index) => {
			if (!selectionOnly || isSelected(selectedCells, layerIndex, index))
				cells.push({ cell, architecture, index, layer: layerIndex });
		});
	}
	return cells;
}

function getDesignBounds(cells: ReturnType<typeof collectPrintableCells>) {
	const margin = 10;
	const maxSide = Math.max(...cells.map(({ architecture }) => architecture.side_length), 20);
	const minX = cells.length ? Math.min(...cells.map(({ cell }) => cell.position[0])) - maxSide / 2 - margin : -50;
	const maxX = cells.length ? Math.max(...cells.map(({ cell }) => cell.position[0])) + maxSide / 2 + margin : 50;
	const minY = cells.length ? Math.min(...cells.map(({ cell }) => cell.position[1])) - maxSide / 2 - margin : -50;
	const maxY = cells.length ? Math.max(...cells.map(({ cell }) => cell.position[1])) + maxSide / 2 + margin : 50;
	return { minX, maxX, minY, maxY, maxSide, width: maxX - minX, height: maxY - minY };
}

function pdfColor(hex: string) {
	return rgb(parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255);
}

function cellColor(cell: Cell): string {
	if (cell.typ === CellType.Input) return "#0000ff";
	if (cell.typ === CellType.Output) return "#ffff00";
	if (cell.typ === CellType.Fixed) return "#ff8000";
	const phase = ((cell.clock_phase_shift % 360) + 360) % 360;
	if (phase < 90) return "#00ff00";
	if (phase < 180) return "#ff00ff";
	if (phase < 270) return "#00ffff";
	return "#ffffff";
}

function escapeXml(value: string): string {
	return value.replace(/[<>&'\"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[character]!);
}

function isSelected(selectedCells: Set<any>, layer: number, cell: number): boolean {
	let selected = false;
	selectedCells.forEach((index: any) => {
		if (index?.layer === layer && index?.cell === cell) selected = true;
	});
	return selected;
}

export function canvasToBlob(
	canvas: HTMLCanvasElement,
	type: "image/png" | "image/jpeg",
	quality?: number,
): Promise<Blob> {
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) =>
				blob
					? resolve(blob)
					: reject(new Error("toBlob returned null")),
			type,
			quality,
		);
	});
}

/** Blob -> Uint8Array */
export async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
	const buf = await blob.arrayBuffer();
	return new Uint8Array(buf);
}
