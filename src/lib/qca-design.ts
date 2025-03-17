import { invoke } from "@tauri-apps/api/core";
import type { SimulationModel } from "./SimulationModel";
import { type Layer } from "./Layer";
import { DEFAULT_CELL_ARCHITECTURES, type CellArchitecture } from "./CellArchitecture";

export interface QCADesign{
    qca_core_version: string,
    layers: Layer[]
    simulation_model_settings: Map<string, string>,
    selected_simulation_model_id: string|undefined,
    cell_architectures: CellArchitecture[],
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
    layers: Layer[],
    selected_simulation_model_id: string|undefined, 
    simulation_models: Map<string, SimulationModel>,
    cell_architectures: CellArchitecture[]): Promise<QCADesign>{

    let simulation_model_settings: Map<string, string> = new Map();
    simulation_models.forEach((val, key, _) => {
        simulation_model_settings.set(key, val.settings);
    });
    
    return invoke('get_sim_version').then((res) => {
        const sim_ver = res as string;
        return {
            qca_core_version: sim_ver,
            layers: layers, 
            selected_simulation_model_id: selected_simulation_model_id, 
            simulation_model_settings: simulation_model_settings,
            cell_architectures: cell_architectures,
        }
    });
}