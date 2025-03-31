import { serializeCells, type Cell } from './Cell';
import { invoke } from '@tauri-apps/api/core';
import type { SimulationModel } from './SimulationModel';
import { type Layer } from './Layer';
import type { CellArchitecture } from './CellArchitecture';

export function startSimulation(layers: Layer[], sim_model: SimulationModel, cell_architectures: Map<string, CellArchitecture>): Promise<any>{    
    return invoke(
        'run_sim_model', 
        {
            simModelId: sim_model.id, 
            simModelSettings: JSON.stringify(sim_model.settings), 
            architectures:  JSON.stringify(Object.fromEntries(cell_architectures)),
            layers: JSON.stringify(layers),
        }
    );
}