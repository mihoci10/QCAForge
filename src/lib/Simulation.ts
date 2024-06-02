import { serializeCells, type Cell } from './Cell';
import { invoke } from '@tauri-apps/api/tauri';
import type { SimulationModel } from './SimulationModel';

export function startSimulation(cells: Cell[], sim_model: SimulationModel): Promise<any>{    
    console.log(sim_model);
    return invoke(
        'run_sim_model', 
        {
            simModelId: sim_model.id, 
            simModelSettings: JSON.stringify(sim_model.settings), 
            cells: serializeCells(cells)
        }
    );
}