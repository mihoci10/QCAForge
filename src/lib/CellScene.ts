import * as THREE from "three";
// @ts-ignore
import { Text } from "troika-three-text";
import { CellIndex } from "./Cell";
import { CellGeometry } from "./CellGeometry";
import { Set } from "typescript-collections";
import { type Layer } from "./Layer";
import type { CellArchitecture } from "./CellArchitecture";

class CellSceneLayer {
	public visible: boolean;
	private parent: CellScene;
	private drawScene: THREE.Scene;
	private pickScene: THREE.Scene;
	private cellGeometry: CellGeometry;
	private labels: Text[] = [];

	constructor(parent: CellScene, visible: boolean) {
		this.parent = parent;
		this.visible = visible;
		this.drawScene = new THREE.Scene();
		this.pickScene = new THREE.Scene();

		this.cellGeometry = new CellGeometry(false);
		this.drawScene.add(
			this.cellGeometry.getDrawMesh() as unknown as THREE.Object3D,
		);
		this.pickScene.add(
			this.cellGeometry.getPickMesh() as unknown as THREE.Object3D,
		);
	}

	update_geometry(
		layer: Layer,
		selectedCells: Set<CellIndex>,
		cell_architecture: CellArchitecture,
	): void {
		const selectedIds: Set<number> = new Set();
		selectedCells.forEach((id) => {
			if (id.layer == this.parent.getIndexOfLayer(this))
				selectedIds.add(id.cell);
		});

		this.cellGeometry.update_draw_mesh(
			layer.cells,
			selectedIds,
			cell_architecture,
		);
		this.cellGeometry.update_pick_mesh(layer.cells, cell_architecture);

		const label_data = this.cellGeometry.update_labels(
			layer.cells,
			selectedIds,
			cell_architecture,
		);

		while (this.labels.length < label_data.length) {
			const label = new Text();
			this.labels.push(label);
			this.drawScene.add(label);
		}

		while (this.labels.length > label_data.length) {
			const label = this.labels.pop();
			this.drawScene.remove(label);
		}

		for (let i = 0; i < label_data.length; i++) {
			const label = this.labels[i];
			const data = label_data[i];
			label.anchorX = "center";
			label.anchorY = "middle";
			label.fontSize = cell_architecture.side_length / 5;
			label.text = data.text;
			label.position.set(data.position.x, data.position.y, 0);
			label.color = data.color;
			label.sync();
		}
	}

	getDrawScene(): THREE.Scene {
		return this.drawScene;
	}

	getPickScene(): THREE.Scene {
		return this.pickScene;
	}
}

export class CellScene {
	private renderer: THREE.WebGLRenderer;
	private camera: THREE.Camera;
	private layers: CellSceneLayer[] = [];

	constructor(renderer: THREE.WebGLRenderer, camera: THREE.Camera) {
		this.renderer = renderer;
		this.camera = camera;
		this.layers = [];
	}

	getLayersCount() {
		return this.layers.length;
	}

	getLayer(layerInd: number) {
		return this.layers[layerInd];
	}

	addLayer(layerInd: number) {
		this.layers.splice(layerInd, 0, new CellSceneLayer(this, true));
	}

	removeLayer(layerInd: number) {
		this.layers.splice(layerInd, 1);
	}

	moveLayer(from: number, to: number) {
		const layer = this.layers[from];
		this.layers.splice(from, 1);
		this.layers.splice(to, 0, layer);
	}

	getIndexOfLayer(sceneLayer: CellSceneLayer) {
		return this.layers.indexOf(sceneLayer);
	}

	render() {
		for (let i = 0; i < this.layers.length; i++) {
			const layer = this.layers[i];
			if (layer.visible)
				this.renderer.render(layer.getDrawScene(), this.camera);
		}
	}

	pick(x1: number, y1: number, x2: number, y2: number): Set<CellIndex> {
		let selectedCells: Set<CellIndex> = new Set<CellIndex>();
		for (let i = 0; i < this.layers.length; i++) {
			const layer = this.layers[i];
			if (layer.visible) {
				const pickBuffer = this.renderPickBuffer(layer, x1, y1, x2, y2);
				for (let j = 0; j < pickBuffer.length / 4; j++) {
					const id = pickBuffer[j * 4];
					if (id >= 0) selectedCells.add(new CellIndex(i, id));
				}
			}
		}
		return selectedCells;
	}

	private renderPickBuffer(
		layer: CellSceneLayer,
		x1: number,
		y1: number,
		x2: number,
		y2: number,
	): Int32Array {
		const scene = layer.getPickScene();

		const width = Math.max(Math.abs(x2 - x1), 1);
		const height = Math.max(Math.abs(y2 - y1), 1);
		const pickingTexture = new THREE.WebGLRenderTarget(
			this.renderer.domElement.width,
			this.renderer.domElement.height,
			{
				type: THREE.IntType,
				format: THREE.RGBAIntegerFormat,
				internalFormat: "RGBA32I",
			},
		);

		this.renderer.setRenderTarget(pickingTexture);
		this.renderer.setClearColor(new THREE.Color(-1, -1, -1));
		this.renderer.clear();
		this.renderer.render(scene, this.camera);

		const pickingBuffer = new Int32Array(width * height * 4);
		this.renderer.readRenderTargetPixels(
			pickingTexture,
			Math.min(x1, x2),
			this.renderer.domElement.height - Math.max(y1, y2),
			width,
			height,
			pickingBuffer,
		);

		return pickingBuffer;
	}
}
