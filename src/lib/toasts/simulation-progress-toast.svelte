<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Progress } from "$lib/components/ui/progress";
    import { EVENT_SIMULATION_PROGRESS } from "$lib/utils/events";
    import { listen } from "@tauri-apps/api/event";
    let progress = $state(NaN);

    const unlisten = listen<number>(EVENT_SIMULATION_PROGRESS, (event) => {
        progress = event.payload;
    });

</script>

<div class="flex flex-row w-full gap-1">
    {#if !isNaN(progress)}
        <div>
            Simulation progress: {progress}%
            <Progress value={progress}/>
        </div>
		<div class='grow'></div>
        <Button>Cancel</Button>
    {:else}
        Simulation is starting...
    {/if}
</div>