<script lang="ts">
    import { onMount } from 'svelte';
    import * as THREE from 'three'

    let scene: THREE.Scene;
    let camera: THREE.Camera;
    let renderer: THREE.WebGLRenderer;

    onMount(() => {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

        renderer = new THREE.WebGLRenderer();
        renderer.setSize( window.innerWidth, window.innerHeight );
        document.getElementById('canvas')?.appendChild(renderer.domElement);
    });
</script>

<div id='canvas'/>

