<script lang="ts">
	import Input from "$lib/components/ui/input/input.svelte";
	import Label from "$lib/components/ui/label/label.svelte";
	import { Checkbox } from "$lib/components/ui/checkbox/index.js";
	import {
		inputsEqual,
		InputType,
		type PanelInput,
		type QCASimulation,
		type Signal,
	} from "$lib/qca-simulation";
	import { onMount } from "svelte";

	let inputs: PanelInput[] = $state([]);
	let filteredInputs: PanelInput[] = $state([]);
	let searchTerm: string = $state("");

	interface Props {
		qcaSimulation: QCASimulation | undefined;
		selectedInputs: PanelInput[];
		inputType: InputType;
	}
	let {
		qcaSimulation,
		selectedInputs = $bindable([]),
		inputType = InputType.SIGNAL,
	}: Props = $props();

	let selectedInputsString: string[] = $derived(
		selectedInputs.map((input) => getInputName(input)),
	);

	onMount(() => {
		inputs = [];
		filteredInputs = [];
		if (qcaSimulation) getSignals(qcaSimulation);
	});

	$effect(() => {
		if (qcaSimulation) getSignals(qcaSimulation);
	});

	function getSignals(simulation: QCASimulation) {
		inputs = simulation.getInputs(inputType);
		searchTerm = "";
	}

	function toggleInputSelection(input: PanelInput) {
		if (selectedInputsString.includes(getInputName(input))) {
			selectedInputs = selectedInputs.filter(
				(_input) => !inputsEqual(_input, input),
			);
		} else {
			selectedInputs = [...selectedInputs, input];
		}
	}

	function applyFilter() {
		if (!searchTerm) {
			filteredInputs = inputs;
		} else {
			const lowerSearchTerm = searchTerm.toLowerCase();
			filteredInputs = inputs.filter((input) =>
				getInputName(input).toLowerCase().includes(lowerSearchTerm),
			);
		}
	}

	function getInputName(input: PanelInput): string {
		if (!qcaSimulation) {
			throw new Error("QCASimulation is not defined");
		}

		switch (input.type) {
			case InputType.SIGNAL:
				return qcaSimulation.getSignal(input.index).name;
			case InputType.CELL:
				return (
					qcaSimulation.getCell(input.index).label ||
					`Cell ${input.index}`
				);
			default:
				return "Unknown Input";
		}
	}

	$effect(() => {
		searchTerm;
		applyFilter();
	});
</script>

<div class="flex flex-col gap-2 p-2 border rounded-md">
	<div class="flex items-center justify-between">
		<Label for="inputs-list" class="text-lg font-medium"
			>Input Selector</Label
		>
		<div class="text-sm">
			{selectedInputs.length} selected
		</div>
	</div>

	<!-- Search input -->
	<div class="relative">
		<Input
			type="text"
			placeholder="Search inputs..."
			class="w-full pr-10"
			bind:value={searchTerm}
		/>
	</div>

	<hr class="border-t" />

	<div class="flex flex-col gap-1 overflow-y-auto">
		{#each filteredInputs as input}
			<div
				class="flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors duration-150"
			>
				<Checkbox
					checked={selectedInputsString.includes(getInputName(input))}
					onCheckedChange={() => toggleInputSelection(input)}
					id="input-{getInputName(input)}"
				/>
				<Label
					for="input-{getInputName(input)}"
					class="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
				>
					{getInputName(input)}
				</Label>
			</div>
		{/each}

		{#if filteredInputs.length === 0}
			<div class="p-4 text-center text-accent-foreground">
				No inputs found
			</div>
		{/if}
	</div>
</div>
