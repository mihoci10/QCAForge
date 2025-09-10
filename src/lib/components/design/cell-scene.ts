import { CellIndex } from "$lib/Cell";
import type { CellArchitecture } from "$lib/CellArchitecture";
import type { Layer } from "$lib/Layer";
import * as THREE from "three";
// @ts-ignore
import { Text } from "troika-three-text";
import { Set } from "typescript-collections";
import type { CellGeometryProps, ICellGeometry } from "./theme/theme";
import { ThemeManager } from "./theme/theme-manager";
import { LegacyCellTheme } from "./theme/legacy/legacy-theme";
import { PaperCellTheme } from "./theme/paper/paper-theme";

class CellSceneLayer {
	public visible: boolean;
	private parent: CellScene;
	private drawScene: THREE.Scene;
	private pickScene: THREE.Scene;
	private geometry: ICellGeometry;
	private labels: Text[] = [];

	constructor(parent: CellScene, visible: boolean) {
		this.parent = parent;
		this.visible = visible;
		this.drawScene = new THREE.Scene();
		this.pickScene = new THREE.Scene();

		this.geometry = this.parent.createGeometry({ ghost: false });
		this.drawScene.add(this.geometry.getDrawObject());
		this.pickScene.add(this.geometry.getPickObject());
	}

	// Called when the theme changes to rebuild geometry
	rebuildGeometry(): void {
		if (this.geometry) {
			this.drawScene.remove(this.geometry.getDrawObject());
			this.pickScene.remove(this.geometry.getPickObject());
			this.geometry.dispose();
		}
		this.geometry = this.parent.createGeometry({ ghost: false });
		this.drawScene.add(this.geometry.getDrawObject());
		this.pickScene.add(this.geometry.getPickObject());
	}

	update_geometry(
		layer: Layer,
		selectedCells: Set<CellIndex>,
		cell_architecture: CellArchitecture,
	): void {
		// Theme geometry expects selection indices for this layer; pass the full set; it will filter.
		this.geometry.update(layer.cells, selectedCells, cell_architecture);

		const label_data = this.geometry.getLabels(
			layer.cells,
			selectedCells,
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
			label?.dispose?.();
		}

		for (let i = 0; i < label_data.length; i++) {
			const label = this.labels[i];
			const data = label_data[i];
			label.anchorX = "center";
			label.anchorY = "middle";
			label.fontSize = data.fontSize ?? cell_architecture.side_length / 5;
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

	getGeometry(): ICellGeometry {
		return this.geometry;
	}
}

export class CellScene {
	private renderer: THREE.WebGLRenderer;
	private camera: THREE.Camera;
	private layers: CellSceneLayer[] = [];
	private themeManager: ThemeManager;

	constructor(
		renderer: THREE.WebGLRenderer,
		camera: THREE.Camera,
		themeManager?: ThemeManager,
	) {
		this.renderer = renderer;
		this.camera = camera;
		this.layers = [];
		this.themeManager = themeManager ?? new ThemeManager();
		// Ensure a default theme exists if none registered
		if (!themeManager) this.themeManager.register(new PaperCellTheme());

		// Rebuild layers when theme changes
		this.themeManager.onChange(() => {
			for (const layer of this.layers) layer.rebuildGeometry();
		});
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
				const geom = layer.getGeometry();

				for (let j = 0; j < pickBuffer.length / 4; j++) {
					const r = pickBuffer[j * 4 + 0];
					const g = pickBuffer[j * 4 + 1];
					const b = pickBuffer[j * 4 + 2];
					const a = pickBuffer[j * 4 + 3];
					const id = geom.decodePickPixel(r, g, b, a);
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

		const geom = layer.getGeometry();
		const targetOptions = geom.getPickRenderTargetOptions(this.renderer);

		const pickingTexture = new THREE.WebGLRenderTarget(
			this.renderer.domElement.width,
			this.renderer.domElement.height,
			targetOptions,
		);

		const origClearColor = new THREE.Color();
		this.renderer.getClearColor(origClearColor);

		this.renderer.setRenderTarget(pickingTexture);
		this.renderer.setClearColor(geom.getPickClearColor());
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

		this.renderer.setRenderTarget(null);
		pickingTexture.dispose();
		this.renderer.setClearColor(origClearColor);

		return pickingBuffer;
	}

	// Theme plumbing
	createGeometry(props: CellGeometryProps): ICellGeometry {
		return this.themeManager.getActive().createGeometry(props);
	}
}
