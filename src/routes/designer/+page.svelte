<script lang="ts">
	import Designer from "$lib/Designer.svelte";
    import { onMount } from "svelte";
    import { startSimulation } from "$lib/Simulation";
    import type { SimulationModel } from "$lib/SimulationModel";
    import { invoke } from "@tauri-apps/api/core";
    import { toast } from "svelte-sonner";
    import { listen } from "@tauri-apps/api/event";
    import { EVENT_SAVE_FILE, EVENT_SAVE_FILE_AS } from "$lib/utils/events";
    import { createDesign, serializeDesign, type QCADesign } from "$lib/qca-design";
    import { BaseDirectory, writeTextFile } from "@tauri-apps/plugin-fs";
    import { save } from "@tauri-apps/plugin-dialog";
    import { design, design_filename } from "$lib/globals";
    import { get } from "svelte/store";
    import { type Layer } from "$lib/Layer.js";
    import { DEFAULT_CELL_ARCHITECTURES, type CellArchitecture } from "$lib/CellArchitecture";
    import Button from "$lib/components/ui/button/button.svelte";

    let selected_model_id: string|undefined = $state();
    let layers: Layer[] = $state([]);

    let simulation_models: Map<string, SimulationModel> = $state(new Map<string, SimulationModel>());
    let cell_architectures: CellArchitecture[] = $state([]);

    design.subscribe((cur_design) => {
        layers = cur_design.layers;
        selected_model_id = cur_design.selected_simulation_model_id;
        cur_design.simulation_model_settings.forEach((val, key, map) => {
            const model = simulation_models.get(key);
            if(model)
                model.settings = val;
        })
    });

    onMount(() => {
        invoke('get_sim_models').then((res: unknown) => {
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

        cell_architectures = DEFAULT_CELL_ARCHITECTURES;
        
        const unlistenSave = listen(EVENT_SAVE_FILE, () => {
            new Promise((resolve : (value: string) => void, reject) => {
                let filename = get(design_filename);
                if (!filename)
                {
                    save({
                        defaultPath: 'New design.qcd', 
                        title: 'Save design as', 
                        filters: [{name: 'Design', extensions: ['qcd']}]
                    }).then((filename) => filename ? resolve(filename as string) : reject());
                }
                else
                    resolve(filename);
                    
            }).then((filename) => {
                createDesign(layers, selected_model_id, simulation_models, cell_architectures).then((design) => {
                    writeTextFile(filename, serializeDesign(design), {baseDir: BaseDirectory.Desktop})
                    design_filename.set(filename);
                })
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

                createDesign(layers, selected_model_id, simulation_models, cell_architectures).then((design) => {
                    writeTextFile(filename, serializeDesign(design))
                    design_filename.set(filename);
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

        startSimulation(layers, simulation_models.get(selected_model_id!)!)
            .then((res) => {
                toast.success('Simulation finished successfully.');
            })
            .catch((err) => {
                console.error(err);
                toast.error('Simulation finished successfully.');
            })
    }
</script>

<div class="w-full flex flex-col">
    <div class='my-1'>
        <div class="flex flex-row float-right">
            <Button disabled={!selected_model_id} onclick={(e) => executeSimulation()}>
                Run
            </Button>
        </div>
    </div>
    <Designer bind:selected_model_id={selected_model_id} bind:layers={layers} bind:simulation_models={simulation_models}/>
</div>