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
    import { CellType, type Cell, deserializeCells } from './Cell';
    import { CellScene } from './CellScene';

    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let controls: OrbitControls;
    let container: HTMLElement; 
    let canvas: HTMLCanvasElement;

    let scene: CellScene;
    let cellGeometry: CellGeometry;
    let drawInstancedMesh: THREE.Mesh;
    let pickInstancedMesh: THREE.Mesh;

    let ghostGeometry: CellGeometry;
    let ghostMesh: THREE.Mesh;
    let snapDivider: number = 1;

    let stats: Stats;
    let statsDrawCall: Stats.Panel;

    let inputModeIdx: number = 0;
    $: inputMode = inputModeChanged(inputModeIdx);
    let mouseStartPos: THREE.Vector2|undefined;

    let cells: Cell[] = [];
    let selectedCells: Set<number> = new Set<number>();

    onMount(() => {
        scene = new CellScene();
        camera = new THREE.PerspectiveCamera( 75, 1, 0.1, 1000 );
        camera.position.z += 1;

        renderer = new THREE.WebGLRenderer({canvas: canvas});
        renderer.setClearAlpha(0);
        renderer.setClearColor(0);
        //renderer.setPixelRatio(window.devicePixelRatio);

        windowResize();

        stats = new Stats();
        renderer.domElement.appendChild(stats.dom)
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
                cells.push({typ: CellType.Fixed, clock_phase_shift: 0, polarization: Math.random() * 2 - 1, pos_x: i, pos_y: j})
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
        renderer.setSize( container.clientWidth, container.clientHeight, false);
        renderer.domElement.className += " flex";
        camera.aspect = container.clientWidth / container.clientHeight; 
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
        ghostGeometry.update([{polarization: 0, pos_x: 0, pos_y: 0, clock_phase_shift: 0, typ: CellType.Normal}], new Set(), true);
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

        if (inputMode == 0){
            if (e.button == 0)
                startSelectRegion(relX, relY);
        }else if (inputMode == 1){
            if (e.button == 0)
                startCellPlace(relX, relY);
        }
    }

    function mouseUp(e: MouseEvent){
        var bounds = renderer.domElement.getBoundingClientRect();
        const relX = e.x - bounds.left;
        const relY = e.y - bounds.top;
        
        if (inputMode == 0){
            if (e.button == 0)
                endSelectRegion(relX, relY);
        }else if (inputMode == 1){
            if (e.button == 0)
                endCellPlace(relX, relY);
        }
    }

    function mouseMove(e: MouseEvent){
        var bounds = renderer.domElement.getBoundingClientRect();
        const relX = e.x - bounds.left;
        const relY = e.y - bounds.top;

        if (inputMode == 1){
            repositionGhostMesh(relX, relY);
        }
    }

    function startSelectRegion(mouse_x: number, mouse_y: number){
    }

    function endSelectRegion(mouse_x: number, mouse_y: number){
        selectedCells.clear();
        let result = renderPickBuffer(mouseStartPos?.x ?? 0, mouseStartPos?.y ?? 0, mouse_x, mouse_y);
        for (let i = 0; i < result.length/4; i++) {
            const id = result[i*4];
            if (id >= 0)
                selectedCells.add(id);
        }

        cellGeometry.update(cells, selectedCells, false);
        
        mouseStartPos = undefined;
    }

    function screenSpaceToWorld(mouse_x: number, mouse_y: number): THREE.Vector3{
        const mousePos = new THREE.Vector3(( mouse_x / container.clientWidth ) * 2 - 1,
        - ( mouse_y / container.clientHeight ) * 2 + 1,
        0);

        var tempVec = mousePos.unproject(camera);

        var planeNormal = new THREE.Vector3(0, 0, 1).normalize();
        var plane = new THREE.Plane(planeNormal);

        tempVec.sub(camera.position);
        tempVec.normalize();
        var vectorOrigin = camera.position;
        var vector = new THREE.Ray(vectorOrigin, tempVec);

        var intersectionPoint = new THREE.Vector3();
        vector.intersectPlane(plane, intersectionPoint);
        return intersectionPoint
    }

    function startCellPlace(mouse_x: number, mouse_y: number){

    }

    function endCellPlace(mouse_x: number, mouse_y: number){
        let world_pos =  screenSpaceToWorld(mouse_x, mouse_y);
        world_pos.x = Math.floor((world_pos.x + snapDivider / 2) / snapDivider);
        world_pos.y = Math.floor((world_pos.y + snapDivider / 2) / snapDivider);
        
        cells.push({typ: CellType.Normal, polarization: 0, pos_x: world_pos.x, pos_y: world_pos.y, clock_phase_shift: 0})
        cellGeometry.update(cells, selectedCells, false);
    }

    function repositionGhostMesh(mouse_x: number, mouse_y: number){
        let world_pos =  screenSpaceToWorld(mouse_x, mouse_y);
        world_pos.x = Math.floor((world_pos.x + snapDivider / 2) / snapDivider);
        world_pos.y = Math.floor((world_pos.y + snapDivider / 2) / snapDivider);
        ghostGeometry.update([{polarization: 0, pos_x: world_pos.x, pos_y: world_pos.y, clock_phase_shift: 0, typ: CellType.Normal}], new Set(), true);
    }

    function inputModeChanged(newInputModeIdx: number){
        let oldInputMode = inputMode;
        let newInputMode = newInputModeIdx;

        switch (oldInputMode){
            case 0: {
                break;
            }
            case 1: {
                removeGhostMesh();
                break;
            }
        }

        switch (newInputMode){
            case 0: {
                break;
            }
            case 1: {
                createGhostMesh();
                break;
            }
        }

        return newInputMode;
    }
    
</script>

<svelte:window on:resize={() => windowResize()}/>

<div id='canvas' class="relative flex flex-auto" bind:this={container}>
    <div class="absolute top-2 left-1 z-10">
        <AppRail width="w-8">
            <AppRailTile bind:group={inputModeIdx} name="tile-1" value={0} title="tile-1">
                <Icon width={24} icon={arrowSelectorTool} style="margin: auto;"/>
            </AppRailTile>
            <AppRailTile bind:group={inputModeIdx} name="tile-2" value={1} title="tile-2">
                <Icon width={24} icon={addBoxOutline} style="margin: auto;"/>
            </AppRailTile>
        </AppRail>
    </div>
    <canvas bind:this={canvas} class="absolute z-0"/>
</div>