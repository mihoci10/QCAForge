import * as THREE from 'three'
import { CellIndex, getPolarization, type Cell } from './Cell';
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
            clock_phase: 'float'
        }});
        this.drawMesh.frustumCulled = false;

        this.pickMesh = new InstancedMesh2(new THREE.PlaneGeometry(), new THREE.MeshBasicMaterial({color: 0x00ff00}));
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

    private getCellMetadata(id: number, selected: boolean, ghosted: boolean): number{
        let result = 0;
        result = id << 16;
        if (selected)
            result |= (0b1000000);
        if (ghosted)
            result |= (0b100000);
        return result;
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

            const metadata = this.getCellMetadata(index, selectedCells.contains(index), this.ghostMode);
            instance.setUniform('metadata', metadata);

            instance.setUniform('clock_phase', cell.clock_phase_shift);
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