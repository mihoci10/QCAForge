<script lang="ts">
    import { Label } from "$lib/components/ui/label";
    import * as Switch from "$lib/components/ui/switch";
    import { Slider } from "$lib/components/ui/slider";

    export interface TruthTableProps {
        showRowNumbers: boolean;
        clockTreshold: number;
        logicalThreshold: number;
    }

    interface Props {
        props: TruthTableProps;
    }
    
    let { 
        props = $bindable(),
    }: Props = $props();
</script>

<div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
        <Label for="show-row-numbers" class="text-sm font-medium">Show Row Numbers</Label>
        <Switch.Root id="show-row-numbers" bind:checked={props.showRowNumbers}>
        </Switch.Root>
    </div>
      <div class="flex flex-col gap-2">
        <Label for="clock-threshold" class="text-sm font-medium">Clock Threshold: {(props.clockTreshold * 100).toFixed(0)}%</Label>
        <Slider type='single' id="clock-threshold" min={0} max={0.5} step={0.01} bind:value={props.clockTreshold} />
    </div>
    
    <div class="flex flex-col gap-2">
        <Label for="logical-threshold" class="text-sm font-medium">Logical Threshold: {(props.logicalThreshold * 100).toFixed(0)}%</Label>
        <Slider type='single' id="logical-threshold" min={0} max={0.5} step={0.01} bind:value={props.logicalThreshold} />
    </div>
</div>
