import { invoke } from "@tauri-apps/api";
import type { Cell } from "./Cell"
import type { SimulationModel } from "./SimulationModel";

export interface QCADesign{
    qca_core_version: string,
    cells: Cell[],
    simulation_model_settings: Map<string, string>,
    selected_simulation_model_id: string|undefined
}

export function serializeDesign(design: QCADesign): string{
    const obj: any = {...design};
    obj.simulation_model_settings = Object.fromEntries(obj.simulation_model_settings);
    return JSON.stringify(obj, null, 2)
}

export function deserializeDesign(str: string): QCADesign{
    const obj = JSON.parse(str);
    obj.simulation_model_settings = new Map(Object.entries(obj.simulation_model_settings))
    return obj as QCADesign
}

export function createDesign(
    cells: Cell[], 
    selected_simulation_model_id: string|undefined, 
    simulation_models: Map<string, SimulationModel>): Promise<QCADesign>{

    let simulation_model_settings: Map<string, string> = new Map();
    simulation_models.forEach((val, key, _) => {
        simulation_model_settings.set(key, val.settings);
    });
    
    return invoke('get_sim_version').then((res) => {
        const sim_ver = res as string;
        return {
            qca_core_version: sim_ver,
            cells: cells, 
            selected_simulation_model_id: selected_simulation_model_id, 
            simulation_model_settings: simulation_model_settings,
        }
    });
}