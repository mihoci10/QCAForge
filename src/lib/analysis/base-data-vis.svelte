<script lang="ts">
    import { Label } from "$lib/components/ui/label";
    import { simulation } from "$lib/globals";
    import type { QCASimulation, SignalIndex } from "$lib/qca-simulation";
	import type { Snippet } from "svelte";
	import type { DOMAttributes } from "svelte/elements";
 
	type Props = DOMAttributes<HTMLDivElement> & {
		qcaSimulation: QCASimulation | undefined;
		title: string;
        children: Snippet | undefined;
		shownSignals: SignalIndex[];
		beforeLoadData?: () => void;
		loadSignalData?: (signalIndex: SignalIndex, data: Float64Array) => void;
		afterLoadData?: () => void;
	};
 
	let {
		qcaSimulation,
		title,
        children,
		shownSignals = $bindable([]),
		beforeLoadData,
		loadSignalData,
		afterLoadData,
		...restProps
	}: Props = $props();

	let status: 'loading' | 'success' | 'error' | 'empty' = $state('empty');

	$effect(() => {
		if (qcaSimulation) {
			loadData();
		}
	});

	function loadData() {
		if (!qcaSimulation) {
			status = 'empty';
			return;
		}
		status = 'loading';
		beforeLoadData?.();
		const allSignals = shownSignals.map((signal) => qcaSimulation.getSignalData(signal));
		Promise.all(allSignals).then((signalData) => {
			signalData.forEach((data, i) => {
				loadSignalData?.(shownSignals[i], data);
			});
			status = shownSignals.length > 0 ? 'success' : 'empty';
		}).catch((error) => {
			console.error("Error loading data:", error);
			status = 'error';
		}).finally(() => {
			afterLoadData?.();
		});
	}
</script>

<div class='h-full flex flex-col items-center relative' {...restProps}>
    <Label class="text-lg font-semibold">{title}</Label>
	{@render children?.()}
	{#if status !== 'success'}
	<div class="absolute flex flex-col items-center justify-center h-full w-full">
		{#if status === 'loading'}
			<Label class="text-lg text-gray-500">Loading data...</Label>
		{:else if status === 'error'}
			<Label class="text-lg text-red-500">Error loading data</Label>
		{:else if status === 'empty'}
			<Label class="text-lg text-gray-500">No data displayed</Label>
		{:else}
			<Label class="text-lg text-gray-500">Unknown status</Label>
		{/if}
	</div>
	{/if}
</div>
