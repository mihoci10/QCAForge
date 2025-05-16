<script lang='ts'>
    import { onDestroy, onMount } from "svelte";
    import * as d3 from 'd3';
    import type { QCASimulation, SignalIndex } from "$lib/qca-simulation";
    import BaseDataVis from "./base-data-vis.svelte";
    import { COLORS } from "$lib/utils/visual-colors";
    import { calculateSize } from "@iconify/svelte";

    type Props = {
        qcaSimulation: QCASimulation | undefined;
		title: string;
		signals: SignalIndex[];
	};
 
	let {
        qcaSimulation,
		title,
		signals,
	}: Props = $props();

    let rootDivElement: HTMLDivElement;

    onMount(() => {
    });

    onDestroy(() => {
    });

    function beforeLoadData() {
    }

    function loadSignalData(signalIndex: SignalIndex, data: Float64Array) {
        if (!qcaSimulation)
            return;
        
        const cell = qcaSimulation.getCell()
    }

    function afterLoadData() {
        calculate();
    }

    function calculate(){

    }

</script>

<BaseDataVis {qcaSimulation} {title} {signals} {beforeLoadData} {loadSignalData} {afterLoadData}>
    <div bind:this={rootDivElement}>

    </div>
</BaseDataVis>