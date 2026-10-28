import {
	createBooleanInput,
	createSliderInput,
	type OptionsList,
	type OptionValuesMap,
} from "$lib/custom-options/custom-options";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { lastDirectoryManager } from "$lib/last-directory";
import * as THREE from "three";
import {
	CellIndex,
	CellType,
	getPolarization,
	polarizationToString,
	type Cell,
} from "$lib/Cell";
import type { CellArchitecture } from "$lib/CellArchitecture";
import type { Layer } from "$lib/Layer";
import { Set } from "typescript-collections";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";

type DesignPrintFormat = "jpeg" | "svg" | "pdf";

// Colors match the paper theme (drawableFragmentSrc, paper-geometry.ts).
const DOT_COLOR_HEX = "#374151";
const DOT_COLOR_RGB = pdfColor(DOT_COLOR_HEX);
const SELECTED_COLOR_HEX = "#e51919";
const CELL_FILL_SCALE = 0.97;
const CELL_CORNER_RATIO = 0.1;

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
		options: COMMON_OPTIONS.filter(
			(option) => option.id !== "resolutionScale",
		),
		optionValues: new Map([]),
	},
	{
		id: "pdf",
		name: "PDF Vector Document",
		description: "Export the design as a vector PDF document.",
		format: "pdf",
		options: COMMON_OPTIONS.filter(
			(option) => option.id !== "resolutionScale",
		),
		optionValues: new Map([]),
	},
];

export interface PrintableDesign {
	layers: Layer[];
	cellArchitectures: Map<string, CellArchitecture>;
	selectedCells: Set<CellIndex>;
}

export async function printDesign(
	renderCanvasFunc: (
		resolutionScale?: number,
		selectionOnly?: boolean,
		showGrid?: boolean,
		clearColor?: THREE.Color,
	) => Promise<HTMLCanvasElement>,
	design: PrintableDesign,
	options: DesignPrintOptions,
	designName: string = "design_print",
) {
	const fileName = await save({
		defaultPath: await lastDirectoryManager.defaultPath(
			"figure",
			`${designName}.${options.format}`,
		),
		title: "Save design as",
		filters: [{ name: "Image", extensions: [options.format] }],
	});
	if (!fileName) return;

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
		case "svg":
			binaryData = designToSVG(design, selectionOnly, showGrid);
			break;
		case "pdf":
			binaryData = await designToPDF(design, selectionOnly, showGrid);
			break;
		default:
			throw new Error("Unsupported export format");
	}

	await writeFile(fileName, binaryData);
	await lastDirectoryManager.setDirectoryFromFilePath("figure", fileName);
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

export function designToSVG(
	design: PrintableDesign,
	selectionOnly: boolean,
	showGrid: boolean,
): Uint8Array {
	const cells = collectPrintableCells(design, selectionOnly);
	const { minX, maxY, width, height, ...bounds } = getDesignBounds(cells);
	const elements: string[] = [];

	if (showGrid)
		for (const [x1, y1, x2, y2] of gridLines({ minX, maxY, ...bounds }))
			elements.push(
				`<path d="M ${x1} ${y1} L ${x2} ${y2}" stroke="#d1d5db" stroke-width="0.5"/>`,
			);

	for (const printable of cells) {
		const { cell } = printable;
		const figure = cellFigure(printable);
		// Dot positions are already rotated; only rotate the outline.
		elements.push(
			`<g transform="translate(${cell.position[0]} ${cell.position[1]})">`,
		);
		elements.push(
			`<path d="${figure.outline}" transform="rotate(${figure.rotation})" fill="${figure.color}"/>`,
		);
		for (const dot of figure.dots) {
			elements.push(
				`<circle cx="${dot.x}" cy="${dot.y}" r="${figure.holeRadius}" fill="#ffffff"/>`,
			);
			elements.push(
				`<circle cx="${dot.x}" cy="${dot.y}" r="${dot.radius}" fill="${DOT_COLOR_HEX}"/>`,
			);
		}
		// The whole drawing is flipped to a y-up frame; flip text back upright.
		for (const label of figure.labels)
			elements.push(
				`<text x="0" y="${-label.y}" transform="scale(1 -1)" text-anchor="middle" dominant-baseline="middle" font-size="${figure.fontSize}" fill="${figure.labelColor}">${escapeXml(label.text)}</text>`,
			);
		elements.push(`</g>`);
	}

	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${-maxY} ${width} ${height}" width="${width}" height="${height}"><g transform="scale(1 -1)">${elements.join("")}</g></svg>`;
	return new TextEncoder().encode(svg);
}

export async function designToPDF(
	design: PrintableDesign,
	selectionOnly: boolean,
	showGrid: boolean,
): Promise<Uint8Array> {
	const cells = collectPrintableCells(design, selectionOnly);
	const bounds = getDesignBounds(cells);
	const pdf = await PDFDocument.create();
	const page = pdf.addPage([bounds.width, bounds.height]);
	const font = await pdf.embedFont(StandardFonts.Helvetica);
	const toPdfPoint = (x: number, y: number) => ({
		x: x - bounds.minX,
		y: y - bounds.minY,
	});

	page.drawRectangle({
		x: 0,
		y: 0,
		width: bounds.width,
		height: bounds.height,
		color: rgb(1, 1, 1),
	});
	if (showGrid)
		for (const [x1, y1, x2, y2] of gridLines(bounds))
			page.drawLine({
				start: toPdfPoint(x1, y1),
				end: toPdfPoint(x2, y2),
				thickness: 0.5,
				color: rgb(0.82, 0.84, 0.86),
			});

	for (const printable of cells) {
		const { cell } = printable;
		const figure = cellFigure(printable);
		const center = toPdfPoint(cell.position[0], cell.position[1]);
		page.drawSvgPath(figure.outline, {
			x: center.x,
			y: center.y,
			rotate: degrees(figure.rotation),
			color: pdfColor(figure.color),
		});
		for (const dot of figure.dots) {
			const dotCenter = { x: center.x + dot.x, y: center.y + dot.y };
			page.drawCircle({
				...dotCenter,
				size: figure.holeRadius,
				color: rgb(1, 1, 1),
			});
			page.drawCircle({
				...dotCenter,
				size: dot.radius,
				color: DOT_COLOR_RGB,
			});
		}
		const labelColor = pdfColor(figure.labelColor);
		for (const label of figure.labels) {
			const width = font.widthOfTextAtSize(label.text, figure.fontSize);
			page.drawText(label.text, {
				x: center.x - width / 2,
				y: center.y + label.y - figure.fontSize / 2,
				size: figure.fontSize,
				font,
				color: labelColor,
			});
		}
	}
	return pdf.save();
}

interface PrintableCell {
	cell: Cell;
	architecture: CellArchitecture;
	selected: boolean;
}

function collectPrintableCells(
	{ layers, cellArchitectures, selectedCells }: PrintableDesign,
	selectionOnly: boolean,
): PrintableCell[] {
	const cells: PrintableCell[] = [];
	layers.forEach((layer, layerIndex) => {
		if (!layer.visible) return;
		const architecture = cellArchitectures.get(layer.cell_architecture_id);
		if (!architecture) return;
		layer.cells.forEach((cell, index) => {
			const selected = selectedCells.contains(
				new CellIndex(layerIndex, index),
			);
			if (!selectionOnly || selected)
				cells.push({ cell, architecture, selected });
		});
	});
	return cells;
}

interface DesignBounds {
	minX: number;
	maxX: number;
	minY: number;
	maxY: number;
	maxSide: number;
	width: number;
	height: number;
}

function getDesignBounds(cells: PrintableCell[]): DesignBounds {
	const margin = 10;
	let maxSide = 20;
	let minX = Infinity,
		maxX = -Infinity,
		minY = Infinity,
		maxY = -Infinity;
	for (const { cell, architecture } of cells) {
		maxSide = Math.max(maxSide, architecture.side_length);
		minX = Math.min(minX, cell.position[0]);
		maxX = Math.max(maxX, cell.position[0]);
		minY = Math.min(minY, cell.position[1]);
		maxY = Math.max(maxY, cell.position[1]);
	}
	if (!cells.length) {
		[minX, maxX, minY, maxY] = [-50, 50, -50, 50];
	} else {
		const pad = maxSide / 2 + margin;
		[minX, maxX, minY, maxY] = [
			minX - pad,
			maxX + pad,
			minY - pad,
			maxY + pad,
		];
	}
	return {
		minX,
		maxX,
		minY,
		maxY,
		maxSide,
		width: maxX - minX,
		height: maxY - minY,
	};
}

function gridLines(bounds: DesignBounds): [number, number, number, number][] {
	const { minX, maxX, minY, maxY, maxSide: gridSize } = bounds;
	const lines: [number, number, number, number][] = [];
	for (
		let x = Math.floor(minX / gridSize) * gridSize;
		x <= maxX;
		x += gridSize
	)
		lines.push([x, minY, x, maxY]);
	for (
		let y = Math.floor(minY / gridSize) * gridSize;
		y <= maxY;
		y += gridSize
	)
		lines.push([minX, y, maxX, y]);
	return lines;
}

/** Cell drawing data in local coordinates (y up, centered on the cell). */
function cellFigure({ cell, architecture, selected }: PrintableCell) {
	const color = selected ? SELECTED_COLOR_HEX : cellColor(cell);
	const rotation = cell.rotation || 0;
	const filledSide = architecture.side_length * CELL_FILL_SCALE;

	const polarization = getPolarization(cell.dot_probability_distribution);
	const count = architecture.dot_count === 8 ? 2 : 1;
	const polarizationSum = polarization.reduce(
		(sum, value) => sum + Math.abs(value),
		0,
	);
	const offset = (1 - polarizationSum) / (2 * count);
	const holeRadius = architecture.side_length * 0.075;
	const dots: { x: number; y: number; radius: number }[] = [];
	for (let i = 0; i < count * 2; i++) {
		const angle =
			Math.PI / 4 +
			(Math.PI / (count * 2)) * (Math.floor(i / 2) + (i % 2) * count) +
			(rotation % 180 === 90 ? Math.PI / 4 : 0);
		const x = Math.cos(angle) * architecture.side_length * 0.3;
		const y = Math.sin(angle) * architecture.side_length * 0.3;
		const dotFraction =
			Math.max(
				0,
				(polarization[Math.floor(i / 2)] ?? 0) * (i % 2 ? -1 : 1),
			) + offset;
		const radius = Math.max(0.5, holeRadius * dotFraction);
		dots.push({ x, y, radius }, { x: -x, y: -y, radius });
	}

	const lines = getCellLabelLines(cell);
	const fontSize = architecture.side_length / 5;
	const lineHeight = fontSize * 1.15;
	const totalHeight = (lines.length - 1) * lineHeight;

	return {
		color,
		rotation,
		outline: roundedRectPath(
			filledSide / 2,
			filledSide * CELL_CORNER_RATIO,
		),
		holeRadius,
		dots,
		fontSize,
		labelColor: lightenColor(color, 0.45),
		labels: lines.map((text, i) => ({
			text,
			y: totalHeight / 2 - i * lineHeight,
		})),
	};
}

/** Matches paper-geometry.ts getLabels(). */
function getCellLabelLines(cell: Cell): string[] {
	if (cell.typ === CellType.Fixed)
		return polarizationToString(
			getPolarization(cell.dot_probability_distribution),
		).split("\n");
	if ([CellType.Input, CellType.Output].includes(cell.typ) && cell.label)
		return [cell.label];
	return [];
}

function lightenColor(hex: string, amount: number): string {
	const mix = (c: number) => Math.round(c + (255 - c) * amount);
	const toHex = (c: number) => c.toString(16).padStart(2, "0");
	return `#${toHex(mix(parseInt(hex.slice(1, 3), 16)))}${toHex(mix(parseInt(hex.slice(3, 5), 16)))}${toHex(mix(parseInt(hex.slice(5, 7), 16)))}`;
}

/** Y-down path centered on the origin; also valid for pdf-lib's drawSvgPath. */
function roundedRectPath(half: number, radius: number): string {
	const r = Math.min(radius, half);
	return `M ${-half + r} ${-half} H ${half - r} A ${r} ${r} 0 0 1 ${half} ${-half + r} V ${half - r} A ${r} ${r} 0 0 1 ${half - r} ${half} H ${-half + r} A ${r} ${r} 0 0 1 ${-half} ${half - r} V ${-half + r} A ${r} ${r} 0 0 1 ${-half + r} ${-half} Z`;
}

function pdfColor(hex: string) {
	return rgb(
		parseInt(hex.slice(1, 3), 16) / 255,
		parseInt(hex.slice(3, 5), 16) / 255,
		parseInt(hex.slice(5, 7), 16) / 255,
	);
}

// Matches paper-geometry.ts getCellColor/getClockPhaseColor.
function cellColor(cell: Cell): string {
	if (cell.typ === CellType.Input) return "#194ccc";
	if (cell.typ === CellType.Output) return "#ccb219";
	if (cell.typ === CellType.Fixed) return "#e57f19";
	const phase = ((cell.clock_phase_shift % 360) + 360) % 360;
	if (phase < 90) return "#33cc33";
	if (phase < 180) return "#cc33cc";
	if (phase < 270) return "#33b2cc";
	return "#b2b2b2";
}

function escapeXml(value: string): string {
	return value.replace(
		/[<>&'\"]/g,
		(character) =>
			({
				"<": "&lt;",
				">": "&gt;",
				"&": "&amp;",
				"'": "&apos;",
				'"': "&quot;",
			})[character]!,
	);
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
