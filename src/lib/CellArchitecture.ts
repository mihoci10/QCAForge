export interface CellArchitecture{
    name: string,
    side_length: number,
    dot_diameter: number,
    dot_count: number,
    dot_positions: [number, number][],
    dot_tunnels: [number, number][],
}

export function createCellArchitecture(name:string, sideLength: number, dotDiameter: number, dotCount: number, dotRadius: number): CellArchitecture{
    let dotPositions: [number, number][] = [];
    let dotTunnels: [number, number][] = [];

    for (let i = 0; i < dotCount; i++) {
        let angle = (2.0 * Math.PI / dotCount) * i;
        dotPositions.push([
            Math.cos(angle) * dotRadius,
            Math.sin(angle) * dotRadius,
        ]);
        dotTunnels.push([
            (i - 1 + dotCount) % dotCount,
            (i + 1 + dotCount) % dotCount,
        ]);
    }

    return {
        name: name,
        side_length: sideLength,
        dot_diameter: dotDiameter,
        dot_count: dotCount,
        dot_positions: dotPositions,
        dot_tunnels: dotTunnels
    };
}

export function serializeCellArchitecture(cell_architecture: CellArchitecture): string{
    return JSON.stringify(cell_architecture)
}

export function deserializeCell(str: string): CellArchitecture{
    return JSON.parse(str) as CellArchitecture;
}

export function getDotRadius(cell_architecture: CellArchitecture): number{
    return Math.sqrt(Math.pow(cell_architecture.dot_positions[0][0], 2) + Math.pow(cell_architecture.dot_positions[0][1], 2));
}

export const DEFAULT_CELL_ARCHITECTURES: CellArchitecture[] = [
    createCellArchitecture('Two state', 20, 5, 4, 6.36),
    createCellArchitecture('Tri state 60', 60, 10, 8, 60*Math.sqrt(2)/2),
    createCellArchitecture('Tri state 72', 72, 10, 8, (72*2/3)/(2*Math.sin(Math.PI/8))),
    createCellArchitecture('Tri state 110', 110, 10, 8, 110/(2*Math.sin(Math.PI/8)))
];  

export function getDefaultCellArchitecture(): CellArchitecture{
    return DEFAULT_CELL_ARCHITECTURES[0];
}