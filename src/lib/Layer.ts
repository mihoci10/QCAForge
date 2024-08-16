import { CellArchitecture } from "./CellArchitecture";

export interface Layer{
    name: string;
    visible: boolean;
    cellArchitecture: CellArchitecture;
}