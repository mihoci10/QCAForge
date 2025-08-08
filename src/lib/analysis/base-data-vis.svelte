<script lang="ts">
	import { Label } from "$lib/components/ui/label";
	import {
		InputType,
		type Input,
		type QCASimulation,
		type SignalIndex,
	} from "$lib/qca-simulation";
	import type { Snippet } from "svelte";
	import type { DOMAttributes } from "svelte/elements";

	type Props = DOMAttributes<HTMLDivElement> & {
		qcaSimulation: QCASimulation | undefined;
		title: string;
		children: Snippet | undefined;
		inputs: Input[] | undefined;
		needDataLoad: boolean;
		beforeLoadData?: () => void;
		loadInputData?: (input: Input, data: Float64Array[]) => void;
		afterLoadData?: () => void;
		getNeededInputs?: () => Input[];
	};

	let {
		qcaSimulation,
		title,
		children,
		inputs,
		needDataLoad,
		beforeLoadData,
		loadInputData,
		afterLoadData,
		getNeededInputs,
		...restProps
	}: Props = $props();

	let status: "loading" | "success" | "error" | "empty" = $state("empty");

	$effect(() => {
		if (qcaSimulation) {
			loadData();
		}
	});

	function loadData() {
		if (!needDataLoad) {
			status = "success";
			return;
		}

		if (!qcaSimulation) {
			status = "empty";
			return;
		}
		status = "loading";
		const neededInputs = getNeededInputs ? getNeededInputs() : [];
		const loadInputs = [
			...new Set([
				...(inputs ?? qcaSimulation.getInputs(InputType.CELL)),
				...neededInputs,
			]),
		];
		beforeLoadData?.();
		const allSignals = loadInputs.map((input) =>
			qcaSimulation.getInputData(input),
		);
		Promise.all(allSignals)
			.then((signalData) => {
				signalData.forEach((data, i) => {
					loadInputData?.(loadInputs[i], data);
				});
				status = loadInputs.length > 0 ? "success" : "empty";
			})
			.catch((error) => {
				console.error("Error loading data:", error);
				status = "error";
			})
			.finally(() => {
				afterLoadData?.();
			});
	}
</script>

<div class="h-full flex flex-col items-center relative" {...restProps}>
	<!-- <Label class="text-lg font-semibold">{title}</Label> -->
	{@render children?.()}
	{#if status !== "success"}
		<div
			class="absolute flex flex-col items-center justify-center w-full h-full"
		>
			{#if status === "loading"}
				<Label class="text-lg text-gray-500">Loading data...</Label>
			{:else if status === "error"}
				<Label class="text-lg text-red-500">Error loading data</Label>
			{:else if status === "empty"}
				<Label class="text-lg text-gray-500">No data displayed</Label>
			{:else}
				<Label class="text-lg text-gray-500">Unknown status</Label>
			{/if}
		</div>
	{/if}
</div>
