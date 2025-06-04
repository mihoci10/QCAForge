<script lang="ts">
    import { Label } from "$lib/components/ui/label";
    import { Input } from "$lib/components/ui/input";
    import * as Select from "$lib/components/ui/select";
    import * as Switch from "$lib/components/ui/switch";    
      
    export interface LinePlotProps {
        numTicksX: number;
        numTicksY: number;
        showDots: boolean;
        lineWidth: number;
        showLegend: boolean;
        legendPosition: 'upper left' | 'upper center' | 'upper right' | 'center left' | 'center' | 'center right' | 'lower left' | 'lower center' | 'lower right' | 'best';
    }

    interface Props {
        props: LinePlotProps;
    }
    
    let { 
        props = $bindable(),
    }: Props = $props();

    const LEGEND_POSITIONS= {
        'upper left': 'Upper Left',
        'upper center': 'Upper Center',
        'upper right': 'Upper Right',
        'center left': 'Center Left',
        'center': 'Center',
        'center right': 'Center Right',
        'lower left': 'Lower Left',
        'lower center': 'Lower Center',
        'lower right': 'Lower Right',
        'best': 'Best'
    }

</script>

<div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
        <Label for="show-dots" class="text-sm font-medium">Show Data Points</Label>
        <Switch.Root id="show-dots" bind:checked={props.showDots}>
        </Switch.Root>
    </div>
    
    <div class="flex flex-col gap-2">
        <Label for="ticks-x" class="text-sm font-medium">X-Axis Ticks</Label>
        <Input 
            id="ticks-x"
            type="number" 
            min={2}
            max={20}
            step={1}
            bind:value={props.numTicksX}
        />
    </div>
      <div class="flex flex-col gap-2">
        <Label for="ticks-y" class="text-sm font-medium">Y-Axis Ticks</Label>
        <Input 
            id="ticks-y"
            type="number" 
            min={2}
            max={20}
            step={1}
            bind:value={props.numTicksY}
        />
    </div>
      <div class="flex flex-col gap-2">
        <Label for="line-width" class="text-sm font-medium">Line Width</Label>
        <Input 
            id="line-width"
            type="number" 
            min={0.5}
            max={10}
            step={0.5}
            bind:value={props.lineWidth}
        />
    </div>
    
    <div class="flex items-center justify-between">
        <Label for="show-legend" class="text-sm font-medium">Show Legend</Label>
        <Switch.Root id="show-legend" bind:checked={props.showLegend}>
        </Switch.Root>
    </div>
    
    <div class="flex flex-col gap-2">
        <Label for="legend-position" class="text-sm font-medium">Legend Position</Label>
        <Select.Root type='single' bind:value={props.legendPosition}>
            <Select.Trigger>
                {#if props.legendPosition}
                    {LEGEND_POSITIONS[props.legendPosition] || 'Select Position'}
                {:else}
                    Select Position
                {/if}
            </Select.Trigger>
            <Select.Content>
                {#each Object.entries(LEGEND_POSITIONS) as [value, label]}
                    <Select.Item value={value} label={label}/>
                {/each}
            </Select.Content>
        </Select.Root>
    </div>
</div>