<script lang="ts">
    import { onMount } from 'svelte';
    import * as THREE from 'three'
    import CellMaterial from './CellMaterial';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let controls: OrbitControls;

    let cellMaterial: THREE.ShaderMaterial;
    let cellGeometry: THREE.InstancedBufferGeometry;
    let cellMesh: THREE.Mesh;

    onMount(() => {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        camera.position.z += 1;

        renderer = new THREE.WebGLRenderer();
        renderer.setClearAlpha(0);
        renderer.setClearColor(0);
        renderer.setSize( window.innerWidth, window.innerHeight );
        document.getElementById('canvas')?.appendChild(renderer.domElement);

        controls = new OrbitControls(camera, renderer.domElement);

        cellMaterial = CellMaterial;

        cellGeometry = new THREE.InstancedBufferGeometry();
        cellGeometry.instanceCount = 1;
        const vertices = new Float32Array( [
            0, 0, 0,
            1, 0, 0,
            1, 1, 0,
            0, 1, 0,
        ] );
        const localVerticies = new Float32Array( [
            -1, -1, 0,
            1, -1, 0,
            1, 1, 0,
            -1, 1, 0,
        ] );
        const indices = [
            0, 1, 2,
            2, 3, 0,
        ];
        cellGeometry.setIndex( indices );
        cellGeometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
        cellGeometry.setAttribute( 'localPosition', new THREE.BufferAttribute( localVerticies, 3 ) );

        cellMesh = new THREE.Mesh(cellGeometry, cellMaterial);

        scene.add(cellMesh);
        //scene.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()))
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

