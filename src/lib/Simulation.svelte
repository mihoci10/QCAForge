<script lang="ts">
	import Designer from "$lib/Designer.svelte";
    import type { Cell } from "./Cell";
    
    let selected_model: any;
    let runSimulation: any;
</script>

<div class="h-screen flex flex-col">
    <div class='my-1'>
        <div class="flex flex-row float-right">
            <button type="button" class="btn variant-filled mx-2" disabled={!selected_model} on:click={(e) => runSimulation()}>
                Run
            </button>
        </div>
    </div>
    <Designer bind:selected_model={selected_model} bind:runSimulation={runSimulation}/>
</div>