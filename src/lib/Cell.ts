export class CellIndex{
    public layer: number;
    public cell: number;

    constructor(layer: number, cell: number){
        this.layer = layer;
        this.cell = cell;
    }

    public toString(): string{
        return `${this.layer}-${this.cell}`;
    }
}

export function parseCellIndex(str: string): CellIndex|undefined{
    const strArr = str.split('-');

    if (strArr.length != 2)
        return undefined;

    const layer = parseInt(strArr[0]);
    const cell = parseInt(strArr[1]);

    return new CellIndex(layer, cell);
}

export enum CellType{
    Normal = 0,
    Input = 1,
    Output = 2,
    Fixed = 3,
}

export interface Cell{
    position: [number, number],
    rotation: number,
    typ: CellType,
    clock_phase_shift: number, 
    dot_probability_distribution: number[],
    label?: string,
}

export function serializeCell(cell: Cell): string{
    return JSON.stringify(cell)
}

export function serializeCells(cells: Cell[]): string{
    return JSON.stringify(cells)
}

export function deserializeCell(str: string): Cell{
    return JSON.parse(str) as Cell;
}
export function deserializeCells(str: string): Cell[]{
    return JSON.parse(str) as Cell[];
}

export function getPolarization(dot_probability_distribution: number[]): number[]{
    const arr = dot_probability_distribution;
    const sum = arr.reduce((acc, v) => acc + v, 0);

    if (sum == 0)
        return new Array(arr.length / 4).fill(0);

    if (arr.length == 4) {
        return [((arr[0] + arr[2]) - (arr[1] + arr[3])) / sum];
    }

    if (arr.length == 8) {
        return [
            ((arr[0] + arr[4]) - (arr[2] + arr[6])) / sum,
            ((arr[1] + arr[5]) - (arr[3] + arr[7])) / sum,
        ]
    }

    throw new Error("Cell dot probability invalid array");
}

export function generateDotDistribution(polarization: number[]): number[]{

    if (polarization.length == 1) {
        const p = (polarization[0] / 2.0 + 0.5);
        const p_neg = 1.0 - p;
        return [p, p_neg, p, p_neg]
    }

    if (polarization.length == 2) {
        const sum = Math.abs(polarization[0]) + Math.abs(polarization[1]);
        if (sum > 1.0)
            console.warn(`Polarization array value is invalid: ${polarization}`);

        const offset = (1.0 - sum) / 4;

        const p1 = Math.max(0.0, polarization[0]) + offset;
        const p_neg1 = Math.max(0.0, -polarization[0]) + offset;

        const p2 = Math.max(0.0, polarization[1]) + offset;
        const p_neg2 = Math.max(0.0, -polarization[1]) + offset;
        
        return [p1, p2, p_neg1, p_neg2, p1, p2, p_neg1, p_neg2]
    }

    throw new Error("Polarization invalid array");
}

export function polarizationToString(polarization: number[]): string{
    return polarization.map(v => v.toFixed(2)).join('\n');
}