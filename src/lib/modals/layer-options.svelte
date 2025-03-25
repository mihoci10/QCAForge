<script lang="ts">
    import { createCellArchitecture, type CellArchitecture } from '$lib/CellArchitecture';
    import Icon from '@iconify/svelte';
    import BaseModal from './base-modal.svelte';
    import type { Layer } from '$lib/Layer';
    import { Label } from '$lib/components/ui/label';
    import * as Select from '$lib/components/ui/select';
    import { Button } from '$lib/components/ui/button';
    import CellArchitectureOptions from './cell-architecture-options.svelte';
    import { generateDotDistribution, getPolarization } from '$lib/Cell';

	interface Props {
		isOpen: boolean;
		layer: Layer;
		cell_architectures: Map<string, CellArchitecture>;
		applyCallback: () => void;
	}

	let { 
		isOpen = $bindable(),
		layer = $bindable(),
		cell_architectures = $bindable(),
		applyCallback,
	}: Props = $props();

	let selected_arch_id: string|undefined = $state();
	$effect(() => {selected_arch_id = layer?.cell_architecture_id});
	let selected_arch_display = $derived(
		selected_arch_id ? cell_architectures.get(selected_arch_id)?.name : 'Add a new architecture',
	);

	let openModal: boolean = $state(false);

	function openCellArchitectureOptions(){
		openModal = true;
	}

	function add_new_architecture(){
		let new_cell_architecture = createCellArchitecture('New architecture', 20, 5, 4, 6.36);
		let cnt = 1;
		while(cell_architectures.values().some(arch => arch.name == new_cell_architecture.name)){
			new_cell_architecture.name = `New architecture ${cnt}`;
			cnt++;
		}

		cell_architectures.set(new_cell_architecture.id, new_cell_architecture);
		selected_arch_id = new_cell_architecture.id;
	}

	function remove_selected_architecture(){
		if(!selected_arch_id)
			return;

		const index = cell_architectures.keys().toArray().indexOf(selected_arch_id);
		if (index < 0)
			return;

		cell_architectures.delete(selected_arch_id);

		let new_index = index;
		if (new_index >= cell_architectures.size)
			new_index = cell_architectures.size - 1;

		if (new_index < 0)
			selected_arch_id = undefined;
		else
			selected_arch_id = cell_architectures.keys().toArray()[new_index];
	}

	function applyCallbackInternal(data: any){
		if(!selected_arch_id)
			return;

		layer.cell_architecture_id = selected_arch_id;
		
		const cell_architecture = cell_architectures.get(selected_arch_id)!
		layer.cells.forEach((cell) => {
			let polarization = getPolarization(cell);
			while (polarization.length > cell_architecture.dot_count / 4)
				polarization.pop();
			while (polarization.length < cell_architecture.dot_count / 4)
				polarization.push(0);
			cell.dot_probability_distribution = generateDotDistribution(polarization);
		});

		applyCallback();
	}

</script>

<BaseModal bind:open={isOpen} type='confirm' applyCallback={applyCallbackInternal}>
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
		
				<Button variant='default' size='icon' onclick={() => add_new_architecture()}>
					<Icon icon="material-symbols:add" />
				</Button>
		
				<Button variant='secondary' size='icon' onclick={() => remove_selected_architecture()}>
					<Icon icon="material-symbols:remove" />
				</Button>

				<Select.Root type="single" bind:value={selected_arch_id}>
					<Select.Trigger>
						{selected_arch_display}
					</Select.Trigger>
					<Select.Content>
						{#each cell_architectures as arch_tuple}
							<Select.Item value={arch_tuple[0]} label={arch_tuple[1].name}/>
						{/each}
					</Select.Content>
				</Select.Root>
		
				<Button variant='outline' size='icon' onclick={() => openCellArchitectureOptions()}>
					<Icon icon="material-symbols:settings" />
				</Button>
				<CellArchitectureOptions 
					bind:isOpen={openModal} 
					cell_architecture={cell_architectures.get(selected_arch_id!)!}
					architecture_changed_callback={(cell_architecture) => {
						cell_architectures.set(cell_architecture.id, cell_architecture);
						selected_arch_id = cell_architecture.id;
					}}/>
			</div>
		</div>
	</div> 
</BaseModal>