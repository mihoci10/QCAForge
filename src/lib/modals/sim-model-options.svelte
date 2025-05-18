<script lang="ts">
    import type { SimulationModel } from '$lib/SimulationModel';
    import BaseModal from './base-modal.svelte';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';

	interface Props {
		isOpen: boolean;
        model: SimulationModel;
		applyCallback: () => void;
    }

    let { 
		isOpen = $bindable(),
		model = $bindable(),
		applyCallback
	}: Props = $props();

	function applyModelChanges(data: any) {
		model.option_list.forEach(option => {
			if (option.type !== 'Input') return;

			if (option.descriptor.type === 'NumberInput') {
				const value = parseFloat(data[option.unique_id]);
				if (!isNaN(value)) {
					model.settings[option.unique_id] = value;
				}
			}
		});
		applyCallback();
	}
</script>

<BaseModal bind:open={isOpen} type='confirm' applyCallback={applyModelChanges}>
	{#snippet title()}
		{model.name} settings
	{/snippet}
	{#snippet description()}
		Configure parameters for the selected model.
	{/snippet}
	<div class="flex flex-col gap-2">
		{#each model.option_list as option}
			{#if option.type === 'Header'}
				<p class="text-lg font-bold">{option.label}</p>
			{:else if option.type === 'Break'}
				<hr>
			{:else if option.type === 'Input'}
				{#if option.descriptor.type === 'NumberInput'}
				<div class="flex flex-col gap-1.5">
					<Label for={option.unique_id}>{option.name}</Label>
					<div class="flex items-center gap-2">
						<Input 
							type="number" 
							value={model.settings[option.unique_id]} 
							name={option.unique_id}
							min={option.descriptor.min}
							max={option.descriptor.max}
							step={option.descriptor.whole_num ? "1" : "any"}
						/>
						{#if option.descriptor.unit}
							<span>{option.descriptor.unit}</span>
						{/if}
					</div>
				</div>
				{/if}
			{/if}
		{/each}
	</div>
</BaseModal>