import { type Cell } from "./Cell";
import { type CellArchitecture } from "./CellArchitecture";

export interface Layer{
    name: string;
    visible: boolean;
    cell_architecture: CellArchitecture;
    cells: Cell[];
    z_position: number;
}