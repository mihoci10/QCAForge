import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { CellIndex, type Cell } from "./Cell";
import { deserializeQCADesign, deserializeQCADesignFile, type CommonSimulationModelSettings, type QCADesign } from "./qca-design";
import {v4 as uuidv4} from 'uuid';

export interface TimeDelta{
    seconds: number,
    nanoseconds: number,
}

export enum SignalType {
    CLOCK = 0,
    CELL = 1,
}

export interface SignalIndex{
    type: number,
    index: number,
    subindex?: number
}

export interface Signal{
    index: SignalIndex,
    name: string,
}

export enum InputType {
  CELL = 'CELL',
  SIGNAL = 'SIGNAL',
}

export type CellInput = {
  type: InputType.CELL;
  index: CellIndex;
};

export type SignalInput = {
  type: InputType.SIGNAL;
  index: SignalIndex;
};

export type Input = CellInput | SignalInput;

export function getInputLabel(qcaSimulation: QCASimulation, input: Input): string {
    switch (input.type) {
        case InputType.CELL:
            const cellIndex = input.index as CellIndex;
            const cell = qcaSimulation.getCell(cellIndex);
            return cell.label || `Cell ${cellIndex.toString()}`;
        case InputType.SIGNAL:
            const signalIndex = input.index as SignalIndex;
            const signal = qcaSimulation.getSignal(signalIndex);
            return signal.name;
        default:
            throw new Error('Invalid input type');
    }
}

export interface QCASimulationMetadata{
    qca_core_version: string,
    start_time: Date,
    duration: TimeDelta,
    num_samples: number,
    stored_cells: CellIndex[],
}

function deserializeMetadata(str: string): QCASimulationMetadata{
    const obj = JSON.parse(str) as QCASimulationMetadata;
    obj.stored_cells = obj.stored_cells.map((cell: any) => {
        return new CellIndex(cell.layer, cell.cell);
    });
    return obj as QCASimulationMetadata;
}

export class QCASimulation {
    private _session_id: string;
    private _filename: string;
    private _design: QCADesign;
    private _metadata: QCASimulationMetadata;

    private _clockData: [Float64Array, Float64Array, Float64Array, Float64Array] | undefined;
    private _cellData: Map<string, Float64Array[]>;

    constructor(filename: string, design: QCADesign, metadata: QCASimulationMetadata){
        this._session_id = uuidv4();
        this._filename = filename;
        this._design = design;
        this._metadata = metadata;

        this._clockData = undefined;
        this._cellData = new Map<string, Float64Array[]>();
    }

    public get session_id(): string {
        return this._session_id;
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

    public async getClockData(index: number): Promise<Float64Array> {
        if (this._clockData === undefined) {
            await this.loadData();
        }
        return this._clockData![index];
    }

    public async getCellData(cell: CellIndex, polarizationIndex: number): Promise<Float64Array> {
        if (!this._cellData.has(cell.toString())) {
            await this.loadData();
        }
        return this._cellData.get(cell.toString())![polarizationIndex];
    }

    public async getInputData(input: Input): Promise<Float64Array[]> {
        switch (input.type) {
            case InputType.CELL: 
                const cellIndex = input.index as CellIndex;
                const archId = this._design.layers[cellIndex.layer].cell_architecture_id;
                const arch = this._design.cell_architectures.get(archId)!;
                const polarizationN = arch.dot_count / 4;
                return Promise.all(
                    Array.from({ length: polarizationN }, (_, i) => this.getCellData(cellIndex, i))
                );            
            case InputType.SIGNAL:
                const signalIndex = input.index as SignalIndex;
                switch (signalIndex.type) {
                    case SignalType.CLOCK:  
                        return [await this.getClockData(signalIndex.index)];
                    case SignalType.CELL:
                        const cellIndex = this._metadata.stored_cells[signalIndex.index];
                        const polarizationIndex = signalIndex.subindex!;
                        return [await this.getCellData(cellIndex, polarizationIndex)];
                }
            default:
                throw new Error('Invalid input type');
        }
    }

    public getInputs(type: InputType): Input[] {
        switch (type) {
            case InputType.CELL:
                return this._metadata.stored_cells.map(cellIndex => ({
                    type: InputType.CELL,
                    index: cellIndex
                }));       
            case InputType.SIGNAL:
                return this.getSignals().map(signal => ({
                    type: InputType.SIGNAL,
                    index: signal.index
                }));
            default:
                throw new Error('Invalid input type');
        }  
    }

    private getSignals(): Signal[] {
        const signals: Signal[] = [];

        for (let i = 0; i < 4; i++) {
            signals.push({
                index: { type: SignalType.CLOCK, index: i },
                name: `Clock ${i}`
            });
        }

        for (let i = 0; i < this._metadata.stored_cells.length; i++) {
            const cellIndex = this._metadata.stored_cells[i];
            const layer = cellIndex.layer;
            const arch_id = this._design.layers[layer].cell_architecture_id;
            const arch = this._design.cell_architectures.get(arch_id)!;
            const polarization_n = arch.dot_count / 4;
            for (let j = 0; j < polarization_n; j++) {
                let cellName = this._design.layers[layer].cells[cellIndex.cell].label;
                if (cellName === null || cellName === undefined) {
                    cellName = `Cell ${cellIndex.layer}-${cellIndex.cell}`;
                }
                if (polarization_n > 1) {
                    cellName += ` ${'ABCDE'[j]}`;
                }
                signals.push({
                    index: { type: SignalType.CELL, index: i, subindex: j },
                    name: cellName
                });
            }
        }

        return signals;
    }

    public getCell(cellIndex: CellIndex): Cell {
        const layer = this._design.layers[cellIndex.layer];
        const cell = layer.cells[cellIndex.cell];
        if (!cell) {
            throw new Error(`Cell not found!}`);
        }
        return cell;
    }
    
    public getSignal(signalIndex: SignalIndex): Signal {
        const signals = this.getSignals();
        for (const signal of signals) {
            if (signal.index.type === signalIndex.type && signal.index.index === signalIndex.index) {
                if (signalIndex.subindex === undefined || signal.index.subindex === signalIndex.subindex) {
                    return signal;
                }
            }
        }
        throw new Error('Signal not found');
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

                        this._clockData = [
                            new Float64Array(num_samples),
                            new Float64Array(num_samples),
                            new Float64Array(num_samples),
                            new Float64Array(num_samples)
                        ]

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
                            this._cellData.set(cell.toString(), cellData);
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

    public getSimulationModelSettings() : CommonSimulationModelSettings{
        return this._design.simulation_model_settings.get(this._design.selected_simulation_model_id!)! as CommonSimulationModelSettings;
    }
}

export function loadSimulationFromFile(filename: string): Promise<QCASimulation>{
    return new Promise((resolve, reject) => {
        invoke('load_simulation_file', { filename: filename})
        .then((result: unknown) => {
            const resultPair = result as [QCADesign, QCASimulationMetadata];
            const metadata = deserializeMetadata(JSON.stringify(resultPair[1]));
            const design = deserializeQCADesign(JSON.stringify(resultPair[0]));
            resolve(new QCASimulation(filename, design, metadata));
        }).catch((error: any) => {
            console.error("Error loading simulation file:", error);
            reject(error);
        });
    });
}