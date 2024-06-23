<script lang="ts">
	import Designer from "$lib/Designer.svelte";
    import { onMount } from "svelte";
    import type { Cell } from "$lib/Cell";
    import { startSimulation } from "$lib/Simulation";
    import type { SimulationModel } from "$lib/SimulationModel";
    import { invoke } from "@tauri-apps/api";
    import { getToastStore, type ToastSettings } from "@skeletonlabs/skeleton";
    import { listen } from "@tauri-apps/api/event";
    import { EVENT_SAVE_FILE, EVENT_SAVE_FILE_AS } from "$lib/utils/events";
    import { createDesign, serializeDesign, type QCADesign } from "$lib/qca-design";
    import { BaseDirectory, writeTextFile } from "@tauri-apps/api/fs";
    import { save } from "@tauri-apps/api/dialog";

    const toastStore = getToastStore();
    
    let selected_model_id: string|undefined;
    let cells: Cell[];

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
        
        const unlistenSave = listen(EVENT_SAVE_FILE, () => {
            createDesign(cells, selected_model_id, simulation_models).then((design) => {
                writeTextFile('test.qcd', serializeDesign(design), {dir: BaseDirectory.Desktop})
            })
        });
        const unlistenSaveAs = listen(EVENT_SAVE_FILE_AS, () => {
            save({
                defaultPath: 'New design.qcd', 
                title: 'Save design as', 
                filters: [{name: 'Design', extensions: ['qcd']}]
            }).then((filename) => {
                if (!filename)
                    return;

                createDesign(cells, selected_model_id, simulation_models).then((design) => {
                    writeTextFile(filename, serializeDesign(design))
                })
            })
        });

        return () => {
            unlistenSave.then(f => f())
            unlistenSaveAs.then(f => f())
        };
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