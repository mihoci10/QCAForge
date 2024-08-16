import * as THREE from 'three'
import { type CellIndex } from './Cell';

class CellSceneLayer{
    public visible: boolean;
    private drawScene: THREE.Scene;
    private pickScene: THREE.Scene;

    constructor(visible: boolean) {
        this.visible = visible;
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

    getDrawScene(): THREE.Scene{
        return this.drawScene;    
    }

    getPickScene(): THREE.Scene{
        return this.pickScene;    
    }
}

export class CellScene{
    private renderer: THREE.WebGLRenderer;
    private camera: THREE.Camera;
    private layers: CellSceneLayer[] = [];

    constructor (renderer: THREE.WebGLRenderer, camera: THREE.Camera){
        this.renderer = renderer;
        this.camera = camera;
        this.layers = [];
    }

    getLayer(layerInd: number){
        return this.layers[layerInd];
    }

    addLayer(layerInd: number){
        this.layers.splice(layerInd, 0, new CellSceneLayer(true));
    }

    removeLayer(layerInd: number){
        this.layers.splice(layerInd, 1);
    }

    render(){
        this.renderer.setRenderTarget(null);
        for (let i = 0; i < this.layers.length; i++) {
            const layer = this.layers[i];
            if(layer.visible)
                this.renderer.render(layer.getDrawScene(), this.camera);
        }
    }

    pick(x1: number, y1: number, x2: number, y2: number) : Set<CellIndex>{
        let selectedCells: Set<CellIndex> = new Set<CellIndex>;
        for (let i = 0; i < this.layers.length; i++) {
            const layer = this.layers[i];
            if(layer.visible){
                const pickBuffer = this.renderPickBuffer(layer.getPickScene(), x1, y1, x2, y2);
                for (let i = 0; i < pickBuffer.length/4; i++) {
                    const id = pickBuffer[i*4];
                    if (id >= 0)
                        selectedCells.add({layer: i, cell: id});
                }
            }
        }
        return selectedCells;
    }

    private renderPickBuffer(scene: THREE.Scene, x1: number, y1: number, x2: number, y2: number): Int32Array{
        const width = Math.max(Math.abs(x2 - x1), 1);
        const height = Math.max(Math.abs(y2 - y1), 1);
        const pickingTexture = new THREE.WebGLRenderTarget( 
            this.renderer.domElement.width, 
            this.renderer.domElement.height, 
            {
                type: THREE.IntType,
                format: THREE.RGBAIntegerFormat,
                internalFormat: 'RGBA32I',
            } 
        );

        this.renderer.setRenderTarget(pickingTexture);
        this.renderer.setClearColor(new THREE.Color(-1, -1, -1));
        this.renderer.render(scene, this.camera);
        
        const pickingBuffer = new Int32Array(width * height * 4);
        this.renderer.readRenderTargetPixels(
            pickingTexture, 
            Math.min(x1, x2), this.renderer.domElement.height - Math.max(y1, y2), 
            width, height, 
            pickingBuffer
        );

        return pickingBuffer;
    }

}