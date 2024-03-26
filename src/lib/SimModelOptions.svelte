<script lang="ts">
	import type { SvelteComponent } from 'svelte';

    import { invoke } from '@tauri-apps/api/tauri';
	// Stores
	import { getModalStore } from '@skeletonlabs/skeleton';

	const modalStore = getModalStore();

	if ($modalStore[0]){
		console.log("onform")
	}

	// Base Classes
	const cBase = 'card p-4 w-modal shadow-xl space-y-4';
	const cHeader = 'text-2xl font-bold';
	const cForm = 'border border-surface-500 p-4 space-y-4 rounded-container-token';
</script>

<!-- @component This example creates a simple form modal. -->

{#if $modalStore[0]}
	<div class="modal-example-form {cBase}">
		<header class={cHeader}>{$modalStore[0].title ?? '(title missing)'}</header>
		
		{#await invoke('get_sim_model_options_list', {simModelId: $modalStore[0].meta.sim_model_id})}
		<p>...waiting</p>
		{:then response}
			<p>{response}</p>
		{:catch error}
			<p style="color: red">{error}</p>
		{/await}
	</div>
{/if}