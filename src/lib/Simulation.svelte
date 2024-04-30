<script lang="ts">
	import Designer from "$lib/Designer.svelte";
    import { getModalStore, type ModalSettings } from '@skeletonlabs/skeleton';
    import { invoke } from '@tauri-apps/api/tauri';
    import { serializeCells, type Cell } from "./Cell";

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

    function runSimulation(){
        invoke('run_sim_model', {simModelId: selected_model, cells: serializeCells(cells)})
            .then((r: any) => console.log(r))
            .catch((err: any) => console.error(err));
    }

    let selected_model: string | undefined;
    let sim_models: string[] = [];
    let cells: Cell[];

    invoke('get_sim_models').then((res) => {
        sim_models = res as string[];
    });
</script>

<div class="h-screen flex flex-col">
    <div class='my-1'>
        <div class="flex flex-row float-left">
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
        <div class="flex flex-row float-right">
            <button type="button" class="btn variant-filled mx-2" disabled={!selected_model} on:click={runSimulation}>
                Run
            </button>
        </div>
    </div>
    <Designer bind:cells={cells}/>
</div>