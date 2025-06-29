<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Slider } from "$lib/components/ui/slider";
	import Icon from "@iconify/svelte";

	interface Props {
		inputModeIdx: number;
		snapEnabled: boolean;
		snapDivider: number;
	}

	let {
		inputModeIdx = $bindable(),
		snapEnabled = $bindable(),
		snapDivider = $bindable(),
	}: Props = $props();

	const INPUT_BAR_POS = "top-2 left-1";
	const SNAP_BAR_POS = "top-2 left-20";
</script>

<div class="absolute {INPUT_BAR_POS} z-10 bg-background p-1 rounded-md">
	<div class="flex flex-col gap-1">
		<Button
			variant="ghost"
			size="icon"
			class="data-[state=on]:bg-accent"
			data-state={inputModeIdx === 0 ? "on" : "off"}
			onclick={() => (inputModeIdx = 0)}
		>
			<Icon width={24} icon="material-symbols:arrow-selector-tool" />
		</Button>
		<Button
			variant="ghost"
			size="icon"
			class="data-[state=on]:bg-accent"
			data-state={inputModeIdx === 1 ? "on" : "off"}
			onclick={() => (inputModeIdx = 1)}
		>
			<Icon width={24} icon="material-symbols:add-box-outline-rounded" />
		</Button>
	</div>
</div>
<div class="absolute {SNAP_BAR_POS} z-10 bg-background p-1 rounded-md">
	<div class="flex-row gap-1">
		<div class="flex flex-row">
			<Button
				variant="ghost"
				size="icon"
				class="data-[state=on]:bg-accent border-r-0"
				data-state={snapEnabled ? "on" : "off"}
				onclick={() => (snapEnabled = !snapEnabled)}
			>
				<Icon width={24} icon="material-symbols:grid-on-outline" />
			</Button>
			<Input
				class="w-12 p-1 border-l-0"
				bind:value={snapDivider}
				type="number"
				min={1}
				max={500}
				step={1}
			/>
		</div>
	</div>
</div>
