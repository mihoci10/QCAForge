<script lang="ts">
    import type { CellArchitecture } from "$lib/CellArchitecture";
    import Input from "$lib/components/ui/input/input.svelte";
    import { Label } from "$lib/components/ui/label";
    import BaseModal from "./base-modal.svelte";


	interface Props {
		isOpen: boolean;
		applyCallback?: (data: any) => void;
		cell_architecture: CellArchitecture;
	}

	let { 
		isOpen = $bindable(),
		applyCallback,
		cell_architecture,
	}: Props = $props();

</script>

<BaseModal bind:open={isOpen} type='confirm' {applyCallback}>
	{#snippet title()}
		Cell Architecture settings
	{/snippet}
	{#snippet description()}
		Configure parameters for the selected cell architecture.
	{/snippet}
	<div class="flex flex-col gap-2">
		<div class="flex flex-col gap-1.5">
			<Label for='cell_architecture'>Name</Label>
			<Input />
		</div>
	</div>
</BaseModal>