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

export class QCASimulation {
    private _filename: string;
    private _design: QCADesign;
    private _metadata: QCASimulationMetadata;
    private _dataArrays: Float64Array[];

    constructor(filename: string, design: QCADesign, metadata: QCASimulationMetadata){
        this._filename = filename;
        this._design = design;
        this._metadata = metadata;
        this._dataArrays = new Array(4 + metadata.stored_cells.length);

        this.loadData().then(() => {
            console.log("Simulation data loaded successfully.", this._dataArrays);
        })
        .catch((error) => {
            console.error("Error loading simulation data:", error);
        });
    }

    public get filename(): string {
        return this._filename;
    }
    public get design(): QCADesign {
        return this.design;
    }
    public get metadata(): QCASimulationMetadata {
        return this._metadata;
    }

    public loadData(): Promise<void> {
        return new Promise((resolve, reject) => {
            const url = convertFileSrc('', 'load-sim') + `?filename=${this._filename}`;
            fetch(url, {
                method: 'GET'
            })
            .then(response => {
                if (response.status === 200) {
                    response.arrayBuffer().then(buffer => {
                        const data = new Float64Array(buffer);
                        const num_samples = this._metadata.num_samples;
                        const num_arrays = this._metadata.stored_cells.length + 4;
                        
                        for (let i = 0; i < num_arrays; i++) {
                            this._dataArrays[i] = new Float64Array(num_samples);
                            for (let j = 0; j < num_samples; j++) {
                                this._dataArrays[i][j] = data[i * num_samples + j];
                            }
                        }
                        resolve();
                    }).catch(error => {
                        reject(error);
                    });
                } else {
                    reject(new Error('Request failed with status: ' + response.status));
                }
            })
            .catch(error => {
                reject(error);
            });
        });
    }
}

export function loadSimulationFromFile(filename: string): Promise<QCASimulation>{
    return new Promise((resolve, reject) => {
        invoke('load_simulation_file', { filename: filename})
        .then((result: unknown) => {
            const resultPair = result as [QCADesign, QCASimulationMetadata];
            resolve(new QCASimulation(filename, resultPair[0], resultPair[1]));
        }).catch((error: any) => {
            console.error("Error loading simulation file:", error);
            reject(error);
        });
    });
}