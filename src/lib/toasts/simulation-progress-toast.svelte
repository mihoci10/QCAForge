<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Progress } from "$lib/components/ui/progress";
    import { EVENT_SIMULATION_PROGRESS } from "$lib/utils/events";
    import { listen } from "@tauri-apps/api/event";
    let progress = $state(NaN);

    const unlisten = listen<number>(EVENT_SIMULATION_PROGRESS, (event) => {
        progress = event.payload;
        progress = Math.round((progress + Number.EPSILON) * 100) / 100
    });

</script>

<div class="flex flex-row gap-1 w-80">
    {#if !isNaN(progress)}
        <div class='w-full'>
            Simulation progress: {progress}%
            <Progress value={progress} class='w-full'/>
        </div>
		<div class='grow'></div>
        <Button disabled={isNaN(progress)} variant='destructive'>Cancel</Button>
    {:else}
        Simulation is starting...
    {/if}
</div>