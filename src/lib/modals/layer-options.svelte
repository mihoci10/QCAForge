<script lang="ts">
    import { type CellArchitecture, DEFAULT_CELL_ARCHITECTURES } from '$lib/CellArchitecture';
    import Icon from '@iconify/svelte';
    import BaseModal from './base-modal.svelte';
    import type { Layer } from '$lib/Layer';
    import { Label } from '$lib/components/ui/label';
    import * as Select from '$lib/components/ui/select';
    import { Button } from '$lib/components/ui/button';
    import CellArchitectureOptions from './cell-architecture-options.svelte';

	interface Props {
		isOpen: boolean;
		applyCallback?: (data: any) => void;
		layer: Layer;
	}

let { 
	isOpen = $bindable(),
	applyCallback,
	layer,
}: Props = $props();

	let selected_arch_id: string|undefined = $state();
	let selected_arch_display = $derived(
		selected_arch_id ? DEFAULT_CELL_ARCHITECTURES[parseInt(selected_arch_id)].name : 'Select architecture'
	);

	let openModal: boolean = $state(false);

	function openCellArchitectureOptions(){
		openModal = true;
	}

</script>

<BaseModal bind:open={isOpen} type='confirm' {applyCallback}>
	{#snippet title()}
		{layer.name} settings
	{/snippet}
	{#snippet description()}
		Configure parameters for the selected layer.
	{/snippet}
	<div class="flex flex-col gap-2">
		<div class="flex flex-col gap-1.5">
			<Label for='cell_architecture'>Cell architecture</Label>
			<div class="flex gap-2">
				<Select.Root type="single" bind:value={selected_arch_id}>
					<Select.Trigger>
						{selected_arch_display}
					</Select.Trigger>
					<Select.Content>
						{#each DEFAULT_CELL_ARCHITECTURES as arcOption, i}
							<Select.Item value={i.toString()} label={arcOption.name}/>
						{/each}
					</Select.Content>
				</Select.Root>
		
				<Button variant='outline' size='icon' onclick={() => openCellArchitectureOptions()}>
					<Icon icon="material-symbols:settings" />
				</Button>
				<CellArchitectureOptions bind:isOpen={openModal} bind:cell_architecture={DEFAULT_CELL_ARCHITECTURES[parseInt(selected_arch_id!)]}/>
			</div>
		</div>
	</div>
</BaseModal>