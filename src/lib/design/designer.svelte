<script lang="ts">
	import * as Accordion from "$lib/components/ui/accordion";
	import * as Resizable from "$lib/components/ui/resizable";

	import type { Layer } from "../Layer";
	import type { SimulationModel } from "../SimulationModel";
	import CellPropsPanel from "./panels/cell-props-panel.svelte";
	import LayersPanel from "./panels/layers-panel.svelte";

	import type { CellArchitecture } from "../CellArchitecture";
	import DesignView, {
		type DesignViewProps,
	} from "$lib/components/design/design-view.svelte";
	import type { Cell, CellIndex } from "$lib/Cell";
	import { Set } from "typescript-collections";
	import { listen } from "@tauri-apps/api/event";
	import ScrollArea from "$lib/components/ui/scroll-area/scroll-area.svelte";

	interface Props {
		selected_model_id: string | undefined;
		layers: Layer[];
		simulation_models: Map<string, SimulationModel>;
		cell_architectures: Map<string, CellArchitecture>;
		designViewProps: DesignViewProps;
		// Added bindable props so parent page can control/observe these
		selectedLayer: number;
		selectedCells: Set<CellIndex>;
		cellPropsPanel: CellPropsPanel | undefined;
		propertyChangedCallback: () => void;
	}

	let {
		selected_model_id = $bindable(),
		layers = $bindable(),
		simulation_models = $bindable(),
		cell_architectures = $bindable(),
		designViewProps = $bindable(),
		// Make internal state bindable to parent
		selectedLayer = $bindable(0),
		selectedCells = $bindable(new Set<CellIndex>()),
		cellPropsPanel = $bindable<CellPropsPanel | undefined>(undefined),
		propertyChangedCallback = $bindable(() => {}),
	}: Props = $props();

	let designView: DesignView | undefined = $state();

	export function redraw() {
		designView!.drawCurrentLayer();
	}


	function onGetNewCellProps(): Cell {
		return cellPropsPanel!.getCellProps();
	}

	function onSelectedCellsUpdated() {
		cellPropsPanel!.selectedCellsUpdated();
	}

	listen("cut", () => {
		if (!designView) return;
		designView.cutSelectedCells();
	});

	listen("copy", () => {
		if (!designView) return;
		designView.copySelectedCells();
	});

	listen("paste", () => {
		if (!designView) return;
		designView.pasteCells();
	});

	listen("delete", () => {
		if (!designView) return;
		designView.deleteSelectedCells();
	});
</script>

<DesignView
	bind:this={designView}
	{cell_architectures}
	bind:layers
	{selectedLayer}
	bind:selectedCells
	bind:properties={designViewProps}
	{onGetNewCellProps}
	{onSelectedCellsUpdated}
/>
