<script lang="ts">
	import * as Accordion from "$lib/components/ui/accordion";
	import * as Resizable from "$lib/components/ui/resizable";

	import type { Layer } from "../Layer";
	import type { SimulationModel } from "../SimulationModel";
	import SimSettingsPanel from "./panels/sim-settings-panel.svelte";
	import CellPropsPanel from "./panels/cell-props-panel.svelte";
	import LayersPanel from "./panels/layers-panel.svelte";

	import type { CellArchitecture } from "../CellArchitecture";
	import DesignView from "$lib/components/design-view.svelte";
	import type { CellIndex } from "$lib/Cell";
	import { Set } from "typescript-collections";

	interface Props {
		selected_model_id: string | undefined;
		layers: Layer[];
		simulation_models: Map<string, SimulationModel>;
		cell_architectures: Map<string, CellArchitecture>;
	}

	let {
		selected_model_id = $bindable(),
		layers = $bindable(),
		simulation_models = $bindable(),
		cell_architectures = $bindable(),
	}: Props = $props();

	let selectedCells: Set<CellIndex> = $state(new Set<CellIndex>());
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
					{layerAddedCallback}
					{layerRemovedCallback}
					{layerMovedCallback}
					{layerChangedCallback}
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
		<DesignView {cell_architectures} {layers} bind:selectedCells />
	</Resizable.Pane>
</Resizable.PaneGroup>
