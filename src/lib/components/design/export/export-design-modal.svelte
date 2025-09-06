<script lang="ts">
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import BaseModal from "$lib/modals/base-modal.svelte";

	interface Props {
		isOpen: boolean;
		applyCallback: () => void;
        designExportOptions: DesignExportOptions;
	}

	let {
		isOpen = $bindable(),
		applyCallback,
        designExportOptions,
	}: Props = $props();
    
</script>

<BaseModal bind:open={isOpen} type="confirm" applyCallback={() => {}}>
	{#snippet title()}
		{designExportOptions.name} settings
	{/snippet}
	{#snippet description()}
		Configure parameters for the selected model.
	{/snippet}
	<div class="flex flex-col gap-2">
		
	</div>
</BaseModal>
