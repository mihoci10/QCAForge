import * as THREE from 'three'
import type { Cell } from './Cell';

export class CellGeometry{
    private geometry: THREE.InstancedBufferGeometry;

    private positionAttribute: THREE.BufferAttribute;
    private localPositionAttribute: THREE.BufferAttribute;
    private polarizationAttribute: THREE.BufferAttribute;
    private idAttribute: THREE.BufferAttribute;

    constructor (){
        this.geometry = new THREE.InstancedBufferGeometry();
        this.geometry.instanceCount = 0;

        this.positionAttribute = new THREE.BufferAttribute(new Float32Array(0), 3);
        this.localPositionAttribute = new THREE.BufferAttribute(new Float32Array(0), 2);
        this.polarizationAttribute = new THREE.BufferAttribute(new Float32Array(0), 1);
        this.idAttribute = new THREE.BufferAttribute(new Int32Array(0), 1);
    }

    getGeometry(): THREE.InstancedBufferGeometry{
        return this.geometry;
    }

    dispose(): void{
        this.geometry.dispose();
    }

    update(cells: Cell[]){
        let indeces = new Array(cells.length * 6);
        let positionBuf = new Float32Array(cells.length * 4 * 3);
        let localPositionBuf = new Float32Array(cells.length * 4 * 2);
        let polarizationBuf = new Float32Array(cells.length * 4);
        let idBuf = new Int32Array(cells.length * 4);

        const posOffs = [-1, 1];

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
                    positionBuf[i*(4 * 3) + cnt + 0] = cell.position.x + posOffs[x]/2;
                    positionBuf[i*(4 * 3) + cnt + 1] = cell.position.y + posOffs[y]/2;
                    positionBuf[i*(4 * 3) + cnt + 2] = cell.position.z;
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
            
            polarizationBuf[i*4 + 0] = cell.polarization;
            polarizationBuf[i*4 + 1] = cell.polarization;
            polarizationBuf[i*4 + 2] = cell.polarization;
            polarizationBuf[i*4 + 3] = cell.polarization;

            idBuf[i*4 + 0] = cell.id;
            idBuf[i*4 + 1] = cell.id;
            idBuf[i*4 + 2] = cell.id;
            idBuf[i*4 + 3] = cell.id;
        }
        
        this.positionAttribute = new THREE.BufferAttribute(positionBuf, 3);
        this.positionAttribute.setUsage(THREE.StaticDrawUsage);
        this.localPositionAttribute = new THREE.BufferAttribute(localPositionBuf, 2);
        this.localPositionAttribute.setUsage(THREE.StaticDrawUsage);
        this.polarizationAttribute = new THREE.BufferAttribute(polarizationBuf, 1);
        this.polarizationAttribute.setUsage(THREE.StaticDrawUsage);
        this.idAttribute = new THREE.BufferAttribute(idBuf, 1);
        this.idAttribute.setUsage(THREE.StaticDrawUsage);

        this.geometry.instanceCount = cells.length;
        this.geometry.setIndex(indeces);
        this.geometry.setAttribute('position', this.positionAttribute);
        this.geometry.setAttribute('localPosition', this.localPositionAttribute);
        this.geometry.setAttribute('polarization', this.polarizationAttribute);
        this.geometry.setAttribute('inId', this.idAttribute);
    }
}