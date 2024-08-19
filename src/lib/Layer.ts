import { type Cell } from "./Cell";
import { type CellArchitecture } from "./CellArchitecture";

export interface Layer{
    name: string;
    visible: boolean;
    cellArchitecture: CellArchitecture;
    cells: Cell[];
}