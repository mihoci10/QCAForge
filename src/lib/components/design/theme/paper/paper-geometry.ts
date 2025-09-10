import * as THREE from "three";
import { InstancedEntity, InstancedMesh2 } from "@three.ez/instanced-mesh";
import { Set as TsSet } from "typescript-collections";
import {
	CellType,
	polarizationToString,
	getPolarization,
	type Cell,
} from "$lib/Cell";
import type { CellArchitecture } from "$lib/CellArchitecture";
import type { Layer } from "$lib/Layer";
import type { CellGeometryProps, ICellGeometry, LabelDatum } from "../theme";
import {
	PaperDrawableCellMaterial,
	PaperPickableCellMaterial,
} from "./paper-material";

export class PaperCellGeometry implements ICellGeometry {
	private drawMesh: InstancedMesh2;
	private pickMesh: InstancedMesh2;
	private props: CellGeometryProps;

	constructor(props: CellGeometryProps) {
		this.props = props;

		this.drawMesh = this.initInstancedMesh(
			new THREE.PlaneGeometry(),
			new PaperDrawableCellMaterial(),
		);
		this.pickMesh = this.initInstancedMesh(
			new THREE.PlaneGeometry(),
			new PaperPickableCellMaterial(),
		);
	}

	getDrawObject(): THREE.Object3D {
		return this.drawMesh as unknown as THREE.Object3D;
	}

	getPickObject(): THREE.Object3D {
		return this.pickMesh as unknown as THREE.Object3D;
	}

	dispose(): void {
		this.drawMesh.dispose();
		this.pickMesh.dispose();
	}

	update(
		cells: Cell[],
		selected: TsSet<any>,
		architecture: CellArchitecture,
	): void {
		// Selected cells for this layer are passed as Set<CellIndex>. Extract ids for this layer.
		const selectedIds = new Set<number>();
		selected.forEach((ci: any) => {
			// caller ensures only current-layer ids are passed or layer index matched upstream
			if (typeof ci === "number") selectedIds.add(ci);
			else if (ci && typeof ci.cell === "number")
				selectedIds.add(ci.cell);
		});

		this.updateInstancedMesh(
			this.drawMesh,
			cells,
			selectedIds,
			architecture,
		);
		this.updateInstancedMesh(
			this.pickMesh,
			cells,
			new Set<number>(),
			architecture,
		);
	}

	getLabels(
		cells: Cell[],
		selected: TsSet<any>,
		architecture: CellArchitecture,
	): LabelDatum[] {
		const sel = new Set<number>();
		selected.forEach((ci: any) => {
			if (typeof ci === "number") sel.add(ci);
			else if (ci && typeof ci.cell === "number") sel.add(ci.cell);
		});

		return cells
			.map((cell, index) => ({ cell, index }))
			.filter(({ cell }) =>
				[CellType.Input, CellType.Output, CellType.Fixed].includes(
					cell.typ,
				),
			)
			.map(({ cell, index }) => {
				let text = polarizationToString(
					getPolarization(cell.dot_probability_distribution),
				);
				if (cell.typ != CellType.Fixed)
					text = cell.label ? cell.label : "";

				return {
					position: new THREE.Vector2(
						cell.position[0],
						cell.position[1],
					),
					text,
					color: this.getCellColor(cell, sel.has(index)),
					fontSize: architecture.side_length / 5,
				};
			});
	}

	getPickRenderTargetOptions(
		renderer: THREE.WebGLRenderer,
	): THREE.RenderTargetOptions {
		return {
			type: THREE.IntType,
			format: THREE.RGBAIntegerFormat,
			internalFormat: "RGBA32I",
		} as THREE.RenderTargetOptions;
	}

	getPickClearColor(): THREE.Color {
		// Matches current picking clear sentinel of (-1,-1,-1)
		return new THREE.Color(-1, -1, -1);
	}

	decodePickPixel(r: number, g: number, b: number, a: number): number {
		// Current pick shader writes id to out_id (R channel). Negative means none.
		return r >= 0 ? r : -1;
	}

	// --- Internal helpers ---

	private initInstancedMesh(
		geometry: THREE.BufferGeometry,
		shader: THREE.ShaderMaterial,
	): InstancedMesh2 {
		const mesh = new InstancedMesh2(geometry, shader);
		mesh.initUniformsPerInstance({
			fragment: {
				polarization: "vec2",
				metadata: "float",
				color: "vec3",
			},
		});
		mesh.frustumCulled = false;
		return mesh;
	}

	private getCellMetadata(
		id: number,
		cell_dot_count: number,
		cell_rotation: number,
	): number {
		let result = 0;
		result = id << 16;

		if (cell_dot_count == 8) result |= 0b1000000;
		else if (cell_dot_count != 4)
			throw new Error(`Invalid cell_dot_count: ${cell_dot_count}`);

		if (cell_rotation % 180 == 90) result |= 0b100000;
		else if (cell_rotation % 180 != 0)
			throw new Error(`Invalid cell_rotation: ${cell_rotation}`);

		return result;
	}

	private getClockPhaseColor(clock_phase: number): THREE.Color {
		const phase = ((clock_phase % 360) + 360) % 360;
		if (phase < 90)
			return new THREE.Color(0.2, 0.8, 0.2); // Softer green
		else if (phase < 180)
			return new THREE.Color(0.8, 0.2, 0.8); // Softer magenta
		else if (phase < 270)
			return new THREE.Color(0.2, 0.7, 0.8); // Softer cyan
		else return new THREE.Color(0.7, 0.7, 0.7); // Light gray instead of white
	}

	private getCellColor(cell: Cell, selected: boolean): THREE.Color {
		if (this.props.ghost) return new THREE.Color(0.5, 0.5, 0.5);
		if (selected) return new THREE.Color(0.9, 0.1, 0.1); // Softer red

		switch (cell.typ) {
			case CellType.Normal:
				return this.getClockPhaseColor(cell.clock_phase_shift);
			case CellType.Input:
				return new THREE.Color(0.1, 0.3, 0.8); // Darker, softer blue
			case CellType.Output:
				return new THREE.Color(0.8, 0.7, 0.1); // Darker yellow/gold
			case CellType.Fixed:
				return new THREE.Color(0.9, 0.5, 0.1); // Slightly darker orange
		}
	}

	private updateInstancedMesh(
		mesh: InstancedMesh2,
		cells: Cell[],
		selectedCells: Set<number>,
		architecture: CellArchitecture,
	) {
		const initCellInstance = (instance: InstancedEntity, index: number) => {
			const cell = cells[index];

			instance.position.set(cell.position[0], cell.position[1], 0);
			instance.scale.set(
				architecture.side_length,
				architecture.side_length,
				1,
			);

			const polarization = getPolarization(
				cell.dot_probability_distribution,
			);
			if (polarization.length < 2) polarization.push(0);

			instance.setUniform(
				"polarization",
				new THREE.Vector2(polarization[0], polarization[1]),
			);

			const metadata = this.getCellMetadata(
				index,
				architecture.dot_count,
				cell.rotation,
			);
			instance.setUniform("metadata", metadata);

			const cell_color = this.getCellColor(
				cell,
				selectedCells.has(index),
			);
			instance.setUniform("color", cell_color);
		};

		if (cells.length != mesh.instancesCount) {
			mesh.clearInstances();
			mesh.addInstances(cells.length, initCellInstance);
		} else {
			mesh.updateInstances(initCellInstance);
		}

		mesh.computeBVH();
	}
}
