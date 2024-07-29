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
        let w1 = Math.abs(polarization[0]) / sum;
        let w2 = sum - w1;
        if (isNaN(w1) || isNaN(w2)){
            w1 = 0.5;
            w2 = 0.5;
        }

        const p1 = (polarization[0] / 2.0 + 0.5);
        const p_neg1 = 1.0 - p1;

        const p2 = (polarization[1] / 2.0 + 0.5);
        const p_neg2 = 1.0 - p2;
        
        return [p1 * w1, p2 * w2, p_neg1 * w1, p_neg2 * w2, p1 * w1, p2 * w2, p_neg1 * w1, p_neg2 * w2]
    }

    throw new Error("Polarization invalid array");
}