<script lang="ts">
	import { onDestroy, onMount } from "svelte";
	import Stats from "stats.js";
	import * as THREE from "three";

	import { Set } from "typescript-collections";
	import { Menu } from "@tauri-apps/api/menu";
	import { writeText, readText } from "@tauri-apps/plugin-clipboard-manager";

	import DesignToolbar from "./design-toolbar.svelte";
	import { CellIndex, type Cell, parseCellIndex } from "$lib/Cell";
	import type { CellArchitecture } from "$lib/CellArchitecture";
	import type { Layer } from "$lib/Layer";
	import { HotkeyHandler } from "$lib/utils/hotkey-handler";
	import InfiniteGrid from "$lib/utils/infinite-grid";
	import { OrbitControls } from "$lib/utils/OrbitControls";
	import { CellScene } from "./cell-scene";
	import type { ICellGeometry } from "./theme/theme";
	import { LegacyCellGeometry } from "./theme/legacy/legacy-geometry";
	import { emit } from "@tauri-apps/api/event";
	import { PRINT_OPTIONS, printDesign } from "./print/print-design";
	import PrintDesignModal from "./print/print-design-modal.svelte";
	import type { Color } from "@tauri-apps/api/webview";

	let camera: THREE.PerspectiveCamera;
	let renderer: THREE.WebGLRenderer;
	let controls: OrbitControls;
	let container: HTMLElement;
	let selection_rect: HTMLElement;
	let canvas: HTMLCanvasElement;
	let resizeObserver: ResizeObserver;

	let globalScene: THREE.Scene;
	let cellScene: CellScene;

	let infinite_grid: InfiniteGrid;
	let ghostGeometry: ICellGeometry | undefined;

	let stats: Stats;
	let statsDrawCall: Stats.Panel;

	let inputModeIdx: number = $state(0);

	let mouseStartPos: THREE.Vector2 | undefined;
	let current_mouse_pos: THREE.Vector2 | undefined;
	let multiselect: boolean = false;
	let mouseDragging: boolean = false;
	let hotkeyHandler: HotkeyHandler;

	let cachedCellsPos: { [id: string]: [pos_x: number, pos_y: number] } = {};

	let isPrintDesignModalOpen: boolean = $state(false);

	export interface DesignViewProps {
		camera_position?: [number, number, number];
		camera_rotation?: [number, number, number];
		camera_zoom_range?: [number, number];

		camera_rotate_enabled?: boolean;
		camera_zoom_enabled?: boolean;

		cell_edit_enabled?: boolean;

		cell_snapping_enabled?: boolean;
		cell_snapping_divider?: number;
	}

	interface Props {
		layers: Layer[];
		selectedLayer: number | undefined;
		cell_architectures: Map<string, CellArchitecture>;
		selectedCells: Set<CellIndex>;
		properties: DesignViewProps;
		onGetNewCellProps?: () => Cell;
		onSelectedCellsUpdated?: () => void;
	}

	let {
		layers = $bindable(),
		selectedLayer,
		cell_architectures,
		selectedCells = $bindable(),
		properties = $bindable(),
		onGetNewCellProps,
		onSelectedCellsUpdated,
	}: Props = $props();

	let cellSnappingEnabled: boolean = $derived(
		properties.cell_snapping_enabled ?? false,
	);
	let cellSnappingDivider: number = $derived(
		properties.cell_snapping_divider ?? get_cell_architecture().side_length,
	);

	$effect(() => {
		properties.cell_snapping_enabled = cellSnappingEnabled;
		properties.cell_snapping_divider = cellSnappingDivider;
	});

	onMount(() => {
		initThreeJS();
		initDebugStats();
		initKeyboardShortcuts();

		renderer.setAnimationLoop(render);
		drawCurrentLayer();
	});

	function initThreeJS() {
		renderer = new THREE.WebGLRenderer({
			canvas: canvas,
			alpha: true,
			antialias: true,
		});

		const style = getComputedStyle(container);
		const bgColor = new THREE.Color(style.getPropertyValue("background-color"));

		renderer.setClearAlpha(0);
		renderer.setClearColor(bgColor);
		renderer.autoClear = false;

		globalScene = new THREE.Scene();
		camera = new THREE.PerspectiveCamera(75, 1, 0.1, 3000);
		// camera = new THREE.OrthographicCamera(
		// 	container.clientWidth / -2,
		// 	container.clientWidth / 2,
		// 	container.clientHeight / 2,
		// 	container.clientHeight / -2,
		// 	1,
		// 	3000,
		// );

		const cameraPosition = properties.camera_position ?? [0, 0, 20];
		camera.position.set(
			cameraPosition[0],
			cameraPosition[1],
			cameraPosition[2],
		);

		cellScene = new CellScene(renderer, camera);
		cellScene.addLayer(0);

		infinite_grid = new InfiniteGrid(
			20,
			100,
			new THREE.Color(1.0 - bgColor.r, 1.0 - bgColor.g, 1.0 - bgColor.b), 
			8000,
			"xyz",
		);
		globalScene.add(infinite_grid);

		if (properties.cell_edit_enabled)
			ghostGeometry = new LegacyCellGeometry({ ghost: true });

		resizeObserver = new ResizeObserver(() => {
			windowResize();
		});
		resizeObserver.observe(container);

		renderer.domElement.addEventListener("mousedown", mouseDown);
		renderer.domElement.addEventListener("mousemove", mouseMove);
		renderer.domElement.addEventListener("mouseup", mouseUp);
		window.addEventListener("keydown", keyDown);
		window.addEventListener("keyup", keyUp);

		controls = new OrbitControls(camera, renderer.domElement);
		controls.enableRotate = false;
		controls.minDistance = 10;
		controls.maxDistance = 1000;
		controls.target.set(camera.position.x, camera.position.y, 0);
	}

	function initDebugStats() {
		stats = new Stats();
		stats.dom.style.position = "absolute";
		stats.dom.style.left = "";
		stats.dom.style.top = "";
		stats.dom.style.right = "1px";
		stats.dom.style.bottom = "1px";
		container.appendChild(stats.dom);
		statsDrawCall = stats.addPanel(
			new Stats.Panel("Draw calls", "#ff8", "#221"),
		);
		stats.showPanel(0);
	}

	onDestroy(() => {
		resizeObserver.disconnect();
		deinitKeyboardShortcuts();
		renderer.dispose();

		if (ghostGeometry) ghostGeometry.dispose();
	});

	function windowResize() {
		renderer.setSize(
			container.clientWidth * devicePixelRatio,
			container.clientHeight * devicePixelRatio,
			false,
		);
		camera.aspect = container.clientWidth / container.clientHeight;
		camera.updateProjectionMatrix();
		render();
	}

	function render() {
		controls.update();
		renderer.setRenderTarget(null);
		renderer.clear();
		stats.begin();
		renderer.render(globalScene, camera);
		cellScene.render();
		stats.end();

		statsDrawCall.update(renderer.info.render.calls, 10);
	}

	function get_cell_architecture(layerIndex: number | undefined = undefined) {
		if (layerIndex !== undefined) {
			return cell_architectures.get(
				layers[layerIndex].cell_architecture_id,
			)!;
		} else if (selectedLayer !== undefined) {
			return cell_architectures.get(
				layers[selectedLayer].cell_architecture_id,
			)!;
		}

		throw new Error("Selected layer is not defined");
	}

	function createGhostMesh() {
		if (!ghostGeometry)
			throw new Error("Ghost geometry is not initialized");
		if (!onGetNewCellProps)
			throw new Error("onGetNewCellProps callback is not defined");

		const cell_template = onGetNewCellProps();
		ghostGeometry.update(
			[
				{
					position: [0, 0],
					clock_phase_shift: cell_template.clock_phase_shift,
					typ: cell_template.typ,
					rotation: cell_template.rotation,
					dot_probability_distribution:
						cell_template.dot_probability_distribution,
					label: cell_template.label,
				},
			],
			new Set(),
			get_cell_architecture(),
		);
		globalScene.add(ghostGeometry.getDrawObject());
	}

	function removeGhostMesh() {
		if (!ghostGeometry)
			throw new Error("Ghost geometry is not initialized");

		ghostGeometry.update([], new Set(), get_cell_architecture());
		globalScene.remove(ghostGeometry.getDrawObject());
	}

	function shouldMouseDrag(mouse_x: number, mouse_y: number): boolean {
		let id = getCellOnPos(mouse_x, mouse_y);

		if (!id) return false;

		if (!selectedCells.isEmpty() && selectedCells.contains(id)) return true;

		applySelectRegion(mouse_x, mouse_y);
		return !selectedCells.isEmpty();
	}

	function getMouseEventPos(e: MouseEvent): THREE.Vector2 {
		var bounds = renderer.domElement.getBoundingClientRect();
		return new THREE.Vector2(e.x - bounds.left, e.y - bounds.top)
			.multiplyScalar(devicePixelRatio)
			.round();
	}

	function mouseDown(e: MouseEvent) {
		const mousePos = getMouseEventPos(e);
		mouseStartPos = mousePos;

		if (inputMode == 0) {
			if (e.button == 0) {
				if (!multiselect) {
					mouseDragging = shouldMouseDrag(mousePos.x, mousePos.y);
					if (mouseDragging) startMouseDrag();
				}

				if (!mouseDragging) start_cell_select();
			}
		} else if (inputMode == 1) {
			if (e.button == 0) startCellPlace(mousePos);
		}
	}

	function mouseUp(e: MouseEvent) {
		const mousePos = getMouseEventPos(e);

		if (inputMode == 0) {
			if (e.button == 0 && !mouseDragging) end_cell_select(mousePos);
			else if (
				e.button == 2 &&
				mouseStartPos &&
				mousePos.x == mouseStartPos!.x &&
				mousePos.y == mouseStartPos!.y
			) {
				shouldMouseDrag(mousePos.x, mousePos.y);
				showContextMenu();
			}
		} else if (inputMode == 1) {
			if (e.button == 0) endCellPlace(mousePos);
		}

		mouseStartPos = undefined;
		mouseDragging = false;
	}

	function start_cell_select() {
		selection_rect.style.display = "block";

		move_cell_select(mouseStartPos!);
	}

	function end_cell_select(mouse_pos: THREE.Vector2) {
		selection_rect.style.display = "none";
		applySelectRegion(mouse_pos.x, mouse_pos.y);
	}

	function move_cell_select(mouse_pos: THREE.Vector2) {
		if (!mouseStartPos) return;

		const start_pos = mouseStartPos.clone().divideScalar(devicePixelRatio);
		const end_pos = mouse_pos.clone().divideScalar(devicePixelRatio);

		const x = Math.min(start_pos.x, end_pos.x);
		const y = Math.min(start_pos.y, end_pos.y);
		const width = Math.abs(start_pos.x - end_pos.x);
		const height = Math.abs(start_pos.y - end_pos.y);

		selection_rect.style.left = x + "px";
		selection_rect.style.top = y + "px";
		selection_rect.style.width = width + "px";
		selection_rect.style.height = height + "px";
	}

	function mouseMove(e: MouseEvent) {
		current_mouse_pos = getMouseEventPos(e);

		if (inputMode == 0) {
			if (mouseDragging) {
				if (mouseStartPos != undefined)
					repositionCells(current_mouse_pos);
			} else move_cell_select(current_mouse_pos);
		} else if (inputMode == 1) {
			repositionGhostMesh(current_mouse_pos);
		}
	}

	function keyDown(e: KeyboardEvent) {
		multiselect = e.shiftKey;
	}

	function keyUp(e: KeyboardEvent) {
		multiselect = false;
	}

	function startMouseDrag() {
		cachedCellsPos = {};
		selectedCells.forEach((id) => {
			const cell = layers[id.layer].cells[id.cell];
			cachedCellsPos[id.toString()] = [
				cell.position[0],
				cell.position[1],
			];
		});
	}

	function endMouseDrag() {
		cachedCellsPos = {};
	}

	function getCellOnPos(
		mouse_x: number,
		mouse_y: number,
	): CellIndex | undefined {
		let cellsUnderMouse = cellScene.pick(
			mouseStartPos?.x ?? 0,
			mouseStartPos?.y ?? 0,
			mouse_x,
			mouse_y,
		);

		if (cellsUnderMouse.isEmpty()) return undefined;

		return cellsUnderMouse.toArray()[0];
	}

	function applySelectRegion(mouse_x: number, mouse_y: number) {
		if (!multiselect) selectedCells.clear();

		let cellsUnderMouse = cellScene.pick(
			mouseStartPos?.x ?? 0,
			mouseStartPos?.y ?? 0,
			mouse_x,
			mouse_y,
		);
		cellsUnderMouse.forEach((id) => {
			if (multiselect && selectedCells.contains(id))
				selectedCells.remove(id);
			else selectedCells.add(id);
		});
		drawCurrentLayer();
		selectedCellsUpdated();
	}

	function selectedCellsUpdated() {
		onSelectedCellsUpdated?.();
	}

	export function drawCurrentLayer() {
		if (selectedLayer === undefined) {
			for (let i = 0; i < layers.length; i++) {
				cellScene
					.getLayer(i)
					.update_geometry(
						layers[i],
						selectedCells,
						get_cell_architecture(i),
					);
			}
		} else {
			cellScene
				.getLayer(selectedLayer)
				.update_geometry(
					layers[selectedLayer],
					selectedCells,
					get_cell_architecture(),
				);
		}
	}

	function screenSpaceToWorld(pos: THREE.Vector2): THREE.Vector3 {
		const mousePos = new THREE.Vector3(
			(pos.x / renderer.domElement.width) * 2 - 1,
			-(pos.y / renderer.domElement.height) * 2 + 1,
			0,
		);

		var tempVec = mousePos.unproject(camera);

		var planeNormal = new THREE.Vector3(0, 0, 1).normalize();
		var plane = new THREE.Plane(planeNormal);

		tempVec.sub(camera.position);
		tempVec.normalize();
		var vectorOrigin = camera.position;
		var vector = new THREE.Ray(vectorOrigin, tempVec);

		var intersectionPoint = new THREE.Vector3();
		vector.intersectPlane(plane, intersectionPoint);
		return intersectionPoint;
	}

	function startCellPlace(mouse_pos: THREE.Vector2) {}

	function endCellPlace(mouse_pos: THREE.Vector2) {
		if (!onGetNewCellProps)
			throw new Error("onGetNewCellProps callback is not defined");

		const cell_template = onGetNewCellProps();
		calculate_ghost_positions(mouse_pos).forEach((pos) => {
			layers[selectedLayer].cells.push({
				position: [pos.x, pos.y],
				clock_phase_shift: cell_template.clock_phase_shift,
				typ: cell_template.typ,
				rotation: cell_template.rotation,
				dot_probability_distribution:
					cell_template.dot_probability_distribution,
				label: cell_template.label,
			});
		});
		drawCurrentLayer();
	}

	function applySnapping(pos: THREE.Vector2) {
		const localSnapDivider =
			(properties.cell_snapping_enabled ?? false)
				? (properties.cell_snapping_divider ??
					get_cell_architecture().side_length)
				: 1;
		return new THREE.Vector2(
			Math.floor((pos.x + localSnapDivider / 2) / localSnapDivider) *
				localSnapDivider,
			Math.floor((pos.y + localSnapDivider / 2) / localSnapDivider) *
				localSnapDivider,
		);
	}

	function deleteCells(cell_ids: Set<CellIndex>) {
		for (let i = 0; i < layers.length; i++) {
			layers[i].cells = layers[i].cells.filter((_, ind) => {
				return !cell_ids.contains(new CellIndex(i, ind));
			});
		}

		selectedCells.clear();
		drawCurrentLayer();
		selectedCellsUpdated();
	}

	function repositionCells(mouse_pos: THREE.Vector2) {
		let orig_world_pos = screenSpaceToWorld(mouseStartPos!);
		const adjusted_orig_pos = applySnapping(
			new THREE.Vector2(orig_world_pos.x, orig_world_pos.y),
		);

		let world_pos = screenSpaceToWorld(mouse_pos);
		const adjusted_world_pos = applySnapping(
			new THREE.Vector2(world_pos.x, world_pos.y),
		);

		let diff_x = adjusted_world_pos.x - adjusted_orig_pos.x;
		let diff_y = adjusted_world_pos.y - adjusted_orig_pos.y;

		for (let key in cachedCellsPos) {
			let id = parseCellIndex(key);
			if (!id) continue;

			let pos = cachedCellsPos[key];
			layers[id.layer].cells[id.cell].position[0] = pos[0] + diff_x;
			layers[id.layer].cells[id.cell].position[1] = pos[1] + diff_y;
		}

		selectedCellsUpdated();
		drawCurrentLayer();
	}

	function calculate_ghost_positions(
		mouse_pos: THREE.Vector2,
	): THREE.Vector2[] {
		const world_pos = screenSpaceToWorld(mouse_pos);
		const adjusted_world_pos = applySnapping(
			new THREE.Vector2(world_pos.x, world_pos.y),
		);

		if (!mouseStartPos) return [adjusted_world_pos];

		const orig_world_pos = screenSpaceToWorld(mouseStartPos);
		const adjusted_orig_world_pos = applySnapping(
			new THREE.Vector2(orig_world_pos.x, orig_world_pos.y),
		);

		const cell_size = get_cell_architecture().side_length;
		const offset = new THREE.Vector2();

		const diff = world_pos.clone().sub(orig_world_pos);
		if (Math.abs(diff.x) > Math.abs(diff.y))
			offset.x = Math.sign(diff.x) * cell_size;
		else offset.y = Math.sign(diff.y) * cell_size;

		const cell_positions = [];
		let current_pos = adjusted_orig_world_pos.clone();

		while (
			(offset.x != 0 &&
				Math.abs(current_pos.x - world_pos.x) > cell_size) ||
			(offset.y != 0 && Math.abs(current_pos.y - world_pos.y) > cell_size)
		) {
			cell_positions.push(current_pos.clone());
			current_pos.add(offset);
		}
		cell_positions.push(current_pos.clone());
		return cell_positions;
	}

	function repositionGhostMesh(mouse_pos: THREE.Vector2) {
		if (!ghostGeometry)
			throw new Error("Ghost geometry is not initialized");
		if (!onGetNewCellProps)
			throw new Error("onGetNewCellProps callback is not defined");

		const cell_positions = calculate_ghost_positions(mouse_pos);
		const cell_architecture = get_cell_architecture();
		const cell_template = onGetNewCellProps();
		ghostGeometry.update(
			cell_positions.map((pos) => {
				return {
					position: [pos.x, pos.y],
					clock_phase_shift: cell_template.clock_phase_shift,
					typ: cell_template.typ,
					rotation: cell_template.rotation,
					dot_probability_distribution:
						cell_template.dot_probability_distribution,
					label: cell_template.label,
				};
			}),
			new Set(),
			cell_architecture,
		);
	}

	function inputModeChanged(newInputModeIdx: number) {
		let newInputMode = newInputModeIdx;

		switch (oldInputMode) {
			case 0: {
				break;
			}
			case 1: {
				removeGhostMesh();
				break;
			}
		}

		switch (newInputMode) {
			case 0: {
				break;
			}
			case 1: {
				createGhostMesh();
				break;
			}
		}

		oldInputMode = newInputMode;
		return newInputMode;
	}

	function saveCellsToClipboard(cell_ids: Set<CellIndex>) {
		let cells = new Array<Cell>();
		cell_ids.forEach((id) => {
			cells.push(layers[id.layer].cells[id.cell]);
		});

		writeText(JSON.stringify(cells));
	}

	async function pasteCellsFromClipboard() {
		readText().then((text) => {
			let cells = JSON.parse(text) as Cell[];

			const centroid = cells
				.reduce(
					(acc, cell) => {
						return new THREE.Vector2(
							acc.x + cell.position[0],
							acc.y + cell.position[1],
						);
					},
					new THREE.Vector2(0, 0),
				)
				.divideScalar(cells.length);

			const snapped_centroid = applySnapping(centroid);
			const world_pos = screenSpaceToWorld(current_mouse_pos!);
			const snapped_world_pos = applySnapping(
				new THREE.Vector2(world_pos.x, world_pos.y),
			);
			const pos_diff = snapped_world_pos.sub(snapped_centroid);

			cells.forEach((cell) => {
				cell.position[0] += pos_diff.x;
				cell.position[1] += pos_diff.y;
			});

			const number_of_cells = layers[selectedLayer].cells.length;
			layers[selectedLayer].cells =
				layers[selectedLayer].cells.concat(cells);
			selectedCells.clear();
			for (let i = 0; i < cells.length; i++) {
				selectedCells.add(
					new CellIndex(selectedLayer, number_of_cells + i),
				);
			}
			selectedCellsUpdated();

			drawCurrentLayer();
		});
	}

	export function cutSelectedCells() {
		saveCellsToClipboard(selectedCells);
		deleteCells(selectedCells);
	}

	export function copySelectedCells() {
		saveCellsToClipboard(selectedCells);
	}

	export function pasteCells() {
		pasteCellsFromClipboard();
	}

	export function deleteSelectedCells() {
		deleteCells(selectedCells);
	}

	export function deselectAllCells() {
		selectedCells.clear();
		selectedCellsUpdated();
		drawCurrentLayer();
	}

	function getCellsPosExtents(cells: Set<CellIndex>) {
		if (cells.isEmpty())
			return {
				min: new THREE.Vector2(0, 0),
				max: new THREE.Vector2(0, 0),
			};

		let min_x = Infinity;
		let max_x = -Infinity;
		let min_y = Infinity;
		let max_y = -Infinity;

		cells.forEach((id) => {
			const architecture = get_cell_architecture(id.layer);
			const cell = layers[id.layer].cells[id.cell];
			min_x = Math.min(
				min_x,
				cell.position[0] - architecture.side_length / 2,
			);
			max_x = Math.max(
				max_x,
				cell.position[0] + architecture.side_length / 2,
			);
			min_y = Math.min(
				min_y,
				cell.position[1] - architecture.side_length / 2,
			);
			max_y = Math.max(
				max_y,
				cell.position[1] + architecture.side_length / 2,
			);
		});

		return {
			min: new THREE.Vector2(min_x, min_y),
			max: new THREE.Vector2(max_x, max_y),
		};
	}

	function getCellsZoomToFit(
		cell_extents: { min: THREE.Vector2; max: THREE.Vector2 },
		margin: number,
	) {
		const width = (cell_extents.max.x - cell_extents.min.x) * margin;
		const height = (cell_extents.max.y - cell_extents.min.y) * margin;

		const vFOV = THREE.MathUtils.degToRad(camera.fov); // vertical FOV in radians
		const hFOV = 2 * Math.atan(Math.tan(vFOV / 2) * camera.aspect);

		const zoom_x = width > 0 ? width / 2 / Math.tan(hFOV / 2) : 0;
		const zoom_y = height > 0 ? height / 2 / Math.tan(vFOV / 2) : 0;

		return {
			zoom_x: zoom_x,
			zoom_y: zoom_y,
		};
	}

	function centerCameraOnPos(
		pos: THREE.Vector2,
		zoom: number = 100,
		interpolate: boolean = false,
	) {
		camera.position.set(pos.x, pos.y, zoom);
		camera.updateProjectionMatrix();
		controls.target.set(camera.position.x, camera.position.y, 0);

		drawCurrentLayer();
	}

	function centerCameraOnCells(cells: Set<CellIndex>, margin: number = 1.2) {
		if (cells.isEmpty()) return;

		const cell_extents = getCellsPosExtents(cells);
		const zoom = getCellsZoomToFit(cell_extents, margin);

		const camera_pos = new THREE.Vector2(
			(cell_extents.min.x + cell_extents.max.x) / 2,
			(cell_extents.min.y + cell_extents.max.y) / 2,
		);
		const camera_dist = Math.max(zoom.zoom_x, zoom.zoom_y, 20);

		centerCameraOnPos(camera_pos, camera_dist);
	}

	export function centerCameraOnSelection(margin: number = 1.2) {
		centerCameraOnCells(selectedCells, margin);
	}

	export function centerCamera(margin: number = 1.2) {
		let all_cells = new Set<CellIndex>();
		for (let i = 0; i < layers.length; i++) {
			for (let j = 0; j < layers[i].cells.length; j++) {
				all_cells.add(new CellIndex(i, j));
			}
		}

		centerCameraOnCells(all_cells, margin);
	}

	export async function renderToOffscreenCanvas(
		resolutionScale: number = 1,
		selectionOnly: boolean = false,
		showGrid: boolean = false,
		clearColor: THREE.Color = new THREE.Color(0)
	): Promise<HTMLCanvasElement> {
		const originalPosition = camera.position.clone();
		const originalZoom = camera.zoom;
		const originalAspect = camera.aspect;
		const originalTarget = controls.target.clone();
		const originalRendererSize = {
			width: renderer.getSize(new THREE.Vector2()).width,
			height: renderer.getSize(new THREE.Vector2()).height,
		};
		const originalGridVisibility = infinite_grid.visible;
		const origSelectedCells = selectedCells;
		const originalClearColor = renderer.getClearColor(new THREE.Color());

		const canvas = document.createElement("canvas");

		const cellsToRender = selectionOnly
			? selectedCells
			: (() => {
					let all_cells = new Set<CellIndex>();
					for (let i = 0; i < layers.length; i++) {
						for (let j = 0; j < layers[i].cells.length; j++) {
							all_cells.add(new CellIndex(i, j));
						}
					}
					return all_cells;
				})();

		const cellExtents = getCellsPosExtents(cellsToRender);
		const aspectRatio =
			(cellExtents.max.x - cellExtents.min.x) /
			(cellExtents.max.y - cellExtents.min.y);
		camera.aspect = aspectRatio;
		const zoomExtents = getCellsZoomToFit(cellExtents, 1);
		const zoom = Math.max(zoomExtents.zoom_x, zoomExtents.zoom_y);

		const centerPos = new THREE.Vector2(
			(cellExtents.min.x + cellExtents.max.x) / 2,
			(cellExtents.min.y + cellExtents.max.y) / 2,
		);
		const width = 1920 * resolutionScale;
		const height = Math.round(width / aspectRatio);

		canvas.width = width;
		canvas.height = height;

		try {
			renderer.setSize(width, height, false);

			camera.position.set(centerPos.x, centerPos.y, zoom);
			controls.target.set(centerPos.x, centerPos.y, 0);
			camera.updateProjectionMatrix();

			infinite_grid.visible = showGrid;
			selectedCells = new Set<CellIndex>();
			drawCurrentLayer();

			renderer.setClearColor(clearColor);
			renderer.clear();
			renderer.render(globalScene, camera);
			cellScene.render();

			// Copy renderer contents to our canvas
			const context = canvas.getContext("2d")!;
			context.drawImage(renderer.domElement, 0, 0);

			return canvas;
		} finally {
			// Restore original state
			camera.position.copy(originalPosition);
			camera.zoom = originalZoom;
			camera.aspect = originalAspect;
			camera.updateProjectionMatrix();
			controls.target.copy(originalTarget);
			controls.update();
			renderer.setSize(
				originalRendererSize.width,
				originalRendererSize.height,
				false,
			);
			infinite_grid.visible = originalGridVisibility;
			selectedCells = origSelectedCells;
			renderer.setClearColor(originalClearColor);
			drawCurrentLayer();
		}
	}

	async function showContextMenu() {
		const menu = await Menu.new({
			items: [
				{
					text: "Cut",
					accelerator: "CommandOrControl+X",
					action: () => {
						emit("cut");
					},
					enabled: !selectedCells.isEmpty(),
				},
				{
					text: "Copy",
					accelerator: "CommandOrControl+C",
					action: () => {
						emit("copy");
					},
					enabled: !selectedCells.isEmpty(),
				},
				{
					text: "Paste",
					accelerator: "CommandOrControl+V",
					action: () => {
						emit("paste");
					},
				},
				{
					item: "Separator",
				},
				{
					text: "Delete",
					accelerator: "Delete",
					action: () => {
						emit("delete");
					},
					enabled: !selectedCells.isEmpty(),
				},
			],
		});
		menu.popup();
	}

	function initKeyboardShortcuts() {
		hotkeyHandler = new HotkeyHandler(canvas, [
			{
				shortcut: "CommandOrControl+X",
				callback: () => {
					emit("cut");
				},
			},
			{
				shortcut: "CommandOrControl+C",
				callback: () => {
					emit("copy");
				},
			},
			{
				shortcut: "CommandOrControl+V",
				callback: () => {
					emit("paste");
				},
			},
			{
				shortcut: "Escape",
				callback: () => {
					deselectAllCells();
				},
			},
			{
				shortcut: "Delete",
				callback: () => {
					emit("delete");
				},
			},
			{
				shortcut: "CommandOrControl+0",
				callback: () => {
					centerCamera();
				},
			},
			{
				shortcut: "CommandOrControl+1",
				callback: () => {
					centerCameraOnSelection();
				},
			},
			{
				shortcut: "F",
				callback: () => {
					isPrintDesignModalOpen = true;
				},
			},
		]);
	}

	function deinitKeyboardShortcuts() {
		hotkeyHandler.dispose();
	}

	let inputMode = $derived(inputModeChanged(inputModeIdx));
	// svelte-ignore state_referenced_locally
	let oldInputMode = inputModeIdx;

	$effect(() => {
		while (cellScene.getLayersCount() < layers.length) {
			cellScene.addLayer(layers.length);
		}
		while (cellScene.getLayersCount() > layers.length) {
			cellScene.removeLayer(cellScene.getLayersCount() - 1);
		}
		drawCurrentLayer();
	});

	$effect(() => {
		selectedLayer;
		selectedCells.clear();
	});

	$effect(() => {
		drawCurrentLayer();
	});

	$effect(() => {
		if (selectedLayer === undefined) return;
		const cellArch = get_cell_architecture();
		const size = cellArch.side_length;
		(infinite_grid.material as THREE.ShaderMaterial).uniforms.uSize1.value =
			size;
		(infinite_grid.material as THREE.ShaderMaterial).uniforms.uSize2.value =
			size * 5;
	});
</script>

<div class="relative w-full flex h-full items-stretch bg-muted" bind:this={container}>
	{#if properties.cell_edit_enabled}
		<DesignToolbar
			bind:inputModeIdx
			bind:snapEnabled={cellSnappingEnabled}
			bind:snapDivider={cellSnappingDivider}
		/>
	{/if}
	<div
		bind:this={selection_rect}
		class="absolute hidden border-2 pointer-events-none border-slate-500 bg-slate-500 bg-opacity-50"
	></div>
	<canvas tabindex="0" bind:this={canvas} class=""></canvas>
	<PrintDesignModal
		bind:isOpen={isPrintDesignModalOpen}
		applyCallback={(printOptions) =>
			printDesign(renderToOffscreenCanvas, printOptions)}
		designPrintOptions={PRINT_OPTIONS[0]}
	/>
</div>
