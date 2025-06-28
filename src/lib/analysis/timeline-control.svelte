<script lang="ts">
	import type { QCASimulation } from "$lib/qca-simulation";
	import Icon from "@iconify/svelte";
	import {Slider} from "$lib/components/ui/slider";
	import { Button } from "$lib/components/ui/button";
    import * as Select from "$lib/components/ui/select";

	interface Props {
		qcaSimulation: QCASimulation | undefined;
        currentSample: number;
	}

	let {
		qcaSimulation,
        currentSample = $bindable(0)
	}: Props = $props();

    let playbackSpeed = $state(1);

    let playbackInterval: number | undefined = $state(undefined);
    let isPlaying = $derived(playbackInterval !== undefined);

	let maxSample = $derived(qcaSimulation?.metadata.num_samples || 1); 
	let currentSamplePercent = $derived((currentSample / maxSample) * 100);

	function formatTime(sample: number): string {
		if (!qcaSimulation) return "NaN";
		
		return sample.toString();
	}

	// Speed options
	const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 4, 8];

    function onTimeChange(value: number) {
        currentSample = value;
    }
    function onPlayPause() {
        if (isPlaying) {
            stopPlayback();
        } else {
            startPlayback();
        }
    }
    function onSpeedChange(speed: string) {
        const parsedSpeed = parseFloat(speed);
        if (!isNaN(parsedSpeed)) {
            playbackSpeed = parsedSpeed;
            if (isPlaying) {
                startPlayback(); // Restart playback with new speed
            }
        }
    }

    function startPlayback() {
        if (!qcaSimulation) return;

        if (playbackInterval) {
            window.clearInterval(playbackInterval);
        }

        const intervalTime = 50 / playbackSpeed;

        playbackInterval = window.setInterval(() => {
            currentSample += 1;
            if (currentSample > maxSample) {
                currentSample = maxSample;
                stopPlayback();
                return;
            }
        }, intervalTime);
    }

    function stopPlayback() {
        window.clearInterval(playbackInterval);
        playbackInterval = undefined;
    }
</script>

<div class="bg-surface-600 border-t border-border p-3">
	<div class="flex items-center gap-4">
		<!-- Play/Pause Button -->
		<Button
			variant="ghost"
			size="sm"
			onclick={onPlayPause}
			disabled={!qcaSimulation}
			class="flex items-center gap-1"
		>
			<Icon
				icon={isPlaying ? "material-symbols:pause" : "material-symbols:play-arrow"}
				width={20}  
			/>
		</Button>

		<!-- Current Time Display -->
		<div class="text-sm font-mono min-w-[4rem]">
			{formatTime(currentSample)}
		</div>

		<!-- Timeline Slider -->
		<div class="flex-1 px-2">
			<Slider
                type='single'
				value={currentSample}
				max={maxSample}
				min={0}
				step={1}
				disabled={!qcaSimulation}
				onValueChange={(value) => onTimeChange(value)}
				class="relative"
                />
		</div>

		<!-- Total Duration -->
		<div class="text-sm font-mono text-muted-foreground min-w-[4rem]">
			{formatTime(maxSample)}
		</div>

		<!-- Speed Control -->
		<div class="flex items-center gap-2">
			<span class="text-sm text-muted-foreground">Speed:</span>
            <Select.Root type="single" value={playbackSpeed.toString()} onValueChange={onSpeedChange} disabled={!qcaSimulation}>
                <Select.Trigger>
                    {playbackSpeed.toString()}x
                </Select.Trigger>
                <Select.Content>
                    {#each SPEED_OPTIONS as speed}
					    <Select.Item value={speed.toString()} label='{speed}x' />
				    {/each}
                </Select.Content>
            </Select.Root>
		</div>

		<!-- Progress Indicator -->
		<div class="text-sm text-muted-foreground">
			{Math.round(currentSamplePercent)}%
		</div>
	</div>
</div>
