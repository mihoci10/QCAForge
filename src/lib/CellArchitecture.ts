export interface CellArchitecture{
    side_length: number,
    dot_diameter: number,
    dot_count: number,
    dot_positions: [number, number][],
    dot_tunnels: [number, number][],
}

export function createCellArchitecture(sideLength: number, dotDiameter: number, dotCount: number, dotRadius: number): CellArchitecture{
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
        side_length: sideLength,
        dot_diameter: dotDiameter,
        dot_count: dotCount,
        dot_positions: dotPositions,
        dot_tunnels: dotTunnels
    };
}

export function serializeCellArchitecture(cellArchitecture: CellArchitecture): string{
    return JSON.stringify(cellArchitecture)
}

export function deserializeCell(str: string): CellArchitecture{
    return JSON.parse(str) as CellArchitecture;
}

export function getDefaultCellArchitecture(): CellArchitecture{
    return createCellArchitecture(20, 5, 4, 6.36)
}