<script lang='ts'>
    import { onDestroy, onMount } from "svelte";
    import * as d3 from 'd3';
    import type { Input, QCASimulation, SignalIndex } from "$lib/qca-simulation";
    import BaseDataVis from "./base-data-vis.svelte";
    import { COLORS } from "$lib/utils/visual-colors";
    import { calculateSize } from "@iconify/svelte";

    type Props = {
        qcaSimulation: QCASimulation | undefined;
		title: string;
		inputs: Input[];
	};
 
	let {
        qcaSimulation,
		title,
		inputs,
	}: Props = $props();

    let rootDivElement: HTMLDivElement;

    onMount(() => {
    });

    onDestroy(() => {
    });

    function beforeLoadData() {
    }

    function loadInputData(input: Input, data: Float64Array[]) {
        
    }

    function afterLoadData() {
        calculate();
    }

    function calculate(){

    }

</script>

<BaseDataVis {qcaSimulation} {title} {inputs} {beforeLoadData} {loadInputData} {afterLoadData}>
    <div bind:this={rootDivElement}>

    </div>
</BaseDataVis>