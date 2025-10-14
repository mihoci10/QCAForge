<script lang="ts">
	import {
		loadSimulationModels,
		type SimulationModel,
	} from "$lib/SimulationModel";
	import {
		generate_default_cell_architectures,
		get_default_cell_architecture_id,
		type CellArchitecture,
	} from "$lib/CellArchitecture";
	import BaseModal from "./base-modal.svelte";
	import { Label } from "$lib/components/ui/label";
	import * as Select from "$lib/components/ui/select";
	import { onMount } from "svelte";
	import type { NewDesignConfig } from "$lib/qca-design";

	interface Props {
		isOpen: boolean;
		onCreateNewDesign: (designConfig: NewDesignConfig) => void;
	}

	let { isOpen = $bindable(), onCreateNewDesign }: Props = $props();

	let simulationModels: SimulationModel[] = $state([]);
	let cellArchitectures: Map<string, CellArchitecture> = $state(new Map());
	let selectedSimulationModel: string = $state("");
	let selectedCellArchitecture: string = $state("");

	onMount(async () => {
		try {
			simulationModels = await loadSimulationModels();
			if (simulationModels.length > 0) {
				selectedSimulationModel = simulationModels[0].id;
			}

			cellArchitectures = generate_default_cell_architectures();
			selectedCellArchitecture = get_default_cell_architecture_id();
		} catch (error) {
			console.error("Failed to load design options:", error);
		}
	});

	function handleCreateDesign(data: any) {
		const designConfig: NewDesignConfig = {
			sim_model_id: selectedSimulationModel,
			cell_architecture_id: selectedCellArchitecture,
		};

		onCreateNewDesign(designConfig);
	}

	// Reset form when modal opens
	$effect(() => {
		if (isOpen) {
			if (simulationModels.length > 0) {
				selectedSimulationModel = simulationModels[0].id;
			}
			if (cellArchitectures.size > 0) {
				selectedCellArchitecture = get_default_cell_architecture_id();
			}
		}
	});
</script>

<BaseModal bind:open={isOpen} type="confirm" applyCallback={handleCreateDesign}>
	{#snippet title()}
		New Design Setup
	{/snippet}
	{#snippet description()}
		Configure the parameters for your new QCA design.
	{/snippet}

	<div class="flex flex-col gap-4">
		<!-- Simulation Settings -->
		<div class="flex flex-col gap-1.5">
			<Label for="simulation_model">Simulation Model</Label>
			<Select.Root bind:value={selectedSimulationModel} type="single">
				<Select.Trigger>
					{#if selectedSimulationModel !== ""}
						{simulationModels.find(
							(m) => m.id === selectedSimulationModel,
						)?.name}
					{:else}
						Select simulation model
					{/if}
				</Select.Trigger>
				<Select.Content>
					{#each simulationModels as model}
						<Select.Item value={model.id}>{model.name}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>

		<div class="flex flex-col gap-1.5">
			<Label for="cell_architecture">Cell Architecture</Label>
			<Select.Root bind:value={selectedCellArchitecture} type="single">
				<Select.Trigger>
					{#if selectedCellArchitecture !== ""}
						{cellArchitectures.get(selectedCellArchitecture)?.name}
					{:else}
						Select cell architecture
					{/if}
				</Select.Trigger>
				<Select.Content>
					{#each cellArchitectures as [id, architecture]}
						<Select.Item value={architecture.id}
							>{architecture.name}</Select.Item
						>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
	</div>
</BaseModal>
