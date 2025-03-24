import { v4 as uuidv4 } from 'uuid';

export interface CellArchitecture{
    readonly id: string
    name: string,
    side_length: number,
    dot_diameter: number,
    dot_count: number,
    dot_positions: [number, number][],
    dot_tunnels: [number, number][],
}

export function createCellArchitecture(name:string, side_length: number, dot_diameter: number, dot_count: number, dot_radius: number, id:string|undefined = undefined): CellArchitecture{
    let dot_positions: [number, number][] = [];
    let dot_tunnels: [number, number][] = [];

    for (let i = 0; i < dot_count; i++) {
        let angle = (2.0 * Math.PI / dot_count) * i;
        dot_positions.push([
            Math.cos(angle) * dot_radius,
            Math.sin(angle) * dot_radius,
        ]);
        dot_tunnels.push([
            (i - 1 + dot_count) % dot_count,
            (i + 1 + dot_count) % dot_count,
        ]);
    }

    if(!id)
        id = uuidv4();

    return {
        id,
        name,
        side_length,
        dot_diameter,
        dot_count,
        dot_positions,
        dot_tunnels,
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

const DEFAULT_CELL_ARCHITECTURES: CellArchitecture[] = [
    createCellArchitecture('Two state', 20, 5, 4, 6.36, 'two_state'),
    createCellArchitecture('Tri state 60', 60, 10, 8, 60*Math.sqrt(2)/2, 'tri_state_60'),
    createCellArchitecture('Tri state 72', 72, 10, 8, (72*2/3)/(2*Math.sin(Math.PI/8)), 'tri_state_72'),
    createCellArchitecture('Tri state 110', 110, 10, 8, 110/(2*Math.sin(Math.PI/8)), 'tri_state_110'),
];  

export function generate_default_cell_architectures(): Map<string, CellArchitecture>{
    let cell_architectures: Map<string, CellArchitecture> = new Map();
    for (let i = 0; i < DEFAULT_CELL_ARCHITECTURES.length; i++) {
        cell_architectures.set(DEFAULT_CELL_ARCHITECTURES[i].id, DEFAULT_CELL_ARCHITECTURES[i]);
    }
    return cell_architectures;
}

export function get_default_cell_architecture_id(){
    return DEFAULT_CELL_ARCHITECTURES[0].id;
}