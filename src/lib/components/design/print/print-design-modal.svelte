<script lang="ts">
	import CustomOptions from "$lib/custom-options/custom-options.svelte";
	import BaseModal from "$lib/modals/base-modal.svelte";
	import type { DesignPrintOptions } from "./print-design";

	interface Props {
		isOpen: boolean;
		applyCallback: (printOptions: DesignPrintOptions) => void;
		designPrintOptions: DesignPrintOptions;
	}

	let {
		isOpen = $bindable(),
		applyCallback,
		designPrintOptions,
	}: Props = $props();

	let designOptionValues = $state(designPrintOptions.optionValues);

	function applyCallbackWrapper() {
		designPrintOptions.optionValues = designOptionValues;
		applyCallback(designPrintOptions);
	}
</script>

<BaseModal
	bind:open={isOpen}
	type="confirm"
	applyCallback={applyCallbackWrapper}
>
	{#snippet title()}
		{designPrintOptions.name}
	{/snippet}
	{#snippet description()}
		{designPrintOptions.description}
	{/snippet}
	<div class="flex flex-col gap-2">
		<CustomOptions
			optionList={designPrintOptions.options}
			bind:optionValues={designOptionValues}
		></CustomOptions>
	</div>
</BaseModal>
