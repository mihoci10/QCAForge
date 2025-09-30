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
	}

	let {
		selected_model_id = $bindable(),
		layers = $bindable(),
		simulation_models = $bindable(),
		cell_architectures = $bindable(),
		designViewProps = $bindable(),
	}: Props = $props();

	let designView: DesignView | undefined = $state();
	let selectedCells: Set<CellIndex> = $state(new Set<CellIndex>());
	let selectedLayer: number = $state(0);
	let cellPropsPanel: CellPropsPanel | undefined = $state();

	export function redraw() {
		designView!.drawCurrentLayer();
	}

	function propertyChangedCallback() {}

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

<Resizable.PaneGroup direction="horizontal">
	<Resizable.Pane defaultSize={15} minSize={10}>
		<!-- Sidebar -->
		<ScrollArea class="h-full bg-sidebar px-2">
			<Accordion.Root type="multiple" value={["layers", "cell-props"]}>
				<LayersPanel
					bind:layers
					bind:selectedLayer
					bind:cell_architectures
				/>
				<CellPropsPanel
					bind:layers
					{selectedCells}
					bind:this={cellPropsPanel}
					{propertyChangedCallback}
				/>
			</Accordion.Root>
		</ScrollArea>
	</Resizable.Pane>
	<Resizable.Handle />
	<Resizable.Pane minSize={10}>
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
	</Resizable.Pane>
</Resizable.PaneGroup>
