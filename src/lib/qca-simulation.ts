import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import type { CellIndex } from "./Cell";
import type { QCADesign } from "./qca-design";

export interface TimeDelta{
    seconds: number,
    nanoseconds: number,
}

export interface QCASimulationMetadata{
    qca_core_version: string,
    start_time: Date,
    duration: TimeDelta,
    num_samples: number,
    stored_cells: CellIndex[],
}

export interface QCASimulation {
    design: QCADesign,
    metadata: QCASimulationMetadata,
}

export function loadSimulationFromFile(file: string): Promise<QCASimulation>{
    return new Promise((resolve, reject) => {
        invoke('load_simulation_file', { filename: file})
        .then((result: unknown) => {
            const resultPair = result as [QCADesign, QCASimulationMetadata];
            resolve({design: resultPair[0], metadata: resultPair[1]});
        }).catch((error: any) => {
            console.error("Error loading simulation file:", error);
            reject(error);
        });
    });
}