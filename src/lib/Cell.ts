export enum CellType{
    Normal = 0,
    Input = 1,
    Output = 2,
    Fixed = 3,
}

export interface Cell{
    position: [number, number, number],
    rotation: number,
    typ: CellType,
    clock_phase_shift: number, 
    dot_probability_distribution: number[],
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

export function getPolarization(cell: Cell): number[]{
    const arr = cell.dot_probability_distribution;
    const sum = arr.reduce((acc, v) => acc + v, 0);

    if (arr.length == 4) {
        return [((arr[0] + arr[2]) - (arr[1] - arr[3])) / sum];
    }

    if (arr.length == 8) {
        return [
            ((arr[0] + arr[2]) - (arr[1] - arr[3])) / sum,
            ((arr[4] + arr[6]) - (arr[5] - arr[7])) / sum,
        ]
    }

    throw new Error("Cell dot probability invalid array");
}