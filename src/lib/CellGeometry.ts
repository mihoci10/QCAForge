import * as THREE from 'three'
import { CellIndex, CellType, getPolarization, type Cell } from './Cell';
import { DrawableCellMaterial, PickableCellMaterial } from './CellMaterial';
import { Set } from 'typescript-collections'
import { type CellArchitecture } from './CellArchitecture';
import { InstancedEntity, InstancedMesh2 } from '@three.ez/instanced-mesh';

export class CellGeometry{
    private drawMesh: InstancedMesh2;
    private pickMesh: InstancedMesh2;

    private ghostMode: boolean;

    constructor (ghostMode: boolean){
        this.ghostMode = ghostMode;

        this.drawMesh = new InstancedMesh2(new THREE.PlaneGeometry(), new DrawableCellMaterial());
        console.log(new THREE.MeshBasicMaterial())
        this.drawMesh.initUniformsPerInstance({fragment: {
            polarization: 'vec2',
            metadata: 'float',
            color: 'vec3'
        }});
        this.drawMesh.frustumCulled = false;

        this.pickMesh = new InstancedMesh2(new THREE.PlaneGeometry(), new PickableCellMaterial());
        this.pickMesh.matrixAutoUpdate = false;
    }

    getDrawMesh(): InstancedMesh2{
        return this.drawMesh;
    }

    getPickMesh(): InstancedMesh2{
        return this.pickMesh;
    }

    dispose(): void{
        this.drawMesh.dispose();
        this.pickMesh.dispose();
    }

    private getCellMetadata(id: number, selected: boolean, ghosted: boolean, cell_type: CellType): number{
        let result = 0;
        result = id << 16;
        return result;
    }

    private getClockPhaseColor(clock_phase: number): THREE.Color{
        const phase = ((clock_phase % 360) + 360) % 360;
        if (phase < 90)
            return new THREE.Color(0, 1, 0);
        else if (phase < 180)
            return new THREE.Color(1, 0, 1);
        else if (phase < 270)
            return new THREE.Color(0, 1, 1);
        else
            return new THREE.Color(1, 1, 1);
    }

    private getCellColor(cell: Cell, selected: boolean): THREE.Color{
        if (this.ghostMode)
            return new THREE.Color(0.5, 0.5, 0.5);

        if (selected)
            return new THREE.Color(1, 0, 0);

        switch(cell.typ){
            case CellType.Normal:
                return this.getClockPhaseColor(cell.clock_phase_shift);
            case CellType.Input:
                return new THREE.Color(0, 0, 1);
            case CellType.Output:
                return new THREE.Color(1, 1, 0);
            case CellType.Fixed:
                return new THREE.Color(1, 0.5, 0);
        }
    }

    update(cells: Cell[], selectedCells: Set<number>, architecture: CellArchitecture){

        const init_cell_instance = (instance: InstancedEntity, index: number) => {
            const cell = cells[index];

            instance.position.set(cell.position[0], cell.position[1], 0);
            instance.scale.set(architecture.side_length, architecture.side_length, 1);

            const polarization = getPolarization(cell);
            if (polarization.length < 2)
                polarization.push(0);

            instance.setUniform('polarization', new THREE.Vector2(polarization[0], polarization[1]));

            const metadata = this.getCellMetadata(index, selectedCells.contains(index), this.ghostMode, cell.typ);
            instance.setUniform('metadata', metadata);

            const cell_color = this.getCellColor(cell, selectedCells.contains(index));
            instance.setUniform('color', cell_color);
        }
        
        if(cells.length != this.drawMesh.instancesCount){
            this.drawMesh.clearInstances();
            this.drawMesh.addInstances(cells.length, init_cell_instance);
            this.drawMesh.computeBVH();
        }
        else{
            this.drawMesh.updateInstances(init_cell_instance);
        }
    }
}