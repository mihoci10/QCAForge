export enum CellType{
    Normal,
    Fixed,
    Input,
    Output
}

export interface Cell{
    type: CellType;
    position: THREE.Vector3;
    polarization: number;
}