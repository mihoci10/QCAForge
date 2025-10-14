<script lang="ts">
	import { startSimulation } from "$lib/Simulation";
	import type { SimulationModel } from "$lib/SimulationModel";
	import { toast } from "svelte-sonner";
	import { createDesign } from "$lib/qca-design";
	import type { Layer } from "$lib/Layer.js";
	import type { CellArchitecture } from "$lib/CellArchitecture";
	import Button from "$lib/components/ui/button/button.svelte";
	import SimulationProgressToast from "$lib/toasts/simulation-progress-toast.svelte";
	import * as Select from "$lib/components/ui/select";
	import Icon from "@iconify/svelte";
	import SimModelOptions from "$lib/modals/sim-model-options.svelte";
	import ClockGeneratorOptions from "$lib/modals/clock-generator-options.svelte";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import {
		getCurrentWindow,
		ProgressBarStatus,
	} from "@tauri-apps/api/window";
	import { AppControl } from "$lib/utils/app-control";

	interface Props {
		selected_model_id: string | undefined;
		simulation_models: Map<string, SimulationModel>;
		layers: Layer[];
		cell_architectures: Map<string, CellArchitecture>;
	}

	let {
		selected_model_id = $bindable(),
		simulation_models = $bindable(),
		layers = $bindable(),
		cell_architectures = $bindable(),
	}: Props = $props();

	// Modal state for simulation settings
	let openSimOptionsModal: boolean = $state(false);
	let openClockGeneratorOptionsModal: boolean = $state(false);
	let selectedModel: SimulationModel | undefined = $derived(
		selected_model_id
			? simulation_models.get(selected_model_id)
			: undefined,
	);

	const selected_model_display = $derived(
		selected_model_id
			? simulation_models.get(selected_model_id)?.name
			: "Select model",
	);

	function openModelOptions() {
		if (!selected_model_id) {
			toast.error("Please select a simulation model first.");
			return;
		}

		if (!simulation_models.has(selected_model_id!)) {
			toast.error("Invalid simulation model!");
			return;
		}

		openSimOptionsModal = true;
	}

	function openClockGeneratorOptions() {
		if (!selected_model_id) {
			toast.error("Please select a simulation model first.");
			return;
		}

		if (!simulation_models.has(selected_model_id!)) {
			toast.error("Invalid simulation model!");
			return;
		}

		openClockGeneratorOptionsModal = true;
	}

	function applyCallback() {
		if (!selectedModel) throw new Error("Invalid simulation model!");
		simulation_models = new Map(
			simulation_models.set(selectedModel.id, selectedModel),
		);
	}

	function executeSimulation() {
		if (!selected_model_id) console.error("invalid simulation model id!");

		if (!simulation_models.has(selected_model_id!))
			console.error("invalid simulation model!");

		let simulation_toast = toast(SimulationProgressToast, {
			duration: Infinity,
			action: { label: "Cancel", onClick: (e) => {} },
		});

		createDesign(
			layers,
			selected_model_id,
			simulation_models,
			cell_architectures,
		)
			.then((design) => {
				startSimulation(design)
					.then((res) => {
						onSimulationCompleted();
						toast.success("Simulation finished successfully.", {
							id: simulation_toast,
							duration: 5000,
							action: undefined,
						});
					})
					.catch((err) => {
						onSimulationError();
						console.error(err);
						toast.error("Simulation failed.", {
							id: simulation_toast,
							duration: 5000,
							action: undefined,
						});
					});
			})
			.catch((err) => {
				onSimulationError();
				console.error(err);
				toast.error("Simulation failed.", {
					id: simulation_toast,
					duration: 5000,
					action: undefined,
				});
			});
	}

	function cancelSimulation() {}

	function onSimulationCompleted() {
		getCurrentWindow().setProgressBar({ status: ProgressBarStatus.None });
		AppControl.sendSystemNotification(
			"Simulation Completed",
			"The simulation has finished successfully.",
		);
	}

	function onSimulationError() {
		getCurrentWindow().setProgressBar({ status: ProgressBarStatus.Error });
		AppControl.sendSystemNotification(
			"Simulation Error",
			"The simulation has encountered an error.",
		);
	}
</script>

<div class="py-1">
	<div class="flex flex-row">
		<div class="ml-auto flex items-center gap-2">
			<!-- Simulation Model Dropdown -->
			<Select.Root type="single" bind:value={selected_model_id}>
				<Select.Trigger class="w-48">
					{selected_model_display}
				</Select.Trigger>
				<Select.Content>
					{#each simulation_models.values() as model}
						<Select.Item value={model.id} label={model.name} />
					{/each}
				</Select.Content>
			</Select.Root>

			<!-- Settings Button -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger disabled={!selected_model_id}>
					<Icon icon="material-symbols:more-vert" class="w-6 h-6" />
				</DropdownMenu.Trigger>
				<DropdownMenu.Content>
					<DropdownMenu.Group>
						<DropdownMenu.Item onclick={openModelOptions}
							>Model settings</DropdownMenu.Item
						>
						<DropdownMenu.Item onclick={openClockGeneratorOptions}
							>Clock generator settings</DropdownMenu.Item
						>
					</DropdownMenu.Group>
				</DropdownMenu.Content>
			</DropdownMenu.Root>

			<!-- Play/Run Simulation Button -->
			<Button
				variant="ghost"
				size="icon"
				disabled={!selected_model_id}
				onclick={executeSimulation}
				title="Run Simulation"
			>
				<Icon
					icon="material-symbols:play-arrow"
					class="w-8 h-8"
					color="#006400"
				/>
			</Button>

			<div class="w-6"></div>
		</div>
	</div>
</div>

<!-- Simulation Settings Modals -->
<SimModelOptions
	bind:isOpen={openSimOptionsModal}
	model={selectedModel!}
	{applyCallback}
/>

<ClockGeneratorOptions
	bind:isOpen={openClockGeneratorOptionsModal}
	model={selectedModel!}
	{applyCallback}
/>
