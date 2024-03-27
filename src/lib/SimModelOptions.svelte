<script lang="ts">
	import type { SvelteComponent } from 'svelte';

    import { invoke } from '@tauri-apps/api/tauri';
	// Stores
	import { getModalStore } from '@skeletonlabs/skeleton';
    import type { stringify } from 'querystring';

	const modalStore = getModalStore();

	// Base Classes
	const cBase = 'card p-4 w-modal shadow-xl space-y-4';
	const cHeader = 'text-2xl font-bold';
	const cForm = 'border border-surface-500 p-4 space-y-4 rounded-container-token';

	function formSubmit(e: SubmitEvent){
		const form_data = new FormData(e.target as HTMLFormElement);
		let data_obj = new Object();

		for (var [key, value] of form_data.entries()) { 
			data_obj[key] = value;
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
		
		{#await invoke('get_sim_model_options_list', {simModelId: $modalStore[0].meta.sim_model_id})}
		<p>...waiting</p>
		{:then response}
		<form class="modal-form {cForm}" on:submit|preventDefault={formSubmit}>
		{#each response as option}
			{#if option.type === 'Header'}
				<p class="text-lg font-bold">{option.label}</p>
			{:else if option.type === 'Break'}
				<hr>
			{:else if option.type === 'Input'}
				{#if option.descriptor.type === 'NumberInput'}
					<label class="label">
						<span>{option.name}</span>
						<input name={option.unique_id} class="input" type="number"/>
					</label>
				{/if}
			{/if}
		{/each}
		<button class="input" type="submit">Ok</button>
		</form>
		{:catch error}
			<p style="color: red">{error}</p>
		{/await}
	</div>
{/if}