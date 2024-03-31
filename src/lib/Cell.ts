export enum CellType{
    Normal = 0,
    Fixed = 1,
    Input = 2,
    Output = 3
}

export interface Cell{
    pos_x: number;
    pos_y: number
    typ: CellType;
    clock_phase_shift: number;
    polarization: number;
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