import * as THREE from 'three'
import type { Cell } from './Cell';

export class CellGeometry{
    private geometry: THREE.InstancedBufferGeometry;

    private positionAttribute: THREE.BufferAttribute;
    private localPositionAttribute: THREE.BufferAttribute;
    private polarizationAttribute: THREE.BufferAttribute;
    private metaAttribute: THREE.BufferAttribute;

    constructor (){
        this.geometry = new THREE.InstancedBufferGeometry();
        this.geometry.instanceCount = 0;

        this.positionAttribute = new THREE.BufferAttribute(new Float32Array(0), 3);
        this.localPositionAttribute = new THREE.BufferAttribute(new Float32Array(0), 2);
        this.polarizationAttribute = new THREE.BufferAttribute(new Float32Array(0), 1);
        this.metaAttribute = new THREE.BufferAttribute(new Int32Array(0), 1);
    }

    getGeometry(): THREE.InstancedBufferGeometry{
        return this.geometry;
    }

    dispose(): void{
        this.geometry.dispose();
    }

    _getCellMetadata(cell: Cell): number{
        let result = 0;
        result = cell.id << 16;
        return result;
    }

    update(cells: Cell[], selected: ){
        let indeces = new Array(cells.length * 6);
        let positionBuf = new Float32Array(cells.length * 4 * 3);
        let localPositionBuf = new Float32Array(cells.length * 4 * 2);
        let polarizationBuf = new Float32Array(cells.length * 4);
        let metaBuff = new Int32Array(cells.length * 4);

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

            let metadata = this._getCellMetadata(cell);

            metaBuff[i*4 + 0] = metadata;
            metaBuff[i*4 + 1] = metadata;
            metaBuff[i*4 + 2] = metadata;
            metaBuff[i*4 + 3] = metadata;
        }
        
        this.positionAttribute = new THREE.BufferAttribute(positionBuf, 3);
        this.positionAttribute.setUsage(THREE.StaticDrawUsage);
        this.localPositionAttribute = new THREE.BufferAttribute(localPositionBuf, 2);
        this.localPositionAttribute.setUsage(THREE.StaticDrawUsage);
        this.polarizationAttribute = new THREE.BufferAttribute(polarizationBuf, 1);
        this.polarizationAttribute.setUsage(THREE.StaticDrawUsage);
        this.metaAttribute = new THREE.BufferAttribute(metaBuff, 1);
        this.metaAttribute.setUsage(THREE.StaticDrawUsage);

        this.geometry.instanceCount = cells.length;
        this.geometry.setIndex(indeces);
        this.geometry.setAttribute('position', this.positionAttribute);
        this.geometry.setAttribute('localPosition', this.localPositionAttribute);
        this.geometry.setAttribute('polarization', this.polarizationAttribute);
        this.geometry.setAttribute('inId', this.metaAttribute);
    }
}