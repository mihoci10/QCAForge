<script lang="ts">
    import { type CellArchitecture, createCellArchitecture } from '$lib/CellArchitecture';
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

	const DEFAULT_CELL_ARCHS : [string, CellArchitecture][] = [
		['Two state', createCellArchitecture(20, 5, 4, 6.36)],
		['Tri state 60', createCellArchitecture(60, 10, 8, 60*Math.sqrt(2)/2)],
		['Tri state 72', createCellArchitecture(72, 10, 8, (72*2/3)/(2*Math.sin(Math.PI/8)))],
		['Tri state 110', createCellArchitecture(110, 10, 8, 110/(2*Math.sin(Math.PI/8)))]
	];

	let selected_arch_id: string|undefined = $state();
	let selected_arch_display = $derived(
		selected_arch_id ? DEFAULT_CELL_ARCHS[parseInt(selected_arch_id)][0] : 'Select architecture'
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
						{#each DEFAULT_CELL_ARCHS as arcOption, i}
							<Select.Item value={i.toString()} label={arcOption[0]}/>
						{/each}
					</Select.Content>
				</Select.Root>
		
				<Button variant='outline' size='icon' onclick={() => openCellArchitectureOptions()}>
					<Icon icon="material-symbols:settings" />
				</Button>
				<CellArchitectureOptions bind:isOpen={openModal} cell_architecture={DEFAULT_CELL_ARCHS[parseInt(selected_arch_id!)][1]}/>
			</div>
		</div>
	</div>
</BaseModal>