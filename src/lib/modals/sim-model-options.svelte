<script lang="ts">
	import { preventDefault } from 'svelte/legacy';

    import { invoke } from '@tauri-apps/api/core';
	// Stores
	import { getModalStore } from '@skeletonlabs/skeleton';

	const modalStore = getModalStore();
	interface Props {
		parent: any;
	}

	let { parent }: Props = $props();

	// Base Classes
	const cBase = 'card p-4 w-modal shadow-xl space-y-4';
	const cHeader = 'text-2xl font-bold';
	const cForm = 'border border-surface-500 p-4 space-y-4 rounded-container-token';

	function formSubmit(e: SubmitEvent){
		const form_data = new FormData(e.target as HTMLFormElement);
		let data_obj = {};

		for (var [key, value] of form_data.entries()) { 
			data_obj[key] = parseFloat(value);
		}

		if ($modalStore[0].response) {
			$modalStore[0].response(data_obj);
			modalStore.close();
		}
	}
</script>

{#if $modalStore[0]}
	<div class="modal-example-form {cBase}">
		<header class={cHeader}>{$modalStore[0].title ?? '(title missing)'}</header>
		
		<form class="modal-form {cForm}" onsubmit={preventDefault(formSubmit)}>
		{#each $modalStore[0].meta.model.option_list as option}
			{#if option.type === 'Header'}
				<p class="text-lg font-bold">{option.label}</p>
			{:else if option.type === 'Break'}
				<hr>
			{:else if option.type === 'Input'}
				{#if option.descriptor.type === 'NumberInput'}
				<label class="label">
					<span>{option.name}</span>
					
					<div class="input-group input-group-divider grid-cols-[1fr_auto]">
						<input class="input" type="number"
							value={$modalStore[0].meta.model.settings[option.unique_id]} 
							name={option.unique_id}
							min={option.descriptor.min}
							max={option.descriptor.max}
							step={option.descriptor.whole_num ? "1" : "any"}
						/>
						{#if option.descriptor.unit}
							<div class="input-group-shim">{option.descriptor.unit}</div>
						{/if}
					</div>
				</label>
				{/if}
			{/if}
		{/each}
		<button class="input" type="submit">Ok</button>
		</form>
	</div>
{/if}