import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import type { CellIndex } from "./Cell";
import { deserializeDesign, type QCADesign } from "./qca-design";

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

    private _clockData: [Float64Array, Float64Array, Float64Array, Float64Array];
    private _cellData: Map<CellIndex, Float64Array[]>;

    constructor(filename: string, design: QCADesign, metadata: QCASimulationMetadata){
        this._filename = filename;
        this._design = design;
        this._metadata = metadata;

        this._clockData = [
            new Float64Array(metadata.num_samples),
            new Float64Array(metadata.num_samples),
            new Float64Array(metadata.num_samples),
            new Float64Array(metadata.num_samples)
        ];
        this._cellData = new Map<CellIndex, Float64Array[]>();

        this.loadData().then(() => {
            console.log("Simulation data loaded successfully.", this._clockData, this._cellData.values());
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

                        for (let i = 0; i < this._clockData.length; i++) {
                            this._clockData[i] = new Float64Array(num_samples);
                            for (let j = 0; j < num_samples; j++) {
                                this._clockData[i][j] = data[i * num_samples + j];
                            }
                        }

                        let buf_offset = this._clockData.length * num_samples;
                        for (const cell of this._metadata.stored_cells) {
                            const layer = cell.layer;
                            const arch_id = this._design.layers[layer].cell_architecture_id;
                            const arch = this._design.cell_architectures.get(arch_id)!;
                            const polarization_n = arch.dot_count / 4;
                            const cellData: Float64Array[] = [];
                            for (let i = 0; i < polarization_n; i++) {
                                cellData.push(new Float64Array(num_samples));
                            }

                            for (let i = 0; i < num_samples; i++) {
                                for (let j = 0; j < polarization_n; j++) {
                                    cellData[j][i] = data[buf_offset];
                                    buf_offset++;
                                }
                            }
                            this._cellData.set(cell, cellData);
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
            const design = deserializeDesign(JSON.stringify(resultPair[0]));
            resolve(new QCASimulation(filename, design, resultPair[1]));
        }).catch((error: any) => {
            console.error("Error loading simulation file:", error);
            reject(error);
        });
    });
}