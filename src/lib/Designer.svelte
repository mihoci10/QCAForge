<script lang="ts">
	import {AppRail, AppRailTile} from '@skeletonlabs/skeleton'
    import Icon from '@iconify/svelte';
    import arrowSelectorTool from '@iconify/icons-material-symbols/arrow-selector-tool';
    import addBoxOutline from '@iconify/icons-material-symbols/add-box-outline';
    import { onDestroy, onMount } from 'svelte';
    import Stats from 'stats.js'

    import * as THREE from 'three'
    import {DrawableCellMaterial, PickableCellMaterial} from './CellMaterial';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { CellGeometry } from './CellGeometry';
    import { CellType, type Cell } from './Cell';
    import { CellScene } from './CellScene';

    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let controls: OrbitControls;

    let scene: CellScene;
    let cellGeometry: CellGeometry;
    let drawInstancedMesh: THREE.Mesh;
    let pickInstancedMesh: THREE.Mesh;

    let ghostGeometry: CellGeometry;
    let ghostMesh: THREE.Mesh;

    let stats: Stats;
    let statsDrawCall: Stats.Panel;

    let inputModeIdx: number = -1;
    $: inputMode = inputModeChanged(inputModeIdx);
    let mouseStartPos: THREE.Vector2|undefined;

    let cells: Cell[] = [];
    let selectedCells: Set<number> = new Set<number>();

    onMount(() => {
        scene = new CellScene();
        camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        camera.position.z += 1;

        renderer = new THREE.WebGLRenderer();
        renderer.setClearAlpha(0);
        renderer.setClearColor(0);
        //renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize( window.innerWidth, window.innerHeight );
        document.getElementById('canvas')?.appendChild(renderer.domElement);

        stats = new Stats();
        document.body.appendChild(stats.dom)
        statsDrawCall = stats.addPanel(new Stats.Panel('Draw calls', '#ff8', '#221'));
        stats.showPanel(0);

        renderer.domElement.addEventListener('mousedown', mouseDown);
        renderer.domElement.addEventListener('mousemove', mouseMove);
        renderer.domElement.addEventListener('mouseup', mouseUp);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableRotate = false;

        cellGeometry = new CellGeometry();
        ghostGeometry = new CellGeometry();

        let cnt = 0;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                cells.push({id: cnt, type: CellType.Normal, polarization: Math.random() * 2 - 1, position: new THREE.Vector3(i, j, 0)})
                cnt++;
            }
        }

        cellGeometry.update(cells, selectedCells, false);

        drawInstancedMesh = new THREE.Mesh(cellGeometry.getGeometry(), DrawableCellMaterial);
        drawInstancedMesh.matrixAutoUpdate = false;
        pickInstancedMesh = new THREE.Mesh(cellGeometry.getGeometry(), PickableCellMaterial);
        pickInstancedMesh.matrixAutoUpdate = false;

        scene.addMesh(drawInstancedMesh, pickInstancedMesh);

        renderer.setAnimationLoop(render);
    });

    onDestroy(() => {
        renderer.dispose();
        cellGeometry.dispose();
        ghostGeometry.dispose();
        DrawableCellMaterial.dispose();
        PickableCellMaterial.dispose();
    });

    function windowResize(){
        //renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize( window.innerWidth, window.innerHeight );
        camera.aspect = window.innerWidth / window.innerHeight; 
        camera.updateProjectionMatrix();
    }

    function render(){
        controls.update();
        renderer.setRenderTarget(null);
        stats.begin();
        renderer.render(scene.getDrawCtx(), camera);
        stats.end();

        statsDrawCall.update(renderer.info.render.calls, 10);
    }   

    function renderPickBuffer(x1: number, y1: number, x2: number, y2: number){
        const width = Math.max(Math.abs(x2 - x1), 1);
        const height = Math.max(Math.abs(y2 - y1), 1);
        const pickingTexture = new THREE.WebGLRenderTarget( 
            renderer.domElement.width, 
            renderer.domElement.height, 
            {
                type: THREE.IntType,
                format: THREE.RGBAIntegerFormat,
                internalFormat: 'RGBA32I',
            } 
        );

        renderer.setRenderTarget(pickingTexture);
        renderer.setClearColor(new THREE.Color(-1, -1, -1));
        renderer.render(scene.getPickCtx(), camera);
        
        const pickingBuffer = new Int32Array(width * height * 4);
        console.log(width, height)
        renderer.readRenderTargetPixels(
            pickingTexture, 
            Math.min(x1, x2), renderer.domElement.height - Math.max(y1, y2), 
            width, height, 
            pickingBuffer
        );

        return pickingBuffer;
    }

    function createGhostMesh(){
        ghostGeometry.update([{id: 0, polarization: 0, position: new THREE.Vector3(0, 0, 0), type: CellType.Normal}], new Set(), true);
        ghostMesh = new THREE.Mesh(ghostGeometry.getGeometry(), DrawableCellMaterial);
        scene.addMesh(ghostMesh, undefined);
    }

    function removeGhostMesh(){
        ghostGeometry.update([], new Set(), true);
        if (ghostMesh != undefined)
            scene.removeMesh(ghostMesh, undefined);
    }

    function mouseDown(e: MouseEvent){
        var bounds = renderer.domElement.getBoundingClientRect();
        const relX = e.x - bounds.left;
        const relY = e.y - bounds.top;
        mouseStartPos = new THREE.Vector2(relX, relY);
        console.log(mouseStartPos);
    }

    function mouseUp(e: MouseEvent){
        var bounds = renderer.domElement.getBoundingClientRect();
        const relX = e.x - bounds.left;
        const relY = e.y - bounds.top;

        selectedCells.clear();
        let result = renderPickBuffer(mouseStartPos?.x ?? 0, mouseStartPos?.y ?? 0, relX, relY);
        for (let i = 0; i < result.length/4; i++) {
            const id = result[i*4];
            if (id >= 0)
                selectedCells.add(id);
        }

        cellGeometry.update(cells, selectedCells, false);
        
        mouseStartPos = undefined;
    }

    function mouseMove(e: MouseEvent){
        
    }

    function inputModeChanged(newInputModeIdx: number){
        let oldInputMode = inputMode;
        let newInputMode = newInputModeIdx;
        console.log(oldInputMode);
        console.log(newInputMode);

        switch (oldInputMode){
            case 0: {

            }
            case 1: {
                removeGhostMesh();
            }
        }

        switch (newInputMode){
            case 0: {

            }
            case 1: {
                createGhostMesh();
            }
        }

        return newInputMode;
    }
    
</script>

<svelte:window on:resize={() => windowResize()}/>

<div id='canvas' class="relative">
    <div class="absolute top-2 left-1">
        <AppRail width="w-8">
            <AppRailTile bind:group={inputMode} name="tile-1" value={0} title="tile-1">
                <Icon width={24} icon={arrowSelectorTool} style="margin: auto;"/>
            </AppRailTile>
            <AppRailTile bind:group={inputMode} name="tile-2" value={1} title="tile-2">
                <Icon width={24} icon={addBoxOutline} style="margin: auto;"/>
            </AppRailTile>
        </AppRail>
    </div>
</div>