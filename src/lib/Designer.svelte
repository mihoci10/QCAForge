<script lang="ts">
    import { onMount } from 'svelte';
    import * as THREE from 'three'
    import CellMaterial from './CellMaterial';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { CellGeometry } from './CellGeometry';
    import { CellType, type Cell } from './Cell';

    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let controls: OrbitControls;

    let cellMaterial: THREE.ShaderMaterial;
    let cellGeometry: CellGeometry;
    let cellMesh: THREE.Mesh;

    onMount(() => {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        camera.position.z += 1;

        renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setClearAlpha(0);
        renderer.setClearColor(0);
        renderer.setSize( window.innerWidth, window.innerHeight );
        document.getElementById('canvas')?.appendChild(renderer.domElement);

        controls = new OrbitControls(camera, renderer.domElement);

        cellMaterial = CellMaterial;
        cellGeometry = new CellGeometry();

        let cells: Cell[] = [];
        for (let i = 0; i < 100; i++) {
            for (let j = 0; j < 100; j++) {
                cells.push({type: CellType.Normal, polarization: 1, position: new THREE.Vector3(i, j, 0)})
            }
        }

        cellGeometry.update(cells);

        cellMesh = new THREE.Mesh(cellGeometry.getGeometry(), cellMaterial);

        scene.add(cellMesh);
        
        cellMesh.position.x -= 0.5;
        cellMesh.position.y -= 0.5;

        renderer.setAnimationLoop(render);
    });

    function windowResize(){
        renderer.setSize( window.innerWidth, window.innerHeight );
        camera.aspect = window.innerWidth / window.innerHeight; 
        camera.updateProjectionMatrix();
    }

    function render(){
        controls.update();
        renderer.render(scene, camera);
    }
</script>

<svelte:window on:resize={() => windowResize()}/>

<div id='canvas'/>

