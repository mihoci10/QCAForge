<script lang="ts">
    import { EVENT_SIMULATION_PROGRESS } from "$lib/utils/events";
    import { listen } from "@tauri-apps/api/event";
    import { onMount } from "svelte";

    let progress = $state(NaN);
    let remaining_time = $state(NaN);

    const averaging_window = 100;
    const averaging_window_min = 10;
    let progress_history: number[];
    let time_history: number[];

    onMount(() => {
        progress_history = [];
        time_history = [];

        const unlisten = listen<number>(EVENT_SIMULATION_PROGRESS, (event) => {
            let new_progress = event.payload;
            progress = Math.round((new_progress + Number.EPSILON) * 100) / 100;

            progress_history.push(progress);
            time_history.push(Date.now());
            if (progress_history.length < averaging_window_min)
                return;

            if (progress_history.length > averaging_window) {
                progress_history.shift();
                time_history.shift();
            }

            // Calculate the average progress and time
            let avg_progress = 0;
            for (let i = 0; i < progress_history.length - 1; i++) {
                avg_progress += (progress_history[i + 1] - progress_history[i]) / (time_history[i + 1] - time_history[i]);
            }
            avg_progress /= (progress_history.length - 1);

            // Calculate the remaining time
            remaining_time = (100 - progress) / avg_progress;
        });
    });

</script>

<div>
    {#if !isNaN(progress)}
    <div>
        Simulation progress: {progress}%
    </div>
    <div class='text-sm text-gray-500'>
        Time remaining: 
        <span class='font-bold'>
            {#if !isNaN(remaining_time)}
                {Math.round(remaining_time / 1000)} seconds
            {:else}
                Estimating...
            {/if}
        </span>
    </div>
    {:else}
        Simulation is starting...
    {/if}
</div>