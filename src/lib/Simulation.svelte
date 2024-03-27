<script lang="ts">
	import Designer from "$lib/Designer.svelte";
    import { getModalStore, type ModalSettings } from '@skeletonlabs/skeleton';
    import { invoke } from '@tauri-apps/api/tauri';

    const modalStore = getModalStore();

    function openModelOptions(){
        invoke('get_sim_model_options', {simModelId: selected_model})
            .then((res) => {
            let default_values = res;
            console.log(default_values)
            return new Promise((resolve) => {
                const modal: ModalSettings = {
                    type: 'component',
                    component: 'simModelOptions',
                    title: `${selected_model} settings`,
                    meta: {sim_model_id: selected_model, default_values: default_values},
                    response: (r:any) => resolve(r),
                };
                modalStore.trigger(modal);
                })
            .then((r: any) => {
            invoke('set_sim_model_options', {simModelId: selected_model, simModelOptions: JSON.stringify(r)}).then((res) => {
                    
                });
            });
        });
    }

    let selected_model: string | undefined;
    let sim_models: string[] = [];

    invoke('get_sim_models').then((res) => {
        sim_models = res as string[];
    });
</script>

<div class="h-screen flex flex-col">
    <div class="flex flex-row">
        <span class="mx-2 my-auto">Simulation model</span>
        <select bind:value={selected_model} class="select w-48">
            {#each sim_models as name}
                <option value={name}>{name}</option>
            {/each}
        </select>
        <button type="button" class="btn variant-filled mx-2" disabled={!selected_model} on:click={openModelOptions}>
            Options
        </button>
    </div>
    <Designer/>
</div>