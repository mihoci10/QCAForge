<script lang="ts">
    import { CellIndex, generateDotDistribution, getPolarization, type Cell, type CellType } from "$lib/Cell";
    import { type Layer } from "$lib/Layer";
    import Icon from "@iconify/svelte";
    import * as Accordion from "$lib/components/ui/accordion";
    import { Input } from "$lib/components/ui/input";
    import { Set } from 'typescript-collections'
    import * as Select from "$lib/components/ui/select";
    import Label from "$lib/components/ui/label/label.svelte";

    let selectedClockMode: string|undefined = $state();
    let selectedCellType: string|undefined = $state();
    let polarizationInput: number[] = $state([]);

    interface Props {
        layers: Layer[];
        selectedCells: Set<CellIndex>;
    }

    let { layers = $bindable(), selectedCells }: Props = $props();

    function selectedClockModeChanged(newClockMode: string){
        selectedClockMode = newClockMode;

        if (isNaN(+selectedClockMode))
            return;

        const clock_phase_shift = parseInt(selectedClockMode);

        selectedCells.forEach((id) => {
            layers[id.getLayer()].cells[id.getCell()].clock_phase_shift = clock_phase_shift;
        });
    }

    function selectedCellTypeChanged(newCellType: string){
        selectedCellType = newCellType;

        if (isNaN(+selectedCellType))
            return;

        const cellType = parseInt(selectedCellType);

        selectedCells.forEach((id) => {
            layers[id.getLayer()].cells[id.getCell()].typ = cellType as CellType;
        });
    }

    function polarizationInputChanged(){
        if (polarizationInput.reduce((acc, v) => acc || isNaN(v), false))
            return;

        selectedCells.forEach((id) => {
            layers[id.getLayer()].cells[id.getCell()].dot_probability_distribution = generateDotDistribution(polarizationInput);
        });
    }

    export function selectedCellsUpdated(){
        let clockModes: Set<number> = new Set();
        let cellTypes: Set<CellType> = new Set();
        let polarizations : Set<number>[] = [];
        let cellArchitecture: Set<number> = new Set();

        selectedCells.forEach((id) => {
            const cell = layers[id.getLayer()].cells[id.getCell()];
            clockModes.add(cell.clock_phase_shift);
            cellTypes.add(cell.typ);
            const polarization = getPolarization(cell);
            cellArchitecture.add(polarization.length);

            while (polarization.length > polarizations.length)
                polarizations.push(new Set<number>)
            for (let i = 0; i < polarization.length; i++)
                polarizations[i].add(polarization[i]);
        });
        
        if (clockModes.size() > 1)
            selectedClockMode = 'multiple';
        else if (clockModes.size() == 1)
            selectedClockMode = (clockModes.toArray()[0]).toString();
        
        if (cellTypes.size() > 1)
            selectedCellType = 'multiple';
        else if (cellTypes.size() == 1)
            selectedCellType = (cellTypes.toArray()[0]).toString();
        
        if (cellArchitecture.size() > 1)
            polarizationInput = [NaN];
        else {
            let equalCheck = polarizations.reduce((acc, v) => acc && (v.size() == 1), true)
            if (equalCheck)
                polarizationInput = polarizations.map((v) => v.toArray()[0]);
            else
                polarizationInput = new Array(polarizations.length).fill(NaN);
        }
    }

    const selected_clock_display = $derived((() => {
        switch(selectedClockMode){
            case '0': return '0 degrees';
            case '90': return '90 degrees';
            case '180': return '180 degrees';
            case '270': return '270 degrees';
            case 'multiple': return 'Multiple';
            default: return 'Select phase shift';
        }
    })());
    const selected_type_display = $derived((() => {
        switch(selectedCellType){
            case '0': return 'Normal';
            case '1': return 'Input';
            case '2': return 'Output';
            case '3': return 'Fixed';
            case 'multiple': return 'Multiple';
            default: return 'Select type';
        }
    })());

</script>

<Accordion.Item value="cell-props">
    <Accordion.Trigger>
        <div class="flex items-center gap-1.5">
            Cell properties
            <Icon icon="material-symbols:build-rounded"/>
        </div>
    </Accordion.Trigger>
    <Accordion.Content>
        <div class="flex flex-col gap-2 px-1">
            <div class="flex flex-col gap-1.5">
                <Label>Clock phase shift</Label>
                <Select.Root bind:value={selectedClockMode} onValueChange={selectedClockModeChanged} type="single">
                    <Select.Trigger>
                        {selected_clock_display}
                    </Select.Trigger>
                    <Select.Content>
                        <Select.Item value="0" label='0 degrees'/>
                        <Select.Item value="90" label='90 degrees'/>
                        <Select.Item value="180" label='180 degrees'/>
                        <Select.Item value="270" label='270 degrees'/>
                    </Select.Content>
                </Select.Root>
            </div>
            <div class="flex flex-col gap-1.5">
                <Label>Cell type</Label>
                <Select.Root bind:value={selectedCellType} onValueChange={selectedCellTypeChanged} type="single">
                    <Select.Trigger>
                        {selected_type_display}
                    </Select.Trigger>
                    <Select.Content>
                        <Select.Item value="0" label='Normal'/>
                        <Select.Item value="1" label='Input'/>
                        <Select.Item value="2" label='Output'/>
                        <Select.Item value="3" label='Fixed'/>
                    </Select.Content>
                </Select.Root>
            </div>
            <div class="flex flex-col gap-1.5">
                {#if polarizationInput && polarizationInput.length > 0}
                <Label>Polarization</Label>
                {#each polarizationInput as polarization, i}
                    {#if polarizationInput.length > 1}
                        <div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
                            <div class="input-group-shim bg-tertiary">{'ABCDE'.at(i)}</div>
                            <input class='input' type="number" min="-1" max="1" step="0.1" value={polarization}/>
                            <Input type='number' min="-1" max="1" step="0.1" bind:value={polarizationInput[i]} onchange={polarizationInputChanged}/>
                        </div>
                    {:else}
                        <Input type='number' min="-1" max="1" step="0.1" bind:value={polarizationInput[i]} onchange={polarizationInputChanged}/>
                    {/if}
                {/each}
                {/if}
            </div> 
            <div class="flex flex-col gap-1.5">
                <Label>Position</Label>
                <div class='flex gap-2'>
                    <div class="flex">
                        <div class='bg-red-500 flex items-center px-2'>X</div>
                        <Input 
                            type="number" 
                            step="1"

                        />
                    </div>
                    <div class="flex">
                        <div class='bg-green-500 flex items-center px-2'>Y</div>
                        <Input 
                            type="number" 
                            step="1"
                        />
                    </div>
                </div>
            </div>
        </div>
    </Accordion.Content>
</Accordion.Item>