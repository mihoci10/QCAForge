import type { Cell } from "./Cell"

export interface QCADesign{
    qca_core_version: string,
    cells: Cell[],
    simulation_model_settings: Map<string, string>,
    selected_simulation_model_id: string|null
}

export function serializeDesign(design: QCADesign): string{
    return JSON.stringify(design)
}

export function deserializeDesign(str: string): QCADesign{
    return JSON.parse(str) as QCADesign;
}