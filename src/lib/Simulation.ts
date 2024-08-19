import { serializeCells, type Cell } from './Cell';
import { invoke } from '@tauri-apps/api/tauri';
import type { SimulationModel } from './SimulationModel';
import { type Layer } from './Layer';

export function startSimulation(layers: Layer[], sim_model: SimulationModel): Promise<any>{    
    return invoke(
        'run_sim_model', 
        {
            simModelId: sim_model.id, 
            simModelSettings: JSON.stringify(sim_model.settings), 
            cells: serializeCells(cells)
        }
    );
}