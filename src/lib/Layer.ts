import { type Cell } from "./Cell";

export interface Layer {
	name: string;
	visible: boolean;
	cell_architecture_id: string;
	cells: Cell[];
	z_position: number;
}
