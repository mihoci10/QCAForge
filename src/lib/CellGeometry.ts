import * as THREE from 'three'
import { CellType, getPolarization, polarizationToString, type Cell } from './Cell';
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

        this.drawMesh = this.init_intanced_mesh(new THREE.PlaneGeometry(), new DrawableCellMaterial());
        this.pickMesh = this.init_intanced_mesh(new THREE.PlaneGeometry(), new PickableCellMaterial());
    }

    private init_intanced_mesh(geometry: THREE.BufferGeometry, shader: THREE.ShaderMaterial): InstancedMesh2{
        const mesh = new InstancedMesh2(geometry, shader);
        mesh.initUniformsPerInstance({fragment: {
            polarization: 'vec2',
            metadata: 'float',
            color: 'vec3'
        }});
        mesh.frustumCulled = false;
        return mesh;
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

    private getCellMetadata(id: number, cell_dot_count: number, cell_rotation: number): number{
        let result = 0;
        result = id << 16;

        if (cell_dot_count == 8)
            result |= (0b1000000);
        else if (cell_dot_count != 4)
            throw new Error(`Invalid cell_dot_count: ${cell_dot_count}`);

        if (cell_rotation % 180 == 90)
            result |= (0b100000);
        else if (cell_rotation % 180 != 0)
            throw new Error(`Invalid cell_rotation: ${cell_rotation}`);

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

    private update_instanced_mesh(mesh: InstancedMesh2, cells: Cell[], selectedCells: Set<number>, architecture: CellArchitecture){

        const init_cell_instance = (instance: InstancedEntity, index: number) => {
            const cell = cells[index];

            instance.position.set(cell.position[0], cell.position[1], 0);
            instance.scale.set(architecture.side_length, architecture.side_length, 1);

            const polarization = getPolarization(cell.dot_probability_distribution);
            if (polarization.length < 2)
                polarization.push(0);

            instance.setUniform('polarization', new THREE.Vector2(polarization[0], polarization[1]));

            const metadata = this.getCellMetadata(index, architecture.dot_count, cell.rotation);
            instance.setUniform('metadata', metadata);

            const cell_color = this.getCellColor(cell, selectedCells.contains(index));
            instance.setUniform('color', cell_color);
        }
        
        if(cells.length != mesh.instancesCount){
            mesh.clearInstances();
            mesh.addInstances(cells.length, init_cell_instance);
        }
        else{
            mesh.updateInstances(init_cell_instance);
        }

        mesh.computeBVH();
    }

    update_draw_mesh(cells: Cell[], selectedCells: Set<number>, architecture: CellArchitecture): void{
        this.update_instanced_mesh(this.drawMesh, cells, selectedCells, architecture);
    }

    update_pick_mesh(cells: Cell[], architecture: CellArchitecture): void{
        this.update_instanced_mesh(this.pickMesh, cells, new Set<number>(), architecture);
    }

    update_labels(cells: Cell[], selectedCells: Set<number>, architecture: CellArchitecture) {
        return cells
        .filter((cell) => [CellType.Input, CellType.Output, CellType.Fixed].includes(cell.typ))
        .map((cell) => {
            let text = polarizationToString(getPolarization(cell.dot_probability_distribution));
            if (cell.typ != CellType.Fixed)
                text = cell.label? cell.label : '';
            return {
                position: new THREE.Vector2(cell.position[0], cell.position[1]),
                text,
                color: this.getCellColor(cell, selectedCells.contains(cells.indexOf(cell))),
            }
        });
    }
}