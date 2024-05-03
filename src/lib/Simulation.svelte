<script lang="ts">
	import Designer from "$lib/Designer.svelte";
    import type { Cell } from "./Cell";
    
    let cells: Cell[];
</script>

<div class="h-screen flex flex-col">
    <Designer bind:cells={cells}/>
</div>