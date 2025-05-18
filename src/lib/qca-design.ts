import { invoke } from "@tauri-apps/api/core";
import type { SimulationModel } from "./SimulationModel";
import { type Layer } from "./Layer";
import { type CellArchitecture } from "./CellArchitecture";

export interface CommonSimulationModelSettings{
    num_samples: number,
    max_iter: number,
    ampl_min: number,
    ampl_max: number,
    ampl_fac: number,
}

export interface QCADesign{
    qca_core_version: string,
    layers: Layer[]
    simulation_model_settings: Map<string, Object>,
    selected_simulation_model_id: string|undefined,
    cell_architectures: Map<string, CellArchitecture>,
}

export function serializeDesign(design: QCADesign): string{
    const obj: any = {...design};
    obj.simulation_model_settings = Object.fromEntries(obj.simulation_model_settings);
    obj.cell_architectures = Object.fromEntries(obj.cell_architectures);
    return JSON.stringify(obj, null, 2)
}

export function deserializeDesign(str: string): QCADesign{
    const obj = JSON.parse(str);
    obj.simulation_model_settings = new Map(Object.entries(obj.simulation_model_settings))
    obj.cell_architectures = new Map(Object.entries(obj.cell_architectures));
    return obj as QCADesign
}

export function createDesign(
    layers: Layer[],
    selected_simulation_model_id: string|undefined, 
    simulation_models: Map<string, SimulationModel>,
    cell_architectures: Map<string, CellArchitecture>): Promise<QCADesign>{

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