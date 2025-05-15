import { invoke } from "@tauri-apps/api/core";

export interface SimulationModel{
    id: string;
    name: string;
    option_list: any|undefined;
    settings: any|undefined;
}

export function loadSimulationModels(): Promise<SimulationModel[]> {
    return invoke('get_sim_models').then((res: unknown) => {
        let model_list = res as any[];
        let models: SimulationModel[] = [];
        model_list.forEach(model => {
            models.push({
                id: model['model_id'], 
                name: model['model_name'],
                option_list: model['model_option_list'],
                settings: JSON.parse(model['model_settings']),
            });
        });
        return models;
    });
}