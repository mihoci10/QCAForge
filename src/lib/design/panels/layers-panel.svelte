<!-- @migration-task Error while migrating Svelte code: Cannot use `export let` in runes mode — use `$props()` instead -->
<script lang="ts">
	import {
		get_default_cell_architecture_id,
		type CellArchitecture,
	} from "$lib/CellArchitecture";
	import type { Layer } from "$lib/Layer";
	import Icon from "@iconify/svelte";
	import * as Accordion from "$lib/components/ui/accordion";
	import { ScrollArea } from "$lib/components/ui/scroll-area";
	import { Button } from "$lib/components/ui/button";
	import LayerOptions from "$lib/modals/layer-options.svelte";

	interface Props {
		layers: Layer[];
		selectedLayer: number;
		cell_architectures: Map<string, CellArchitecture>;
	}

	let {
		layers = $bindable(),
		selectedLayer = $bindable(),
		cell_architectures = $bindable(),
	}: Props = $props();

	let settings_layer_id: number | undefined = $state();
	let openModal: boolean = $state(false);

	function openLayerOptions(layerIdx: number) {
		settings_layer_id = layerIdx;
		openModal = true;
	}

	function getIndexOfLayer(layerName: string): number {
		for (let i = 0; i < layers.length; i++) {
			if (layers[i].name == layerName) return i;
		}
		return NaN;
	}

	function layerNameExists(layerName: string): boolean {
		return !isNaN(getIndexOfLayer(layerName));
	}

	function addLayer() {
		let newLayerName = "New Layer";
		let layerCnt = 0;
		while (layerNameExists(newLayerName)) {
			layerCnt++;
			newLayerName = `New Layer ${layerCnt}`;
		}

		const i = selectedLayer;
		const newLayerId = i + 1;

		layers.splice(newLayerId, 0, {
			name: newLayerName,
			visible: true,
			cell_architecture_id: get_default_cell_architecture_id(),
			cells: [],
			z_position: 0,
		});

		selectedLayer = newLayerId;
		layers = layers;
	}

	function removeLayer() {
		if (layers.length == 1) return;

		const i = selectedLayer;
		layers.splice(i, 1);

		selectedLayer = Math.max(selectedLayer - 1, 0);
		layers = layers;
	}

	function moveLayerDown() {
		if (selectedLayer == layers.length - 1) return;

		layers[selectedLayer] = layers.splice(
			selectedLayer + 1,
			1,
			layers[selectedLayer],
		)[0];

		selectedLayer++;
		layers = layers;
	}

	function moveLayerUp() {
		if (selectedLayer == 0) return;

		layers[selectedLayer] = layers.splice(
			selectedLayer - 1,
			1,
			layers[selectedLayer],
		)[0];

		selectedLayer--;
		layers = layers;
	}

	function applyCallback() {}
</script>

<Accordion.Item value="layers">
	<Accordion.Trigger>
		<div class="flex items-center gap-1.5">
			Layers
			<Icon icon="material-symbols:layers" />
		</div>
	</Accordion.Trigger>
	<Accordion.Content>
		<div class="flex gap-2 mb-4">
			<Button variant="outline" size="icon" onclick={addLayer}>
				<Icon icon="mdi:plus" />
			</Button>
			<Button variant="outline" size="icon" onclick={removeLayer}>
				<Icon icon="mdi:minus" />
			</Button>
			<Button variant="outline" size="icon" onclick={moveLayerUp}>
				<Icon icon="mdi:arrow-up" />
			</Button>
			<Button variant="outline" size="icon" onclick={moveLayerDown}>
				<Icon icon="mdi:arrow-down" />
			</Button>
		</div>

		<ScrollArea class="overflow-y-auto h-32 resize-y rounded-md border bg-background">
			{#each layers as layer, index}
				<div
					class="flex items-center justify-between px-2 py-2 border-b w-full hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
					onclick={() => (selectedLayer = index)}
					data-state={selectedLayer === index ? "on" : "off"}
				>
					<Button
						variant="ghost"
						size="icon"
						onclick={(e) => {
							e.stopPropagation();
							layer.visible = !layer.visible;
						}}
						class="h-8 w-8"
					>
						<Icon
							icon={layer.visible ? "mdi:eye" : "mdi:eye-closed"}
						/>
					</Button>
					<span class="select-none cursor-default text-sm font-medium truncate flex-1 px-2">{layer.name}</span>
					<Button
						variant="ghost"
						size="icon"
						onclick={(e) => {
							e.stopPropagation();
							openLayerOptions(index);
						}}
						class="h-8 w-8"
					>
						<Icon icon="material-symbols:settings" />
					</Button>
				</div>
			{/each}
		</ScrollArea>
		<LayerOptions
			bind:isOpen={openModal}
			bind:layer={layers[settings_layer_id!]}
			bind:cell_architectures
			{applyCallback}
		/>
	</Accordion.Content>
</Accordion.Item>
