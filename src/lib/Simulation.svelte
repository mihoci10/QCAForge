<script lang="ts">
	import Designer from "$lib/Designer.svelte";
    import { onMount } from "svelte";
    import type { Cell } from "./Cell";
    import { startSimulation } from "./Simulation";
    import type { SimulationModel } from "./SimulationModel";
    import { invoke } from "@tauri-apps/api";
    import { getToastStore, type ToastSettings } from "@skeletonlabs/skeleton";

    const toastStore = getToastStore();
    
    let selected_model_id: string|undefined;
    let cells: Cell[];
    let model_options: any;

    let simulation_models: Map<string, SimulationModel> = new Map<string, SimulationModel>();

    onMount(() => {
        invoke('get_sim_models').then((res) => {
            let model_list = res as any[];
            model_list.forEach(model => {
                simulation_models.set(
                    model['model_id'], 
                    {
                        id: model['model_id'],
                        name: model['model_name'],
                        option_list: model['model_option_list'],
                        settings: JSON.parse(model['model_settings']),
                    }
                );
            });
            simulation_models = simulation_models;
        });
    });
    
    function executeSimulation(){
        if (!selected_model_id)
            console.error('invalid simulation model id!');

        if (!simulation_models.has(selected_model_id!))
            console.error('invalid simulation model!');

        startSimulation(cells, simulation_models.get(selected_model_id!)!)
            .then((res) => {
                console.log(res);
                const t: ToastSettings = {
                    message: 'Simulation finished successfully.',
                    timeout: 3000,
	                background: 'variant-filled-success',
                };
                toastStore.trigger(t);
            })
            .catch((err) => {
                console.error(err);
                const t: ToastSettings = {
                    message: `Simulation failed: ${err}`,
                    timeout: 10000,
	                background: 'variant-filled-error',
                };
                toastStore.trigger(t);
            })
    }
</script>

<div class="w-full flex flex-col">
    <div class='my-1'>
        <div class="flex flex-row float-right">
            <button type="button" class="btn variant-filled mx-2" 
                disabled={!selected_model_id} 
                on:click={(e) => executeSimulation()}>
                Run
            </button>
        </div>
    </div>
    <Designer bind:selected_model_id={selected_model_id} bind:cells={cells} bind:simulation_models={simulation_models}/>
</div>