<script lang="ts">
	import CustomOptions from "$lib/custom-options/custom-options.svelte";
	import BaseModal from "$lib/modals/base-modal.svelte";
	import type { DesignPrintOptions } from "./print-design";

	interface Props {
		isOpen: boolean;
		applyCallback: (printOptions: DesignPrintOptions) => void;
		designPrintOptions: DesignPrintOptions[];
	}

	let {
		isOpen = $bindable(),
		applyCallback,
		designPrintOptions,
	}: Props = $props();

	let selectedFormatId = $state(designPrintOptions[0].id);
	let selectedFormat = $derived(
		designPrintOptions.find((option) => option.id === selectedFormatId) ??
			designPrintOptions[0],
	);
	let designOptionValues = $state(designPrintOptions[0].optionValues);

	function applyCallbackWrapper() {
		selectedFormat.optionValues = designOptionValues;
		applyCallback(selectedFormat);
	}
</script>

<BaseModal
	bind:open={isOpen}
	type="confirm"
	applyCallback={applyCallbackWrapper}
>
	{#snippet title()}
		Export Design Figure
	{/snippet}
	{#snippet description()}
		Choose an image format for the circuit figure.
	{/snippet}
	<div class="flex flex-col gap-2">
		<label for="print-format">Format</label>
		<select
			id="print-format"
			class="rounded-md border bg-background px-2 py-1"
			bind:value={selectedFormatId}
			onchange={() => (designOptionValues = selectedFormat.optionValues)}
		>
			{#each designPrintOptions as printOption}
				<option value={printOption.id}>{printOption.name}</option>
			{/each}
		</select>
		<CustomOptions
			optionList={selectedFormat.options}
			bind:optionValues={designOptionValues}
		></CustomOptions>
	</div>
</BaseModal>
