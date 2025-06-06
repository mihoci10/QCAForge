import { invoke } from "@tauri-apps/api/core";
import type { SimulationModel } from "./SimulationModel";
import { type Layer } from "./Layer";
import { generate_default_cell_architectures, get_default_cell_architecture_id, type CellArchitecture } from "./CellArchitecture";
import { getVersion } from "@tauri-apps/api/app";
import type { DesignerProps } from "./design/designer.svelte";

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

export interface QCADesignFile{
    qca_forge_version: string,
    design: QCADesign,
    designer_properties: undefined | DesignerProps, // Placeholder for editor state
}

function serializeDesign(design: QCADesign): string{
    const obj: any = {...design};
    obj.simulation_model_settings = Object.fromEntries(obj.simulation_model_settings);
    obj.cell_architectures = Object.fromEntries(obj.cell_architectures);
    return JSON.stringify(obj, null, 2)
}

function deserializeDesign(str: string): QCADesign{
    const obj = JSON.parse(str);
    obj.simulation_model_settings = new Map(Object.entries(obj.simulation_model_settings))
    obj.cell_architectures = new Map(Object.entries(obj.cell_architectures));
    return obj as QCADesign
}

export function serializeQCADesignFile(qcaDesignFile: QCADesignFile): string {
    const obj: any = {...qcaDesignFile};
    obj.design = serializeDesign(obj.design);
    return JSON.stringify(obj, null, 2);
}

export function deserializeQCADesignFile(str: string): QCADesignFile {
    const obj = JSON.parse(str);
    obj.design = deserializeDesign(obj.design);
    return obj as QCADesignFile;
}

export async function createDesign(
    layers: Layer[],
    selected_simulation_model_id: string|undefined, 
    simulation_models: Map<string, SimulationModel>,
    cell_architectures: Map<string, CellArchitecture>): Promise<QCADesign>{

    let simulation_model_settings: Map<string, string> = new Map();
    simulation_models.forEach((val, key, _) => {
        simulation_model_settings.set(key, val.settings);
    });
    
    const qca_core_ver = await invoke('get_sim_version') as string;
    
    return {
        qca_core_version: qca_core_ver,
        layers: layers, 
        selected_simulation_model_id: selected_simulation_model_id, 
        simulation_model_settings: simulation_model_settings,
        cell_architectures: cell_architectures,
    };
}

export async function createQCADesignFile(design: QCADesign, designerProps: DesignerProps | undefined): Promise<QCADesignFile>{
    const qca_forge_ver = await getVersion();
    return {
        qca_forge_version: qca_forge_ver,
        design: design,
        designer_properties: designerProps,
    };
}

export async function createDefaultQCADesignFile(): Promise<QCADesignFile> {
    const layers: Layer[] = 
    [{
        name: "Main Layer", 
        visible: true, 
        cell_architecture_id: get_default_cell_architecture_id(), 
        cells: [], 
        z_position: 0
    }];
    const selected_simulation_model_id: string|undefined = undefined;
    const simulation_models: Map<string, SimulationModel> = new Map();
    const cell_architectures: Map<string, CellArchitecture> = generate_default_cell_architectures();

    const design = await createDesign(layers, selected_simulation_model_id, simulation_models, cell_architectures);
    return await createQCADesignFile(design, undefined);
}