import * as THREE from 'three'
import { CellIndex, getPolarization, type Cell } from './Cell';
import { DrawableCellMaterial, PickableCellMaterial } from './CellMaterial';
import { Set } from 'typescript-collections'

export class CellGeometry{
    private geometry: THREE.InstancedBufferGeometry;

    private positionAttribute: THREE.BufferAttribute;
    private localPositionAttribute: THREE.BufferAttribute;
    private polarizationAttribute: THREE.BufferAttribute;
    private metaAttribute: THREE.BufferAttribute;

    private drawMesh: THREE.Mesh;
    private pickMesh: THREE.Mesh;

    private ghostMode: boolean;

    constructor (ghostMode: boolean){
        this.geometry = new THREE.InstancedBufferGeometry();
        this.geometry.instanceCount = 0;

        this.positionAttribute = new THREE.BufferAttribute(new Float32Array(0), 3);
        this.localPositionAttribute = new THREE.BufferAttribute(new Float32Array(0), 2);
        this.polarizationAttribute = new THREE.BufferAttribute(new Float32Array(0), 1);
        this.metaAttribute = new THREE.BufferAttribute(new Int32Array(0), 1);
        this.ghostMode = ghostMode;

        this.drawMesh = new THREE.Mesh(this.geometry, DrawableCellMaterial);
        this.drawMesh.matrixAutoUpdate = false;

        this.pickMesh = new THREE.Mesh(this.geometry, PickableCellMaterial);
        this.pickMesh.matrixAutoUpdate = false;
    }

    getDrawMesh(): THREE.Mesh{
        return this.drawMesh;
    }

    getPickMesh(): THREE.Mesh{
        return this.pickMesh;
    }

    dispose(): void{
        this.geometry.dispose();
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

    update(cells: Cell[], selectedCells: Set<number>){
        const MAX_POLARIZATION = 2;
        const posOffs = [-1, 1];

        let indeces = new Array(cells.length * 6);
        let positionBuf = new Float32Array(cells.length * 4 * 3);
        let localPositionBuf = new Float32Array(cells.length * 4 * 2);
        let polarizationBuf = new Float32Array(cells.length * 4 * MAX_POLARIZATION);
        let metaBuff = new Int32Array(cells.length * 4);

        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];

            indeces[(i*6) + 0] = (i*4) + 0;
            indeces[(i*6) + 1] = (i*4) + 2;
            indeces[(i*6) + 2] = (i*4) + 1;
            indeces[(i*6) + 3] = (i*4) + 1;
            indeces[(i*6) + 4] = (i*4) + 2;
            indeces[(i*6) + 5] = (i*4) + 3;

            let cnt = 0;
            for (let x = 0; x < posOffs.length; x++){
                for (let y = 0; y < posOffs.length; y++){
                    positionBuf[i*(4 * 3) + cnt + 0] = cell.position[0] + posOffs[x]/2 * 20;
                    positionBuf[i*(4 * 3) + cnt + 1] = cell.position[1] + posOffs[y]/2 * 20;
                    positionBuf[i*(4 * 3) + cnt + 2] = 0;
                    cnt += 3;
                }
            }          
            
            cnt = 0
            for (let x = 0; x < posOffs.length; x++){
                for (let y = 0; y < posOffs.length; y++){
                    localPositionBuf[i*(4 * 2) + cnt + 0] = posOffs[x];
                    localPositionBuf[i*(4 * 2) + cnt + 1] = posOffs[y];
                    cnt += 2;
                }
            }
            

            const polarization = getPolarization(cell);
            for (let p = 0; p < MAX_POLARIZATION; p++) {
                if (p < polarization.length){
                    polarizationBuf[i*(4*MAX_POLARIZATION) + 0 * MAX_POLARIZATION + p] = polarization[p];
                    polarizationBuf[i*(4*MAX_POLARIZATION) + 1 * MAX_POLARIZATION + p] = polarization[p];
                    polarizationBuf[i*(4*MAX_POLARIZATION) + 2 * MAX_POLARIZATION + p] = polarization[p];
                    polarizationBuf[i*(4*MAX_POLARIZATION) + 3 * MAX_POLARIZATION + p] = polarization[p];
                }
            }

            let metadata = this.getCellMetadata(i, selectedCells.contains(i), this.ghostMode);

            metaBuff[i*4 + 0] = metadata;
            metaBuff[i*4 + 1] = metadata;
            metaBuff[i*4 + 2] = metadata;
            metaBuff[i*4 + 3] = metadata;
        }
        
        this.positionAttribute = new THREE.BufferAttribute(positionBuf, 3);
        this.positionAttribute.setUsage(THREE.StaticDrawUsage);
        this.localPositionAttribute = new THREE.BufferAttribute(localPositionBuf, 2);
        this.localPositionAttribute.setUsage(THREE.StaticDrawUsage);
        this.polarizationAttribute = new THREE.BufferAttribute(polarizationBuf, 2);
        this.polarizationAttribute.setUsage(THREE.StaticDrawUsage);
        this.metaAttribute = new THREE.BufferAttribute(metaBuff, 1);
        this.metaAttribute.setUsage(THREE.StaticDrawUsage);

        this.geometry.instanceCount = cells.length;
        this.geometry.setIndex(indeces);
        this.geometry.setAttribute('position', this.positionAttribute);
        this.geometry.setAttribute('localPosition', this.localPositionAttribute);
        this.geometry.setAttribute('polarization', this.polarizationAttribute);
        this.geometry.setAttribute('inMetadata', this.metaAttribute);
    }
}