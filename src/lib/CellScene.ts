import * as THREE from 'three'

export class CellScene{
    private drawScene: THREE.Scene;
    private pickScene: THREE.Scene;

    constructor (){
        this.drawScene = new THREE.Scene();
        this.pickScene = new THREE.Scene();
    }

    addMesh(drawMesh: THREE.Mesh, pickMesh: THREE.Mesh|undefined): void{
        this.drawScene.add(drawMesh);
        if (pickMesh != undefined)
            this.pickScene.add(pickMesh);
    }

    removeMesh(drawMesh: THREE.Mesh, pickMesh: THREE.Mesh|undefined): void{
        this.drawScene.remove(drawMesh);
        if (pickMesh != undefined)
            this.pickScene.remove(pickMesh);
    }

    getDrawCtx(): THREE.Scene{
        return this.drawScene;
    }

    getPickCtx(): THREE.Scene{
        return this.pickScene;
    }

}