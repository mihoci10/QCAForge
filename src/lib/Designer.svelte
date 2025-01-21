<script lang="ts">
	import {TreeView, AppRail, AppRailTile} from '@skeletonlabs/skeleton'
    import Icon from '@iconify/svelte';
    import arrowSelectorTool from '@iconify/icons-material-symbols/arrow-selector-tool';
    import addBoxOutline from '@iconify/icons-material-symbols/add-box-outline';
    import { onDestroy, onMount } from 'svelte';
    import Stats from 'stats.js'

    import * as THREE from 'three'
    import {DrawableCellMaterial, PickableCellMaterial} from './CellMaterial';
    import { CellGeometry } from './CellGeometry';
    import { CellIndex, CellType, parseCellIndex, type Cell } from './Cell';
    import { CellScene } from './CellScene';
    import { OrbitControls } from './utils/OrbitControls';
    import { Pane, Splitpanes, } from 'svelte-splitpanes'

    import type { Layer } from './Layer';
    import type { SimulationModel } from './SimulationModel';
    import SimSettingsPanel from './panels/sim-settings-panel.svelte';
    import LayersPanel from './panels/layers-panel.svelte';
    import CellPropsPanel from './panels/cell-props-panel.svelte';
    import { getDefaultCellArchitecture } from './CellArchitecture';

    import { Set } from 'typescript-collections'
    import { Menu } from "@tauri-apps/api/menu";
    import { menu } from '@tauri-apps/api';

    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let controls: OrbitControls;
    let container: HTMLElement; 
    let canvas: HTMLCanvasElement;

    let globalScene: THREE.Scene;
    let cellScene: CellScene;

    let ghostGeometry: CellGeometry;
    let snapDivider: number = 20;

    let stats: Stats;
    let statsDrawCall: Stats.Panel;

    let inputModeIdx: number = 0;
    $: inputMode = inputModeChanged(inputModeIdx);
    let mouseStartPos: THREE.Vector2|undefined;
    let multiselect: boolean = false;
    let mouseDragging: boolean = false;

    let selectedCells: Set<CellIndex> = new Set<CellIndex>();
    let cachedCellsPos: {[id: string]: [pos_x: number, pos_y: number]} = {};

    let selectedCellsUpdatedDispatch : (() => void);

    export let selected_model_id: string | undefined;
    let sim_models: string[] = [];

    export let layers: Layer[];

    let selectedLayer: number = 0;

    export let simulation_models: Map<string, SimulationModel>;

    onMount(() => {
        camera = new THREE.PerspectiveCamera( 75, 1, 0.1, 1000 );
        camera.position.z += 20;

        renderer = new THREE.WebGLRenderer({canvas: canvas});
        renderer.setClearAlpha(0);
        renderer.setClearColor(0);
        renderer.autoClear = false;
        //renderer.setPixelRatio(window.devicePixelRatio);

        globalScene = new THREE.Scene();
        cellScene = new CellScene(renderer, camera);

        windowResize();

        stats = new Stats();
        renderer.domElement.appendChild(stats.dom)
        statsDrawCall = stats.addPanel(new Stats.Panel('Draw calls', '#ff8', '#221'));
        stats.showPanel(0);

        renderer.domElement.addEventListener('mousedown', mouseDown);
        renderer.domElement.addEventListener('mousemove', mouseMove);
        renderer.domElement.addEventListener('mouseup', mouseUp);
        window.addEventListener('keydown', keyDown);
        window.addEventListener('keyup', keyUp);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableRotate = false;

        ghostGeometry = new CellGeometry(true);

        // let cnt = 0;
        // for (let i = 0; i < 3; i++) {
        //     for (let j = 0; j < 3; j++) {
        //         cells.push({typ: CellType.Fixed, clock_phase_shift: 0, z_index:0, polarization: Math.random() * 2 - 1, pos_x: i * 20, pos_y: j * 20})
        //         cnt++;
        //     }
        // }

        cellScene.addLayer(0);
        //scene.getLayer(0).addCellGeometry(cellGeometry);

        renderer.setAnimationLoop(render);
    });

    onDestroy(() => {
        renderer.dispose();
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
        renderer.clear();
        stats.begin();
        renderer.render(globalScene, camera);
        cellScene.render();
        stats.end();

        statsDrawCall.update(renderer.info.render.calls, 10);
    }   

    function createGhostMesh(){
        ghostGeometry.update([{
            position: [0, 0], clock_phase_shift: 0, typ: CellType.Normal,
            rotation: 0,
            dot_probability_distribution: [0, 0, 0, 0]
        }], new Set(), layers[selectedLayer].cell_architecture);
        globalScene.add(ghostGeometry.getDrawMesh());
    }

    function removeGhostMesh(){
        ghostGeometry.update([], new Set(), layers[selectedLayer].cell_architecture);
        globalScene.remove(ghostGeometry.getDrawMesh());
    }

    function shouldMouseDrag(mouse_x: number, mouse_y: number): boolean{
        let id = getCellOnPos(mouse_x, mouse_y);

        if (!id)
            return false;

        if (!selectedCells.isEmpty() && selectedCells.contains(id))
            return true;
        
        applySelectRegion(mouse_x, mouse_y);
        return !selectedCells.isEmpty();
    }

    function mouseDown(e: MouseEvent){
        var bounds = renderer.domElement.getBoundingClientRect();
        const relX = e.x - bounds.left;
        const relY = e.y - bounds.top;

        mouseStartPos = new THREE.Vector2(relX, relY);

        if (inputMode == 0){
            if (e.button == 0)
            {
                if(!multiselect){
                    mouseDragging = shouldMouseDrag(relX, relY);
                    if (mouseDragging)
                        startMouseDrag()
                }

                if(!mouseDragging)
                    startSelectRegion(relX, relY);
            }
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
            if (e.button == 0 && !mouseDragging)
                applySelectRegion(relX, relY);
            else if (e.button == 2 && 
                mouseStartPos && relX == mouseStartPos!.x && relY == mouseStartPos!.y){
                shouldMouseDrag(relX, relY);
                showContextMenu();
            }
        }else if (inputMode == 1){
            if (e.button == 0)
                endCellPlace(relX, relY);
        }
        
        mouseStartPos = undefined;
        mouseDragging = false;
    }

    function mouseMove(e: MouseEvent){
        var bounds = renderer.domElement.getBoundingClientRect();
        const relX = e.x - bounds.left;
        const relY = e.y - bounds.top;

        if (inputMode == 0){
            if (mouseStartPos != undefined && mouseDragging){
                repositionCells(relX, relY);
            }
        }
        else if (inputMode == 1){
            if (mouseStartPos != undefined)
                repositionGhostMesh(mouseStartPos!.x, mouseStartPos!.y);
            else
                repositionGhostMesh(relX, relY);
        }
    }

    function keyDown(e: KeyboardEvent){
        multiselect = e.shiftKey;
    }

    function keyUp(e: KeyboardEvent){
        multiselect = false;

        switch(e.code){
            case 'Delete': {
                deleteCells(selectedCells);
            }
        }
    }

    function startMouseDrag(){
        cachedCellsPos = {};
        selectedCells.forEach((id) => {
            const cell = layers[id.getLayer()].cells[id.getCell()];
            cachedCellsPos[id.toString()] = [cell.position[0], cell.position[1]];
        });
    }

    function endMouseDrag(){
        cachedCellsPos = {};
    }

    function startSelectRegion(mouse_x: number, mouse_y: number){
    }

    function getCellOnPos(mouse_x: number, mouse_y: number): CellIndex|undefined{
        let cellsUnderMouse = cellScene.pick(mouseStartPos?.x ?? 0, mouseStartPos?.y ?? 0, mouse_x, mouse_y);
        
        if (cellsUnderMouse.isEmpty())
            return undefined;

        return cellsUnderMouse.toArray()[0];
    }

    function applySelectRegion(mouse_x: number, mouse_y: number){
        if (!multiselect)
            selectedCells.clear();

        let cellsUnderMouse = cellScene.pick(mouseStartPos?.x ?? 0, mouseStartPos?.y ?? 0, mouse_x, mouse_y);
        cellsUnderMouse.forEach((id) => {
            if (multiselect && selectedCells.contains(id))
                selectedCells.remove(id)
            else
                selectedCells.add(id)
        });

        cellScene.getLayer(selectedLayer).updateGeometry(layers[selectedLayer], selectedCells);
        selectedCellsUpdated();
    }
    
    function selectedCellsUpdated(){
        selectedCellsUpdatedDispatch();
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
        let world_pos =  screenSpaceToWorld(mouseStartPos!.x, mouseStartPos!.y);
        world_pos.x = Math.floor((world_pos.x + snapDivider / 2) / snapDivider) * snapDivider;
        world_pos.y = Math.floor((world_pos.y + snapDivider / 2) / snapDivider) * snapDivider;
        
        layers[selectedLayer].cells.push({
            position: [world_pos.x, world_pos.y], clock_phase_shift: 0, typ: CellType.Normal,
            rotation: 0,
            dot_probability_distribution: new Array(layers[selectedLayer].cell_architecture.dot_count).fill(0.0)
        })
        cellScene.getLayer(selectedLayer).updateGeometry(layers[selectedLayer], selectedCells);
    }

    function deleteCells(cell_ids: Set<CellIndex>){
        for (let i = 0; i < layers.length; i++) {
            layers[i].cells = layers[i].cells.filter((_, ind) => {
                return !cell_ids.contains(new CellIndex(i, ind));
            })
        }

        selectedCells.clear()
        cellScene.getLayer(selectedLayer).updateGeometry(layers[selectedLayer], selectedCells);
        selectedCellsUpdated();
    }

    function repositionCells(mouse_x: number, mouse_y: number){
        let orig_world_pos =  screenSpaceToWorld(mouseStartPos!.x, mouseStartPos!.y);
        orig_world_pos.x = Math.floor((orig_world_pos.x + snapDivider / 2) / snapDivider) * snapDivider;
        orig_world_pos.y = Math.floor((orig_world_pos.y + snapDivider / 2) / snapDivider) * snapDivider;

        let world_pos =  screenSpaceToWorld(mouse_x, mouse_y);
        world_pos.x = Math.floor((world_pos.x + snapDivider / 2) / snapDivider) * snapDivider;
        world_pos.y = Math.floor((world_pos.y + snapDivider / 2) / snapDivider) * snapDivider;

        let diff_x = world_pos.x - orig_world_pos.x;
        let diff_y = world_pos.y - orig_world_pos.y;

        for (let key in cachedCellsPos) {
            let id = parseCellIndex(key);
            if (!id)
                continue;

            let pos = cachedCellsPos[key];
            layers[id.getLayer()].cells[id.getCell()].position[0] = pos[0] + diff_x;
            layers[id.getLayer()].cells[id.getCell()].position[1] = pos[1] + diff_y;
        }

        cellScene.getLayer(selectedLayer).updateGeometry(layers[selectedLayer], selectedCells);
    }

    function repositionGhostMesh(mouse_x: number, mouse_y: number){
        let world_pos =  screenSpaceToWorld(mouse_x, mouse_y);
        world_pos.x = Math.floor((world_pos.x + snapDivider / 2) / snapDivider) * snapDivider;
        world_pos.y = Math.floor((world_pos.y + snapDivider / 2) / snapDivider) * snapDivider;
        ghostGeometry.update([{
            position: [world_pos.x, world_pos.y], clock_phase_shift: 0, typ: CellType.Normal,
            rotation: 0,
            dot_probability_distribution: new Array(layers[selectedLayer].cell_architecture.dot_count).fill(0.0)

        }], new Set(), layers[selectedLayer].cell_architecture);
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

    async function showContextMenu(){
        const menu = await Menu.new({
            items: [
                {
                    text: 'Copy',
                    accelerator: 'ctrl+C'
                },
                {
                    text: 'Paste',
                    accelerator: 'ctrl+V'
                }
            ]
        });
        menu.popup();
    }
    
</script>

<svelte:window on:resize={() => windowResize()}/>

<Splitpanes class="h-full overflow-auto" on:resize={() => windowResize()}>
    <Pane minSize={5} size={15}>
        <div class='h-full bg-surface-500 overflow-y-auto pr-2'>
            <TreeView>
                <SimSettingsPanel bind:selected_model_id={selected_model_id} bind:simulation_models={simulation_models}/>
                <LayersPanel bind:layers={layers} bind:selectedLayer={selectedLayer}/>
                <CellPropsPanel bind:layers={layers} bind:selectedCells={selectedCells} bind:selectedCellsUpdated={selectedCellsUpdatedDispatch}/>
            </TreeView>
        </div>
    </Pane>
    <Pane class="flex" minSize={10}>
        <div class="relative flex-1" bind:this={container}>
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
    </Pane>
</Splitpanes>