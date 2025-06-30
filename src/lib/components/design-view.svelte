<script lang="ts">
	import { onDestroy, onMount } from "svelte";
	import Stats from "stats.js";
	import * as THREE from "three";
	import { CellGeometry } from "../CellGeometry";
	import { CellIndex, parseCellIndex, type Cell } from "../Cell";
	import { CellScene } from "../CellScene";
	import { OrbitControls } from "../utils/OrbitControls";
	import type { Layer } from "../Layer";

	import { Set } from "typescript-collections";
	import { Menu } from "@tauri-apps/api/menu";
	import InfiniteGrid from "../utils/infinite-grid";
	import { writeText, readText } from "@tauri-apps/plugin-clipboard-manager";

	import type { CellArchitecture } from "../CellArchitecture";
	import DesignToolbar from "./design-toolbar.svelte";
	import { HotkeyHandler } from "../utils/hotkey-handler";

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
	let ghostGeometry: CellGeometry | undefined;

	let stats: Stats;
	let statsDrawCall: Stats.Panel;

	let inputModeIdx: number = $state(0);

	let mouseStartPos: THREE.Vector2 | undefined;
	let current_mouse_pos: THREE.Vector2 | undefined;
	let multiselect: boolean = false;
	let mouseDragging: boolean = false;
	let hotkeyHandler: HotkeyHandler;

	let cachedCellsPos: { [id: string]: [pos_x: number, pos_y: number] } = {};

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
		selectedLayer: number;
		cell_architectures: Map<string, CellArchitecture>;
		selectedCells: Set<CellIndex>;
		properties: DesignViewProps;
		onGetNewCellProps?: () => Cell;
		onSelectedCellsUpdated?: (selectedCells: Set<CellIndex>) => void;
	}

	let {
		layers,
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
		properties.cell_snapping_divider ??
			get_current_cell_architecture().side_length,
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
		renderer.setClearAlpha(0);
		renderer.setClearColor(0);
		renderer.autoClear = false;

		globalScene = new THREE.Scene();
		camera = new THREE.PerspectiveCamera(75, 1, 0.1, 3000);

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
			new THREE.Color("white"),
			8000,
			"xyz",
		);
		globalScene.add(infinite_grid);

		if (properties.cell_edit_enabled)
			ghostGeometry = new CellGeometry(true);

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

	function get_current_cell_architecture() {
		return cell_architectures.get(
			layers[selectedLayer].cell_architecture_id,
		)!;
	}

	function createGhostMesh() {
		if (!ghostGeometry)
			throw new Error("Ghost geometry is not initialized");
		if (!onGetNewCellProps)
			throw new Error("onGetNewCellProps callback is not defined");

		const cell_template = onGetNewCellProps();
		ghostGeometry.update_draw_mesh(
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
			get_current_cell_architecture(),
		);
		globalScene.add(
			ghostGeometry.getDrawMesh() as unknown as THREE.Object3D,
		);
	}

	function removeGhostMesh() {
		if (!ghostGeometry)
			throw new Error("Ghost geometry is not initialized");

		ghostGeometry.update_draw_mesh(
			[],
			new Set(),
			get_current_cell_architecture(),
		);
		globalScene.remove(
			ghostGeometry.getDrawMesh() as unknown as THREE.Object3D,
		);
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

		switch (e.code) {
			case "Delete": {
				deleteCells(selectedCells);
			}
		}
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
		onSelectedCellsUpdated?.(selectedCells);
	}

	export function drawCurrentLayer() {
		cellScene
			.getLayer(selectedLayer)
			.update_geometry(
				layers[selectedLayer],
				selectedCells,
				get_current_cell_architecture(),
			);
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
					get_current_cell_architecture().side_length)
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

		const cell_size = get_current_cell_architecture().side_length;
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
		const cell_architecture = get_current_cell_architecture();
		const cell_template = onGetNewCellProps();
		ghostGeometry.update_draw_mesh(
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

	async function showContextMenu() {
		const menu = await Menu.new({
			items: [
				{
					text: "Copy",
					accelerator: "CommandOrControl+C",
					action: () => {
						saveCellsToClipboard(selectedCells);
					},
					enabled: !selectedCells.isEmpty(),
				},
				{
					text: "Paste",
					accelerator: "CommandOrControl+V",
					action: () => {
						pasteCellsFromClipboard();
					},
				},
			],
		});
		menu.popup();
	}

	function initKeyboardShortcuts() {
		hotkeyHandler = new HotkeyHandler(canvas, [
			{
				shortcut: "CommandOrControl+C",
				callback: () => {
					saveCellsToClipboard(selectedCells);
				},
			},
			{
				shortcut: "CommandOrControl+V",
				callback: () => {
					pasteCellsFromClipboard();
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
	})

	$effect(() => {
		const cellArch = get_current_cell_architecture();
		const size = cellArch.side_length;
		(infinite_grid.material as THREE.ShaderMaterial).uniforms.uSize1.value =
			size;
		(infinite_grid.material as THREE.ShaderMaterial).uniforms.uSize2.value =
			size * 5;
	});
</script>

<div class="relative h-full w-full flex items-stretch" bind:this={container}>
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
</div>
