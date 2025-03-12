<script lang="ts">
    import * as Accordion from "$lib/components/ui/accordion";
    import { onDestroy, onMount } from 'svelte';
    import Stats from 'stats.js'

    import * as THREE from 'three'
    import {DrawableCellMaterial, PickableCellMaterial} from './CellMaterial';
    import { CellGeometry } from './CellGeometry';
    import { CellIndex, CellType, parseCellIndex, type Cell } from './Cell';
    import { CellScene } from './CellScene';
    import { OrbitControls } from './utils/OrbitControls';
    import * as Resizable from "$lib/components/ui/resizable";

    import type { Layer } from './Layer';
    import type { SimulationModel } from './SimulationModel';
    import SimSettingsPanel from './panels/sim-settings-panel.svelte';
    import CellPropsPanel from './panels/cell-props-panel.svelte';
    import LayersPanel from "./panels/layers-panel.svelte";

    import { Set } from 'typescript-collections'
    import { Menu } from "@tauri-apps/api/menu";
    import Button from "./components/ui/button/button.svelte";
    import Icon from "@iconify/svelte";

    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let controls: OrbitControls;
    let container: HTMLElement|undefined = $state(); 
    let canvas: HTMLCanvasElement|undefined = $state();

    let globalScene: THREE.Scene;
    let cellScene: CellScene;

    let ghostGeometry: CellGeometry;
    let snapDivider: number = 20;

    let stats: Stats;
    let statsDrawCall: Stats.Panel;

    let inputModeIdx: number = $state(0);

    let mouseStartPos: THREE.Vector2|undefined;
    let multiselect: boolean = false;
    let mouseDragging: boolean = false;

    let selectedCells: Set<CellIndex> = $state(new Set<CellIndex>());
    let cachedCellsPos: {[id: string]: [pos_x: number, pos_y: number]} = {};

    let sim_models: string[] = [];

    let selectedLayer: number = $state(0);
    let cellPropsPanel: CellPropsPanel;

    interface Props {
        selected_model_id: string|undefined,
        layers: Layer[];
        simulation_models: Map<string, SimulationModel>;
    }

    let { selected_model_id = $bindable(), layers = $bindable(), simulation_models = $bindable() }: Props = $props();

    onMount(() => {
        camera = new THREE.PerspectiveCamera( 75, 1, 0.1, 1000 );
        camera.position.z += 20;

        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            antialias: true,
        });
        renderer.setClearAlpha(0);
        renderer.setClearColor(0);
        renderer.autoClear = false;

        globalScene = new THREE.Scene();
        cellScene = new CellScene(renderer, camera);

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
        controls.zoomSpeed = 0.1;

        ghostGeometry = new CellGeometry(true);

        cellScene.addLayer(0);

        renderer.setAnimationLoop(render);
        
        drawCurrentLayer();
    });

    onDestroy(() => {
        renderer.dispose();
        ghostGeometry.dispose();
        DrawableCellMaterial.dispose();
        PickableCellMaterial.dispose();
    });

    function windowResize(){
        renderer.setSize( container!.clientWidth * devicePixelRatio, container!.clientHeight * devicePixelRatio, false);
        camera.aspect = container!.clientWidth / container!.clientHeight; 
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

    function getMouseEventPos(e: MouseEvent): THREE.Vector2{
        var bounds = renderer.domElement.getBoundingClientRect();
        return new THREE.Vector2(
            (e.x - bounds.left), 
            (e.y - bounds.top)
        ).multiplyScalar(devicePixelRatio);
    }

    function mouseDown(e: MouseEvent){
        const mousePos = getMouseEventPos(e);
        mouseStartPos = mousePos;

        if (inputMode == 0){
            if (e.button == 0)
            {
                if(!multiselect){
                    mouseDragging = shouldMouseDrag(mousePos.x, mousePos.y);
                    if (mouseDragging)
                        startMouseDrag()
                }

                if(!mouseDragging)
                    startSelectRegion(mousePos.x, mousePos.y);
            }
        }else if (inputMode == 1){
            if (e.button == 0)
                startCellPlace(mousePos.x, mousePos.y);
        }
    }

    function mouseUp(e: MouseEvent){
        const mousePos = getMouseEventPos(e);
        
        if (inputMode == 0){
            if (e.button == 0 && !mouseDragging)
                applySelectRegion(mousePos.x, mousePos.y);
            else if (e.button == 2 && 
                mouseStartPos && mousePos.x == mouseStartPos!.x && mousePos.y == mouseStartPos!.y){
                shouldMouseDrag(mousePos.x, mousePos.y);
                showContextMenu();
            }
        }else if (inputMode == 1){
            if (e.button == 0)
                endCellPlace(mousePos.x, mousePos.y);
        }
        
        mouseStartPos = undefined;
        mouseDragging = false;
    }

    function mouseMove(e: MouseEvent){
        const mousePos = getMouseEventPos(e);

        if (inputMode == 0){
            if (mouseStartPos != undefined && mouseDragging){
                repositionCells(mousePos.x, mousePos.y);
            }
        }
        else if (inputMode == 1){
            if (mouseStartPos != undefined)
                repositionGhostMesh(mouseStartPos!.x, mouseStartPos!.y);
            else
                repositionGhostMesh(mousePos.x, mousePos.y);
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
        drawCurrentLayer();
        selectedCellsUpdated();
    }
    
    function selectedCellsUpdated(){
        cellPropsPanel.selectedCellsUpdated();
    }

    function drawCurrentLayer(){
        cellScene.getLayer(selectedLayer).updateGeometry(layers[selectedLayer], selectedCells);
    }

    function screenSpaceToWorld(mouse_x: number, mouse_y: number): THREE.Vector3{
        const mousePos = new THREE.Vector3(
            ( (mouse_x) / renderer.domElement.width ) * 2 - 1,
            - ( (mouse_y) / renderer.domElement.height ) * 2 + 1,
            0
        );

        var tempVec = mousePos.unproject(camera);

        var planeNormal = new THREE.Vector3(0, 0, 1).normalize();
        var plane = new THREE.Plane(planeNormal);

        tempVec.sub(camera.position);
        tempVec.normalize();
        var vectorOrigin = camera.position;
        var vector = new THREE.Ray(vectorOrigin, tempVec);

        var intersectionPoint = new THREE.Vector3();
        vector.intersectPlane(plane, intersectionPoint);
        return intersectionPoint;
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
        drawCurrentLayer();
    }

    function deleteCells(cell_ids: Set<CellIndex>){
        for (let i = 0; i < layers.length; i++) {
            layers[i].cells = layers[i].cells.filter((_, ind) => {
                return !cell_ids.contains(new CellIndex(i, ind));
            })
        }

        selectedCells.clear()
        drawCurrentLayer();
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

        drawCurrentLayer();
    }

    function repositionGhostMesh(mouse_x: number, mouse_y: number){
        let world_pos = screenSpaceToWorld(mouse_x, mouse_y);
        world_pos.x = Math.floor((world_pos.x + snapDivider / 2) / snapDivider) * snapDivider;
        world_pos.y = Math.floor((world_pos.y + snapDivider / 2) / snapDivider) * snapDivider;
        ghostGeometry.update([{
            position: [world_pos.x, world_pos.y], clock_phase_shift: 0, typ: CellType.Normal,
            rotation: 0,
            dot_probability_distribution: new Array(layers[selectedLayer].cell_architecture.dot_count).fill(0.0)

        }], new Set(), layers[selectedLayer].cell_architecture);
    }

    function inputModeChanged(newInputModeIdx: number){
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

        oldInputMode = newInputMode;
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
    
    let inputMode = $derived(inputModeChanged(inputModeIdx));
    // svelte-ignore state_referenced_locally
    let oldInputMode = inputModeIdx;

        
    $effect(() => {
        const resizeObserver = new ResizeObserver(() => {
            windowResize();
        });
        resizeObserver.observe(container!);
    });
</script>

<Resizable.PaneGroup direction="horizontal">
    <Resizable.Pane defaultSize={30} minSize={10}>
        <div class='h-full bg-surface-500 overflow-y-auto pr-2'>
            <Accordion.Root type="multiple">
                <SimSettingsPanel {selected_model_id} {simulation_models}/>
                <LayersPanel {layers} {selectedLayer}/>
                <CellPropsPanel bind:layers={layers} {selectedCells} bind:this={cellPropsPanel}/>
            </Accordion.Root>
        </div>
    </Resizable.Pane>
    <Resizable.Handle />
    <Resizable.Pane minSize={10}>
        <div class="relative h-full w-full flex items-stretch" bind:this={container}>
            <div class="absolute top-2 left-1 z-10 bg-background p-1 rounded-md">
                <div class='flex flex-col gap-1'>
                    <Button variant='ghost' size='icon' class='data-[state=on]:bg-accent'
                    data-state={inputModeIdx === 0 ? "on" : "off"}
                    onclick={() => inputModeIdx = 0}>
                        <Icon width={24} icon='material-symbols:arrow-selector-tool' style="margin: auto;"/>
                    </Button>
                    <Button variant='ghost' size='icon' class='data-[state=on]:bg-accent'
                    data-state={inputModeIdx === 1 ? "on" : "off"}
                    onclick={() => inputModeIdx = 1}>
                        <Icon width={24} icon='material-symbols:add-box-outline-rounded' style="margin: auto;"/>
                    </Button>
                </div>
            </div>
            <canvas bind:this={canvas} class=""></canvas>
        </div>
    </Resizable.Pane>
</Resizable.PaneGroup>