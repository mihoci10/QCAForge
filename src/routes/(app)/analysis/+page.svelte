<script lang="ts">
    import Analyzer from "$lib/analysis/analyzer.svelte";
    import { simulation } from "$lib/globals";
    import type { QCASimulation } from "$lib/qca-simulation";

    let qcaSimulation: QCASimulation | undefined = $state(undefined);
    
    simulation.subscribe((sim: QCASimulation) => {
        qcaSimulation = sim;
    });
</script>

<div class="w-full flex flex-col">
    <Analyzer {qcaSimulation}/>
</div>