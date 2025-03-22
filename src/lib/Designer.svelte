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
    import { Menu, MenuItem } from "@tauri-apps/api/menu";
    import Button from "./components/ui/button/button.svelte";
    import Icon from "@iconify/svelte";
    import InfiniteGrid from "./utils/infinite-grid";
    import { writeText, readText } from "@tauri-apps/plugin-clipboard-manager";

    import { register, unregister } from '@tauri-apps/plugin-global-shortcut';

    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let controls: OrbitControls;
    let container: HTMLElement|undefined = $state(); 
    let canvas: HTMLCanvasElement|undefined = $state();

    let globalScene: THREE.Scene;
    let cellScene: CellScene;

    let infinite_grid: InfiniteGrid;
    let ghostGeometry: CellGeometry;
    let snapDivider: number = 20;

    let stats: Stats;
    let statsDrawCall: Stats.Panel;

    let inputModeIdx: number = $state(0);

    let mouseStartPos: THREE.Vector2|undefined;
    let current_mouse_pos: THREE.Vector2|undefined;
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
        camera = new THREE.PerspectiveCamera( 75, 1, 0.1, 3000 );
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
        stats.dom.style.position = 'absolute';
        stats.dom.style.left = '';
        stats.dom.style.top = '';
        stats.dom.style.right = '1px';
        stats.dom.style.bottom = '1px';
        container!.appendChild(stats.dom)
        statsDrawCall = stats.addPanel(new Stats.Panel('Draw calls', '#ff8', '#221'));
        stats.showPanel(0);

        renderer.domElement.addEventListener('mousedown', mouseDown);
        renderer.domElement.addEventListener('mousemove', mouseMove);
        renderer.domElement.addEventListener('mouseup', mouseUp);
        window.addEventListener('keydown', keyDown);
        window.addEventListener('keyup', keyUp);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableRotate = false;

        infinite_grid = new InfiniteGrid(20, 100, new THREE.Color('white'), 8000, 'xyz');

        ghostGeometry = new CellGeometry(true);
        globalScene.add(infinite_grid);

        cellScene.addLayer(0);

        renderer.setAnimationLoop(render);
        
        drawCurrentLayer();

        registerKeyboardShortcuts();
    });

    onDestroy(() => {
        unregisterKeyboardShortcuts();
        renderer.dispose();
        ghostGeometry.dispose();
        DrawableCellMaterial.dispose();
        PickableCellMaterial.dispose();
    });

    function windowResize(){
        renderer.setSize( container!.clientWidth * devicePixelRatio, container!.clientHeight * devicePixelRatio, false);
        camera.aspect = container!.clientWidth / container!.clientHeight; 
        camera.updateProjectionMatrix();
        render();
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
                startCellPlace(mousePos);
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
                endCellPlace(mousePos);
        }
        
        mouseStartPos = undefined;
        mouseDragging = false;
    }

    function mouseMove(e: MouseEvent){
        current_mouse_pos = getMouseEventPos(e);

        if (inputMode == 0){
            if (mouseStartPos != undefined && mouseDragging){
                repositionCells(current_mouse_pos);
            }
        }
        else if (inputMode == 1){
            repositionGhostMesh(current_mouse_pos);
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

    function screenSpaceToWorld(pos: THREE.Vector2): THREE.Vector3{
        const mousePos = new THREE.Vector3(
            ( (pos.x) / renderer.domElement.width ) * 2 - 1,
            - ( (pos.y) / renderer.domElement.height ) * 2 + 1,
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

    function startCellPlace(mouse_pos: THREE.Vector2){

    }

    function endCellPlace(mouse_pos: THREE.Vector2){
        calculate_ghost_positions(mouse_pos).forEach((pos) => {
            layers[selectedLayer].cells.push({
                position: [pos.x, pos.y], clock_phase_shift: 0, typ: CellType.Normal,
                rotation: 0,
                dot_probability_distribution: new Array(layers[selectedLayer].cell_architecture.dot_count).fill(0.0)
            })
        });
        drawCurrentLayer();
    }

    function applySnapping(pos: THREE.Vector2){
        return new THREE.Vector2(
            Math.floor((pos.x + snapDivider / 2) / snapDivider) * snapDivider,
            Math.floor((pos.y + snapDivider / 2) / snapDivider) * snapDivider
        );
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

    function repositionCells(mouse_pos: THREE.Vector2){
        let orig_world_pos = screenSpaceToWorld(mouseStartPos!);
        const adjusted_orig_pos = applySnapping(new THREE.Vector2(orig_world_pos.x, orig_world_pos.y));

        let world_pos = screenSpaceToWorld(mouse_pos);
        const adjusted_world_pos = applySnapping(new THREE.Vector2(world_pos.x, world_pos.y));

        let diff_x = adjusted_world_pos.x - adjusted_orig_pos.x;
        let diff_y = adjusted_world_pos.y - adjusted_orig_pos.y;

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

    function calculate_ghost_positions(mouse_pos: THREE.Vector2): THREE.Vector2[] {
        const world_pos = screenSpaceToWorld(mouse_pos);
        const adjusted_world_pos = applySnapping(new THREE.Vector2(world_pos.x, world_pos.y));

        if (!mouseStartPos)
            return [adjusted_world_pos];

        const orig_world_pos = screenSpaceToWorld(mouseStartPos);
        const adjusted_orig_world_pos = applySnapping(new THREE.Vector2(orig_world_pos.x, orig_world_pos.y));

        const cell_size = layers[selectedLayer].cell_architecture.side_length;
        const offset = new THREE.Vector2();

        const diff = world_pos.clone().sub(orig_world_pos);
        if (Math.abs(diff.x) > Math.abs(diff.y))
            offset.x = Math.sign(diff.x) * cell_size;
        else
            offset.y = Math.sign(diff.y) * cell_size;

        const cell_positions = [];
        let current_pos = adjusted_orig_world_pos.clone();

        while (
            (offset.x != 0 && Math.abs(current_pos.x - world_pos.x) > cell_size) ||
            (offset.y != 0 && Math.abs(current_pos.y - world_pos.y) > cell_size))
        {
            cell_positions.push(current_pos.clone());
            current_pos.add(offset);
        }
        cell_positions.push(current_pos.clone());
        return cell_positions;
    }
    

    function repositionGhostMesh(mouse_pos: THREE.Vector2){
        const cell_positions = calculate_ghost_positions(mouse_pos);
        ghostGeometry.update(cell_positions.map((pos) => {
            return {
                position: [pos.x, pos.y], clock_phase_shift: 0, typ: CellType.Normal,
                rotation: 0,
                dot_probability_distribution: new Array(layers[selectedLayer].cell_architecture.dot_count).fill(0.0)
            }
        }), new Set(), layers[selectedLayer].cell_architecture);
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

    function saveCellsToClipboard(cell_ids: Set<CellIndex>){
        let cells = new Array<Cell>();
        cell_ids.forEach((id) => {
            cells.push(layers[id.getLayer()].cells[id.getCell()]);
        });

        writeText(JSON.stringify(cells));
    }

    async function pasteCellsFromClipboard(){
        readText().then((text) => {
            let cells = JSON.parse(text) as Cell[];

            const centroid = cells.reduce((acc, cell) => {
                return new THREE.Vector2(acc.x + cell.position[0], acc.y + cell.position[1]);
            }, new THREE.Vector2(0, 0)).divideScalar(cells.length);

            const snapped_centroid = applySnapping(centroid);
            const world_pos = screenSpaceToWorld(current_mouse_pos!);
            const snapped_world_pos = applySnapping(new THREE.Vector2(world_pos.x, world_pos.y));
            const pos_diff = snapped_world_pos.sub(snapped_centroid);

            cells.forEach((cell) => {
                cell.position[0] += pos_diff.x;
                cell.position[1] += pos_diff.y;
            });

            const number_of_cells = layers[selectedLayer].cells.length;
            layers[selectedLayer].cells = layers[selectedLayer].cells.concat(cells);
            selectedCells.clear();
            for (let i = 0; i < cells.length; i++) {
                selectedCells.add(new CellIndex(selectedLayer, number_of_cells + i));
            }
            selectedCellsUpdated();

            drawCurrentLayer();
        });
    }

    async function showContextMenu(){
        const menu = await Menu.new({
            items: [
                {
                    text: 'Copy',
                    accelerator: 'CommandOrControl+C',
                    action: () => {
                        saveCellsToClipboard(selectedCells);
                    },
                    enabled: !selectedCells.isEmpty()
                },
                {
                    text: 'Paste',
                    accelerator: 'CommandOrControl+V',
                    action: () => {
                        pasteCellsFromClipboard();
                    }
                }
            ]
        });
        menu.popup();
    }

    function registerKeyboardShortcuts(){
        register('CommandOrControl+C', (event) => {
            if (event.state == 'Pressed')
                saveCellsToClipboard(selectedCells);
        });
        register('CommandOrControl+V', (event) => {
            if (event.state == 'Pressed')
                pasteCellsFromClipboard();
        });
    }

    function unregisterKeyboardShortcuts(){
        unregister('CommandOrControl+C');
        unregister('CommandOrControl+V');
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

    function layerAddedCallback(layerId: number){
        cellScene.addLayer(layerId);
    }

    function layerRemovedCallback(layerId: number){
        cellScene.removeLayer(layerId);
    }

    function layerMovedCallback(oldLayerId: number, newLayerId: number){
        cellScene.moveLayer(oldLayerId, newLayerId);
    }
</script>

<Resizable.PaneGroup direction="horizontal">
    <Resizable.Pane defaultSize={30} minSize={10}>
        <div class='h-full bg-surface-500 overflow-y-auto pr-2'>
            <Accordion.Root type="multiple">
                <SimSettingsPanel bind:selected_model_id={selected_model_id} {simulation_models}/>
                <LayersPanel bind:layers={layers} bind:selectedLayer={selectedLayer} {layerAddedCallback} {layerRemovedCallback} {layerMovedCallback} />
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