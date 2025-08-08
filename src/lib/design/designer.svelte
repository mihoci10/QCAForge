<script lang="ts">
	import * as Accordion from "$lib/components/ui/accordion";
	import * as Resizable from "$lib/components/ui/resizable";

	import type { Layer } from "../Layer";
	import type { SimulationModel } from "../SimulationModel";
	import SimSettingsPanel from "./panels/sim-settings-panel.svelte";
	import CellPropsPanel from "./panels/cell-props-panel.svelte";
	import LayersPanel from "./panels/layers-panel.svelte";

	import type { CellArchitecture } from "../CellArchitecture";
	import DesignView, {
		type DesignViewProps,
	} from "$lib/components/design-view.svelte";
	import type { Cell, CellIndex } from "$lib/Cell";
	import { Set } from "typescript-collections";

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
</script>

<Resizable.PaneGroup direction="horizontal">
	<Resizable.Pane defaultSize={15} minSize={10}>
		<div class="h-full bg-surface-500 overflow-y-auto pr-2">
			<Accordion.Root type="multiple">
				<SimSettingsPanel
					bind:selected_model_id
					bind:simulation_models
				/>
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
		</div>
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
