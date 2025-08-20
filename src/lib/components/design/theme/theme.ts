import type { Cell, CellIndex } from "$lib/Cell";
import type { CellArchitecture } from "$lib/CellArchitecture";
import * as THREE from "three";
import { Set as TsSet } from "typescript-collections";

export type LabelDatum = {
	position: THREE.Vector2;
	text: string;
	color: THREE.Color;
	fontSize?: number;
};

export type CellGeometryProps = {
	ghost: boolean;
};

export interface ICellGeometry {
	// 3D objects for draw and pick passes
	getDrawObject(): THREE.Object3D;
	getPickObject(): THREE.Object3D;

	// Update geometry/material state for a layer
	update(
		cell: Cell[],
		selected: TsSet<CellIndex>,
		arch: CellArchitecture,
	): void;

	// Theme-generated labels (text, color, font size)
	getLabels(
		cell: Cell[],
		selected: TsSet<CellIndex>,
		arch: CellArchitecture,
	): LabelDatum[];

	// Picking pipeline per-theme
	getPickRenderTargetOptions(
		renderer: THREE.WebGLRenderer,
	): THREE.RenderTargetOptions;
	getPickClearColor(): THREE.Color;

	// Decode a pixel (r,g,b,a) into a logical cell id for this layer, or -1 for none
	decodePickPixel(r: number, g: number, b: number, a: number): number;

	dispose(): void;
}

export interface CellTheme {
	id: string;
	title: string;
	createGeometry(props: CellGeometryProps): ICellGeometry;
}
